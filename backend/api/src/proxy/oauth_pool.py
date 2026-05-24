"""
OAuth Account Pool Service for Viably.
Manages pool of Claude subscription accounts with Bearer tokens.
Adapted from VibeGent agent-platform.
"""

import structlog
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.oauth_account import OAuthAccount

logger = structlog.get_logger(__name__)


class NoAccountsAvailableError(Exception):
    """No OAuth accounts available in pool."""

    pass


class RateLimitedError(Exception):
    """All accounts are rate-limited."""

    pass


class OAuthRedisCache:
    """Redis cache layer for fast rate limit checks."""

    def __init__(self, redis: Redis):
        self.redis = redis

    async def get_remaining(self, account_id: UUID) -> Optional[int]:
        """Get remaining requests from Redis."""
        key = f"viably:oauth:account:{account_id}:remaining_requests"
        val = await self.redis.get(key)
        return int(val) if val else None

    async def get_remaining_tokens(self, account_id: UUID) -> Optional[int]:
        """Get remaining tokens from Redis."""
        key = f"viably:oauth:account:{account_id}:remaining_tokens"
        val = await self.redis.get(key)
        return int(val) if val else None

    async def get_reset_at(self, account_id: UUID) -> Optional[datetime]:
        """Get rate limit reset time from Redis."""
        key = f"viably:oauth:account:{account_id}:reset_at"
        val = await self.redis.get(key)
        if val:
            try:
                return datetime.fromisoformat(val)
            except:
                return None
        return None

    async def get_requests_today(self, account_id: UUID) -> int:
        """Get today's request count from Redis."""
        key = f"viably:oauth:account:{account_id}:requests_today"
        val = await self.redis.get(key)
        return int(val) if val else 0

    async def update_from_headers(self, account_id: UUID, headers: dict):
        """Update Redis cache from Anthropic response headers."""
        # Parse rate limit headers
        remaining_requests = headers.get("x-ratelimit-remaining-requests") or headers.get(
            "anthropic-ratelimit-requests-remaining"
        )
        remaining_tokens = headers.get("x-ratelimit-remaining-tokens") or headers.get(
            "anthropic-ratelimit-tokens-remaining"
        )
        reset_requests = headers.get("x-ratelimit-reset-requests") or headers.get(
            "anthropic-ratelimit-requests-reset"
        )

        if remaining_requests:
            await self.redis.set(
                f"viably:oauth:account:{account_id}:remaining_requests",
                int(remaining_requests),
                ex=3600,  # 1 hour TTL
            )

        if remaining_tokens:
            await self.redis.set(
                f"viably:oauth:account:{account_id}:remaining_tokens",
                int(remaining_tokens),
                ex=3600,
            )

        if reset_requests:
            await self.redis.set(
                f"viably:oauth:account:{account_id}:reset_at",
                str(reset_requests),
                ex=3600,
            )

        # Increment today's counter
        today_key = f"viably:oauth:account:{account_id}:requests_today"
        await self.redis.incr(today_key)
        # Set expiry to end of day (simplified: 24h)
        await self.redis.expire(today_key, 86400)


class OAuthPoolService:
    """Manages OAuth account pool selection and rate limiting."""

    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis
        self.cache = OAuthRedisCache(redis)

    async def select_account(self, model: str) -> Optional[OAuthAccount]:
        """
        Smart account selection algorithm.
        Returns None if should fallback to API key.
        Raises RateLimitedError if all accounts exhausted.
        """
        now = datetime.now(timezone.utc)

        # 1. Get all active accounts
        result = await self.db.execute(
            select(OAuthAccount).where(OAuthAccount.is_active == True)
        )
        accounts = list(result.scalars().all())

        if not accounts:
            logger.warning("No OAuth accounts in pool")
            # Fallback to API key
            return None

        # 2. Filter: has capacity
        available = []
        for acc in accounts:
            # Check token expiry
            if acc.token_expires_at and acc.token_expires_at < now:
                logger.info("Account token expired, needs refresh", name=acc.name)
                # Will try to refresh later, skip for now
                continue

            # Check rate limits
            remaining = await self.cache.get_remaining(acc.id)
            reset_at = await self.cache.get_reset_at(acc.id)

            # If we have remaining data and it's > 0, account is available
            if remaining is not None and remaining > 0:
                available.append(acc)
            # If we don't have data or reset time passed, account might be available
            elif remaining is None or (reset_at and reset_at <= now):
                available.append(acc)

        if not available:
            # Fallback to API key
            logger.info("All OAuth accounts exhausted, falling back to API key")
            return None

        # 3. Score and select best account
        scored = []
        for acc in available:
            remaining = await self.cache.get_remaining(acc.id) or 100
            today = await self.cache.get_requests_today(acc.id)
            # Score = remaining * 100 + priority * 10 - requests_today
            score = remaining * 100 + acc.priority * 10 - today
            scored.append((score, acc))

        scored.sort(key=lambda x: x[0], reverse=True)
        selected = scored[0][1]

        logger.info("Selected OAuth account", name=selected.name, score=scored[0][0])
        return selected

    async def update_rate_limits(self, account_id: UUID, response_headers: dict):
        """Parse Anthropic response headers and update rate limits."""
        # Update Redis cache
        await self.cache.update_from_headers(account_id, response_headers)

        # Parse and store in DB (for persistence)
        rate_limit_requests = response_headers.get(
            "x-ratelimit-limit-requests"
        ) or response_headers.get("anthropic-ratelimit-requests-limit")
        rate_limit_tokens = response_headers.get(
            "x-ratelimit-limit-tokens"
        ) or response_headers.get("anthropic-ratelimit-tokens-limit")

        updates = {
            "last_used_at": datetime.now(timezone.utc),
        }

        if rate_limit_requests:
            updates["rate_limit_requests"] = int(rate_limit_requests)
        if rate_limit_tokens:
            updates["rate_limit_tokens"] = int(rate_limit_tokens)

        # Increment total counter
        result = await self.db.execute(
            select(OAuthAccount).where(OAuthAccount.id == account_id)
        )
        account = result.scalar_one_or_none()
        if account:
            updates["requests_total"] = account.requests_total + 1

        await self.db.execute(
            update(OAuthAccount).where(OAuthAccount.id == account_id).values(**updates)
        )
        await self.db.commit()

        logger.debug("Updated rate limits for account", account_id=str(account_id))

    async def mark_error(self, account_id: UUID, error: str):
        """Record error for an account."""
        logger.warning("OAuth account error", account_id=str(account_id), error=error)

        await self.db.execute(
            update(OAuthAccount)
            .where(OAuthAccount.id == account_id)
            .values(
                last_error=error,
                last_error_at=datetime.now(timezone.utc),
            )
        )
        await self.db.commit()

    async def get_pool_status(self) -> dict:
        """Get status of all accounts for admin dashboard."""
        result = await self.db.execute(select(OAuthAccount))
        accounts = result.scalars().all()

        pool_data = []
        for acc in accounts:
            remaining = await self.cache.get_remaining(acc.id)
            remaining_tokens = await self.cache.get_remaining_tokens(acc.id)
            reset_at = await self.cache.get_reset_at(acc.id)
            requests_today = await self.cache.get_requests_today(acc.id)

            pool_data.append(
                {
                    "id": str(acc.id),
                    "name": acc.name,
                    "is_active": acc.is_active,
                    "priority": acc.priority,
                    "rate_limit_requests": acc.rate_limit_requests,
                    "rate_limit_remaining": remaining or acc.rate_limit_remaining,
                    "rate_limit_reset": reset_at.isoformat()
                    if reset_at
                    else (
                        acc.rate_limit_reset.isoformat() if acc.rate_limit_reset else None
                    ),
                    "rate_limit_tokens": acc.rate_limit_tokens,
                    "rate_limit_remaining_tokens": remaining_tokens
                    or acc.rate_limit_remaining_tokens,
                    "requests_today": requests_today or acc.requests_today,
                    "requests_total": acc.requests_total,
                    "last_used_at": acc.last_used_at.isoformat()
                    if acc.last_used_at
                    else None,
                    "last_error": acc.last_error,
                    "last_error_at": acc.last_error_at.isoformat()
                    if acc.last_error_at
                    else None,
                    "created_at": acc.created_at.isoformat(),
                }
            )

        return {
            "total_accounts": len(accounts),
            "active_accounts": sum(1 for a in accounts if a.is_active),
            "accounts": pool_data,
        }
