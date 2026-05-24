"""WebSocket endpoint for real-time generation progress.

Authenticates via JWT query parameter, subscribes to Redis pub/sub
channel for the user, and relays messages to the WebSocket client.
"""

import asyncio
import logging

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.src.auth.service import verify_token
from settings.config import settings
from core.pubsub import get_generation_channel

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str) -> None:
    """WebSocket endpoint for per-user real-time generation updates.

    Connection flow:
    1. Client connects with ?token=<jwt_access_token>
    2. Server verifies JWT, checks user_id matches token subject
    3. Server subscribes to Redis pub/sub channel 'generation:{user_id}'
    4. Server relays all messages from Redis to WebSocket client
    5. On disconnect: unsubscribe and close cleanly

    Auth error close codes:
    - 4001: Missing or invalid auth token
    - 4003: user_id does not match token subject
    """
    # Extract token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing auth token")
        return

    # Verify JWT token
    try:
        token_user_id = await verify_token(token, token_type="access")
    except ValueError as e:
        await websocket.close(code=4001, reason=f"Invalid token: {e}")
        return

    if token_user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Verify user_id matches token subject
    if str(token_user_id) != user_id:
        await websocket.close(code=4003, reason="User ID mismatch")
        return

    # Accept WebSocket connection
    await websocket.accept()
    logger.info("WebSocket connected", extra={"user_id": user_id})

    # Subscribe to Redis pub/sub channel
    redis_client = aioredis.from_url(
        settings.CELERY_BROKER_URL,
        decode_responses=True,
    )
    pubsub = redis_client.pubsub()
    channel = get_generation_channel(user_id)
    await pubsub.subscribe(channel)

    try:
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=1.0,
            )
            if message and message["type"] == "message":
                try:
                    await websocket.send_text(message["data"])
                except (WebSocketDisconnect, RuntimeError):
                    break
            else:
                # Small sleep to prevent busy-waiting when no messages
                await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected", extra={"user_id": user_id})
    except Exception as e:
        logger.error(
            "WebSocket error",
            extra={"user_id": user_id, "error": str(e)},
        )
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await redis_client.aclose()
        logger.info("WebSocket cleanup done", extra={"user_id": user_id})
