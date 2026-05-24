"""WebSocket endpoint for conversation AI streaming."""
import json
import logging
import time
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.src.auth.service import verify_token
from api.src.conversations.ai_service import ConversationAIService
from api.src.conversations.service import get_conversation_by_id
from api.src.credits.service import add_credits, deduct_credits
from infrastructure.database.setup import async_session_maker
from settings.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/conversations/{conversation_id}")
async def conversation_websocket(websocket: WebSocket, conversation_id: str):
    """WebSocket for conversation-based AI chat.

    Auth via ?token=<jwt> query param.
    Client sends: {"type": "send_message", "content": "..."}
    Server sends event types: plan, token, artifact_complete,
    message_complete, correction, suggestions, error.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing auth token")
        return

    try:
        user_id = await verify_token(token, token_type="access")
    except (ValueError, Exception):
        await websocket.close(code=4001, reason="Invalid token")
        return

    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    conv_uuid = UUID(conversation_id)

    # Verify user owns conversation
    async with async_session_maker() as db:
        try:
            await get_conversation_by_id(conv_uuid, user_id, db)
        except Exception:
            await websocket.close(code=4003, reason="Access denied")
            return

    await websocket.accept()
    logger.info("Conversation WS connected: %s user=%s", conversation_id, user_id)

    last_message_time: float = 0

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "send_message":
                # Rate limiting: 5 seconds between messages
                current_time = time.time()
                if current_time - last_message_time < 5:
                    await websocket.send_json({
                        "type": "error",
                        "error": "Подождите перед отправкой следующего сообщения",
                    })
                    continue
                last_message_time = current_time

                content = msg.get("content", "")
                if not content or len(content) > 10000:
                    await websocket.send_json({
                        "type": "error",
                        "error": "Invalid message",
                    })
                    continue

                # Pre-check: ensure user has at least MIN_CREDIT_COST credits
                # Actual deduction happens AFTER generation (post-pay)
                min_cost = getattr(settings, "MIN_CREDIT_COST", 1)
                async with async_session_maker() as db:
                    try:
                        from infrastructure.database.repositories.user_repository import (
                            UserRepository,
                        )

                        user_repo = UserRepository(db)
                        user = await user_repo.get_by_id(user_id)
                        if not user or user.credits < min_cost:
                            await websocket.send_json({
                                "type": "error",
                                "error": "Недостаточно кредитов",
                            })
                            continue
                    except Exception as credit_err:
                        await websocket.send_json({
                            "type": "error",
                            "error": f"Credit check failed: {credit_err}",
                        })
                        continue

                # Stream AI response
                # ws_alive tracks whether the WebSocket is still open.
                # If the client minimizes the browser and the socket drops,
                # we stop sending but CONTINUE generating so the result is
                # saved to DB. When the client reconnects it will fetch the
                # completed message via REST (loadConversation).
                generation_error = False
                ws_alive = True
                usage_data = None
                async with async_session_maker() as db:
                    try:
                        ai_service = ConversationAIService(db)
                        async for event in ai_service.send_message_streaming(
                            conv_uuid, content, user_id
                        ):
                            if not ws_alive:
                                # WS is gone — keep consuming generator so DB is updated
                                if event["type"] == "error":
                                    generation_error = True
                                elif event["type"] == "done":
                                    usage_data = event.get("usage")
                                continue

                            try:
                                if event["type"] == "plan":
                                    await websocket.send_json(event)
                                elif event["type"] == "token":
                                    await websocket.send_json(event)
                                elif event["type"] == "final_text":
                                    await websocket.send_json(event)
                                elif event["type"] == "artifact":
                                    artifact = event["artifact"]
                                    await websocket.send_json({
                                        "type": "artifact_complete",
                                        "artifact_id": artifact["id"],
                                        "artifact": artifact,
                                    })
                                elif event["type"] == "done":
                                    usage_data = event.get("usage")
                                    await websocket.send_json({
                                        "type": "message_complete",
                                        "message_id": event["message_id"],
                                        "tokens_used": event.get("tokens_used", 0),
                                    })
                                elif event["type"] == "suggestions":
                                    await websocket.send_json(event)
                                elif event["type"] == "correction":
                                    await websocket.send_json(event)
                                elif event["type"] in ("tool_call", "tool_result", "iteration"):
                                    await websocket.send_json(event)
                                elif event["type"] == "error":
                                    generation_error = True
                                    await websocket.send_json(event)
                            except Exception:
                                # WebSocket closed mid-generation — continue to save to DB
                                ws_alive = False
                                logger.info(
                                    "WS closed mid-generation, continuing to save: %s",
                                    conversation_id,
                                )
                                if event["type"] == "error":
                                    generation_error = True
                    except Exception as gen_err:
                        generation_error = True
                        logger.error(
                            "Generation error: %s %s", conversation_id, gen_err
                        )
                        if ws_alive:
                            try:
                                await websocket.send_json({
                                    "type": "error",
                                    "error": str(gen_err),
                                })
                            except Exception:
                                pass

                # Post-pay: deduct credits based on actual token usage
                if not generation_error and usage_data:
                    try:
                        from api.src.credits.service import calculate_dynamic_cost

                        credit_cost = calculate_dynamic_cost(
                            input_tokens=usage_data.get("input_tokens", 0),
                            output_tokens=usage_data.get("output_tokens", 0),
                        )
                        async with async_session_maker() as db:
                            result = await deduct_credits(
                                user_id=user_id,
                                amount=credit_cost,
                                transaction_type="generation",
                                description=f"AI generation ({usage_data.get('model', 'unknown')})",
                                db=db,
                                token_metadata=usage_data,
                            )
                            await db.commit()

                        remaining = result["balance_after"]
                        logger.info(
                            "Credits deducted (post-pay): user=%s cost=%s remaining=%s tokens=%s",
                            user_id, credit_cost, remaining, usage_data,
                        )

                        # Send credits_used event to client
                        if ws_alive:
                            try:
                                await websocket.send_json({
                                    "type": "credits_used",
                                    "amount": credit_cost,
                                    "remaining": remaining,
                                })
                            except Exception:
                                pass
                    except Exception as deduct_err:
                        logger.error(
                            "Post-pay credit deduction failed: user=%s error=%s",
                            user_id, deduct_err,
                        )
                elif not generation_error and not usage_data:
                    # Fallback: deduct minimum cost if no usage data
                    try:
                        async with async_session_maker() as db:
                            result = await deduct_credits(
                                user_id=user_id,
                                amount=min_cost,
                                transaction_type="generation",
                                description="AI generation (no usage data)",
                                db=db,
                            )
                            await db.commit()
                        if ws_alive:
                            try:
                                await websocket.send_json({
                                    "type": "credits_used",
                                    "amount": min_cost,
                                    "remaining": result["balance_after"],
                                })
                            except Exception:
                                pass
                    except Exception as fallback_err:
                        logger.error(
                            "Fallback credit deduction failed: %s", fallback_err
                        )
            else:
                await websocket.send_json({
                    "type": "error",
                    "error": f"Unknown message type: {msg.get('type')}",
                })

    except WebSocketDisconnect:
        logger.info("Conversation WS disconnected: %s", conversation_id)
    except Exception as e:
        logger.error("Conversation WS error: %s %s", conversation_id, e)
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            pass
