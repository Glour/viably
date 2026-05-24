"""Redis client singleton for token blacklist and caching."""

import redis.asyncio as redis

from settings.config import settings

# Global Redis connection pool
_redis_client: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    """Get Redis client instance.

    Returns a singleton Redis client with connection pooling.

    Returns:
        Redis client instance.
    """
    global _redis_client

    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.CELERY_BROKER_URL,
            encoding="utf8",
            decode_responses=True,
            max_connections=10,
            socket_timeout=5,
        )

    return _redis_client


async def close_redis() -> None:
    """Close Redis connection pool.

    Should be called during application shutdown.
    """
    global _redis_client

    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
