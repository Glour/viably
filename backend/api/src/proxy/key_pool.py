"""
Anthropic API Key Pool for Viably.

Manages rotation of multiple Anthropic API keys to distribute load
and avoid hitting per-key rate limits.

Usage:
    pool = ApiKeyPool(redis)
    key = await pool.get_key()
    # use key for AnthropicClient(api_key=key)
    await pool.report_rate_limited(key)  # if 429 received
"""

import logging
import time
from typing import Optional

from redis.asyncio import Redis

logger = logging.getLogger(__name__)

_KEY_POOL_COUNTER = "viably:key_pool:counter"
_KEY_RATE_LIMITED_PREFIX = "viably:key_pool:rate_limited:"
_KEY_REQUESTS_PREFIX = "viably:key_pool:requests:"
_KEY_ERRORS_PREFIX = "viably:key_pool:errors:"
# How long to backoff a rate-limited key (seconds)
_RATE_LIMIT_BACKOFF = 60


class ApiKeyPool:
    """
    Round-robin API key pool with rate limit awareness.

    Keys are stored in settings.ANTHROPIC_API_KEY_POOL (list).
    If pool is empty, falls back to settings.ANTHROPIC_API_KEY.

    Rotation strategy:
    - Round-robin via Redis atomic counter (INCR)
    - Rate-limited keys are skipped for RATE_LIMIT_BACKOFF seconds
    - If all keys are rate-limited, returns the least-limited one
    - Stats (request counts, errors) tracked per key
    """

    def __init__(self, redis: Redis):
        self.redis = redis

    async def get_key(self, keys: list[str]) -> str:
        """
        Get next available API key from pool using smart round-robin.

        Args:
            keys: List of API keys to rotate between.

        Returns:
            Best available API key.
        """
        if not keys:
            raise ValueError("Key pool is empty")

        if len(keys) == 1:
            return keys[0]

        # Get available keys (not rate-limited)
        available = []
        rate_limited = []
        for key in keys:
            key_hash = key[-8:]  # Use last 8 chars as identifier
            rl_key = f"{_KEY_RATE_LIMITED_PREFIX}{key_hash}"
            is_limited = await self.redis.get(rl_key)
            if is_limited:
                rate_limited.append(key)
            else:
                available.append(key)

        if not available:
            # All keys rate-limited — use round-robin among them anyway
            logger.warning("All API keys are rate-limited, using round-robin fallback")
            available = keys

        if len(available) == 1:
            return available[0]

        # Round-robin using atomic counter
        idx = await self.redis.incr(_KEY_POOL_COUNTER)
        selected = available[int(idx) % len(available)]

        # Track request count
        key_hash = selected[-8:]
        req_key = f"{_KEY_REQUESTS_PREFIX}{key_hash}"
        await self.redis.incr(req_key)
        await self.redis.expire(req_key, 86400)  # 24h TTL

        logger.debug(
            "Key pool selected key ...%s (%d/%d available)",
            key_hash, len(available), len(keys)
        )
        return selected

    async def report_rate_limited(self, key: str, retry_after: int = _RATE_LIMIT_BACKOFF):
        """
        Mark a key as rate-limited. It will be skipped for retry_after seconds.

        Args:
            key: The API key that received a 429 response.
            retry_after: Seconds to backoff (default 60).
        """
        key_hash = key[-8:]
        rl_key = f"{_KEY_RATE_LIMITED_PREFIX}{key_hash}"
        await self.redis.setex(rl_key, retry_after, "1")
        logger.warning("API key ...%s rate-limited, backing off for %ds", key_hash, retry_after)

    async def report_error(self, key: str):
        """Track an error for a key (for monitoring)."""
        key_hash = key[-8:]
        err_key = f"{_KEY_ERRORS_PREFIX}{key_hash}"
        await self.redis.incr(err_key)
        await self.redis.expire(err_key, 86400)

    async def get_pool_status(self, keys: list[str]) -> dict:
        """Get current status of the key pool for admin monitoring."""
        status = []
        for key in keys:
            key_hash = key[-8:]
            rl_key = f"{_KEY_RATE_LIMITED_PREFIX}{key_hash}"
            req_key = f"{_KEY_REQUESTS_PREFIX}{key_hash}"
            err_key = f"{_KEY_ERRORS_PREFIX}{key_hash}"

            is_limited = await self.redis.get(rl_key)
            rl_ttl = await self.redis.ttl(rl_key) if is_limited else 0
            requests_today = await self.redis.get(req_key)
            errors_today = await self.redis.get(err_key)

            status.append({
                "key_suffix": f"...{key_hash}",
                "is_rate_limited": bool(is_limited),
                "rate_limit_ttl_sec": rl_ttl,
                "requests_today": int(requests_today) if requests_today else 0,
                "errors_today": int(errors_today) if errors_today else 0,
            })
        return {"pool_size": len(keys), "keys": status}


# Module-level singleton (lazy init)
_pool_instance: Optional[ApiKeyPool] = None


def get_key_pool(redis: Redis) -> ApiKeyPool:
    """Get or create ApiKeyPool instance."""
    global _pool_instance
    if _pool_instance is None:
        _pool_instance = ApiKeyPool(redis)
    return _pool_instance
