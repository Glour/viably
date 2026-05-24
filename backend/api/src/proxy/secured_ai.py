"""
Secured AI service wrapper - integrates security layer with AI generation.
Usage: Import and use secure_ai_request() to wrap AI calls with security checks.
"""

import time
import structlog
from typing import Dict, Any, AsyncGenerator
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.proxy.security import (
    check_model_whitelist,
    check_request_size,
    check_prompt_injection,
    cap_max_tokens,
    check_rate_limits,
    check_abuse_patterns,
    check_cost_guard,
    track_error,
    track_cost,
    cleanup_concurrent,
)
from api.src.proxy.audit import AuditLogService
from api.src.proxy.oauth_pool import OAuthPoolService
from infrastructure.database.models.auth import User

logger = structlog.get_logger(__name__)


async def secure_ai_request(
    user: User,
    conversation_id: UUID | None,
    model: str,
    messages: list,
    max_tokens: int,
    redis: Redis,
    db: AsyncSession,
) -> tuple[Dict[str, Any], str | None]:
    """
    Run security checks before AI request.
    
    Returns:
        tuple: (modified_request_body, concurrent_key_for_cleanup)
    
    Raises:
        HTTPException: If security checks fail
    """
    start_time = time.time()
    concurrent_key = None

    try:
        # 1. Model whitelist
        await check_model_whitelist(model)

        # 2. Request size limit
        body = {"model": model, "messages": messages, "max_tokens": max_tokens}
        await check_request_size(body)

        # 3. Prompt injection detection
        await check_prompt_injection(messages)

        # 4. Cap max_tokens based on plan
        body = await cap_max_tokens(body, user.plan)

        # 5. Abuse detection
        await check_abuse_patterns(redis, user.id)

        # 6. Rate limiting
        concurrent_key = await check_rate_limits(redis, user.id, user.plan)

        # 7. Cost guard
        await check_cost_guard(
            redis, user.id, user.credits, messages, body.get("max_tokens", max_tokens)
        )

        logger.info(
            "Security checks passed",
            user_id=str(user.id),
            model=model,
            plan=user.plan,
        )

        return body, concurrent_key

    except Exception as e:
        # Track error and cleanup
        await track_error(redis, user.id)
        if concurrent_key:
            await cleanup_concurrent(redis, concurrent_key)
        raise


async def log_ai_request(
    user_id: UUID,
    conversation_id: UUID | None,
    model: str,
    tokens_input: int,
    tokens_output: int,
    cost: int,
    duration_ms: int,
    redis: Redis,
    status: str = "success",
    error: str | None = None,
):
    """
    Log AI request to audit trail and track cost.
    Call this after AI generation completes.
    """
    audit_service = AuditLogService(redis)
    await audit_service.log_request(
        user_id=user_id,
        conversation_id=conversation_id,
        model=model,
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        cost=cost,
        duration_ms=duration_ms,
        status=status,
        error=error,
    )

    # Track cost for abuse detection
    if status == "success":
        await track_cost(redis, user_id, cost)
