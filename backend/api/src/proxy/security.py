"""
Security middleware for AI requests - adapted from VibeGent agent-platform.
Handles: model whitelist, max_tokens caps, rate limiting, cost guard, abuse detection.
"""

import json
import math
import structlog
from typing import Dict, Any
from uuid import UUID

from redis.asyncio import Redis
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.redis import get_redis

logger = structlog.get_logger(__name__)

# ======================== SECURITY CONFIGURATION ========================

# Model whitelist (Claude models only)
ALLOWED_MODELS = {
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-6",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-5-latest",
    "claude-sonnet-4-6-latest",
    "claude-opus-4-6-latest",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022",
}

# max_tokens cap per plan
MAX_TOKENS_BY_PLAN = {
    "free": 4096,
    "starter": 8192,
    "pro": 16384,
    "business": 32768,
}

# Rate limits by plan (RPM, RPD, concurrent)
RATE_LIMITS = {
    "free": {"rpm": 5, "rpd": 50, "concurrent": 1},
    "starter": {"rpm": 20, "rpd": 500, "concurrent": 3},
    "pro": {"rpm": 40, "rpd": 2000, "concurrent": 5},
    "business": {"rpm": 80, "rpd": 5000, "concurrent": 10},
}

# Request size limit
MAX_REQUEST_SIZE = 500_000  # 500KB

# Abuse detection thresholds
MAX_ERRORS_PER_HOUR = 50
MAX_COST_PERCENT_PER_HOUR = 80  # % of balance

# ========================================================================


async def check_model_whitelist(model: str):
    """Check if model is in whitelist."""
    if not any(allowed in model for allowed in ALLOWED_MODELS):
        logger.warning("Model not allowed", model=model)
        raise HTTPException(status_code=400, detail=f"Model not allowed: {model}")


async def check_request_size(body: Dict[str, Any]):
    """Check request size limit."""
    body_size = len(json.dumps(body).encode("utf-8"))
    if body_size > MAX_REQUEST_SIZE:
        logger.warning("Request too large", size=body_size)
        raise HTTPException(
            status_code=413,
            detail=f"Request too large: {body_size} bytes (max {MAX_REQUEST_SIZE})",
        )


async def check_prompt_injection(messages: list):
    """Basic prompt injection detection."""
    for msg in messages:
        content = str(msg.get("content", "")).lower()
        # Check for common exploit patterns
        if any(
            pattern in content
            for pattern in [
                "ignore previous",
                "disregard instructions",
                "new instructions:",
            ]
        ):
            logger.warning("Potential prompt injection detected", content=content[:100])
            raise HTTPException(status_code=400, detail="Invalid prompt content")


async def cap_max_tokens(body: Dict[str, Any], plan: str) -> Dict[str, Any]:
    """Cap max_tokens based on plan tier."""
    max_tokens_cap = MAX_TOKENS_BY_PLAN.get(plan, 4096)
    if "max_tokens" in body and body["max_tokens"] > max_tokens_cap:
        body["max_tokens"] = max_tokens_cap
        logger.info("Capped max_tokens", cap=max_tokens_cap, plan=plan)
    return body


async def check_rate_limits(
    redis: Redis, user_id: UUID, plan: str
) -> str | None:
    """
    Check and enforce rate limits.
    Returns concurrent_key for cleanup, or raises HTTPException.
    """
    str_user_id = str(user_id)
    limits = RATE_LIMITS.get(plan, RATE_LIMITS["free"])

    # Check RPM (requests per minute)
    rpm_key = f"viably:rate:{str_user_id}:rpm"
    rpm_count = await redis.incr(rpm_key)
    if rpm_count == 1:
        await redis.expire(rpm_key, 60)

    if rpm_count > limits["rpm"]:
        retry_after = await redis.ttl(rpm_key)
        logger.warning(
            "Rate limit exceeded (RPM)",
            user_id=str_user_id,
            rpm=rpm_count,
            limit=limits["rpm"],
        )
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded: {limits['rpm']} requests per minute",
            headers={"Retry-After": str(retry_after)},
        )

    # Check RPD (requests per day)
    rpd_key = f"viably:rate:{str_user_id}:rpd"
    rpd_count = await redis.incr(rpd_key)
    if rpd_count == 1:
        await redis.expire(rpd_key, 86400)

    if rpd_count > limits["rpd"]:
        retry_after = await redis.ttl(rpd_key)
        logger.warning(
            "Rate limit exceeded (RPD)",
            user_id=str_user_id,
            rpd=rpd_count,
            limit=limits["rpd"],
        )
        raise HTTPException(
            status_code=429,
            detail=f"Daily rate limit exceeded: {limits['rpd']} requests per day",
            headers={"Retry-After": str(retry_after)},
        )

    # Check concurrent requests
    concurrent_key = f"viably:rate:{str_user_id}:concurrent"
    concurrent = await redis.incr(concurrent_key)

    if concurrent > limits["concurrent"]:
        await redis.decr(concurrent_key)
        logger.warning(
            "Too many concurrent requests",
            user_id=str_user_id,
            concurrent=concurrent,
            limit=limits["concurrent"],
        )
        raise HTTPException(
            status_code=429,
            detail=f"Too many concurrent requests: max {limits['concurrent']}",
        )

    return concurrent_key  # Return for cleanup


async def check_abuse_patterns(redis: Redis, user_id: UUID):
    """Check for abuse patterns (errors, cost drain)."""
    str_user_id = str(user_id)

    # Check if user is temporarily blocked
    block_key = f"viably:abuse:{str_user_id}:blocked"
    if await redis.exists(block_key):
        ttl = await redis.ttl(block_key)
        logger.warning("User blocked due to abuse", user_id=str_user_id, ttl=ttl)
        raise HTTPException(
            status_code=403,
            detail=f"Temporarily blocked due to suspicious activity. Try again in {ttl}s",
        )

    # Check error rate
    error_key = f"viably:abuse:{str_user_id}:errors_1h"
    error_count = int(await redis.get(error_key) or 0)
    if error_count > MAX_ERRORS_PER_HOUR:
        # Temporary block for 15 minutes
        await redis.setex(block_key, 900, "1")
        logger.warning(
            "User blocked due to high error rate",
            user_id=str_user_id,
            error_count=error_count,
        )
        raise HTTPException(
            status_code=403,
            detail="Too many errors. Temporarily blocked for 15 minutes.",
        )


async def track_error(redis: Redis, user_id: UUID):
    """Track error for abuse detection."""
    str_user_id = str(user_id)
    error_key = f"viably:abuse:{str_user_id}:errors_1h"
    count = await redis.incr(error_key)
    if count == 1:
        await redis.expire(error_key, 3600)


async def check_cost_guard(
    redis: Redis, user_id: UUID, balance: int, messages: list, max_tokens: int
):
    """
    Estimate cost and check if it exceeds balance.
    Also check cost rate for abuse detection.
    """
    str_user_id = str(user_id)

    # Estimate cost
    estimated_input = len(json.dumps(messages)) // 4  # rough token estimate
    max_output = max_tokens or 4096
    estimated_cost = math.ceil((estimated_input + max_output * 3) / 10_000)

    # Check if estimated cost exceeds balance (with buffer)
    if estimated_cost > balance * 1.5:
        logger.warning(
            "Estimated cost exceeds balance",
            user_id=str_user_id,
            estimated_cost=estimated_cost,
            balance=balance,
        )
        raise HTTPException(
            status_code=402,
            detail=f"Estimated cost ({estimated_cost} cr) exceeds balance ({balance} cr)",
        )

    # Warn about expensive requests
    if estimated_cost > 20:
        logger.warning(
            "Expensive request",
            user_id=str_user_id,
            estimated_cost=estimated_cost,
            balance=balance,
        )

    # Check cost rate (abuse detection)
    cost_key = f"viably:abuse:{str_user_id}:cost_1h"
    cost_1h = float(await redis.get(cost_key) or 0)
    cost_threshold = balance * (MAX_COST_PERCENT_PER_HOUR / 100)

    if cost_1h > cost_threshold:
        logger.warning(
            "High cost rate",
            user_id=str_user_id,
            cost_1h=cost_1h,
            threshold=cost_threshold,
        )
        # Don't block, just log for now


async def track_cost(redis: Redis, user_id: UUID, cost: int):
    """Track cost for abuse detection."""
    str_user_id = str(user_id)
    cost_key = f"viably:abuse:{str_user_id}:cost_1h"
    await redis.incrbyfloat(cost_key, float(cost))
    await redis.expire(cost_key, 3600)


async def cleanup_concurrent(redis: Redis, concurrent_key: str | None):
    """Cleanup concurrent counter."""
    if concurrent_key:
        await redis.decr(concurrent_key)
