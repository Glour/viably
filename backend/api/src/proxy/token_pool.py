"""
Unified Token Pool for Anthropic OAuth tokens.
Manages rotation, rate limits, and daily/weekly quotas.
Works with both Viably and VibeGent backends.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Optional, List
from redis.asyncio import Redis

logger = logging.getLogger(__name__)

# Redis keys
_TOKEN_LIST_KEY = "token_pool:tokens"
_TOKEN_PREFIX = "token_pool:token:"
_GLOBAL_COUNTER = "token_pool:counter"

# Limits
DAILY_LIMIT = 400
WEEKLY_LIMIT = 2000
RATE_LIMIT_BACKOFF = 60  # seconds


class TokenPoolError(Exception):
    """Base exception for token pool errors."""
    pass


class NoTokensAvailableError(TokenPoolError):
    """No tokens available in pool."""
    pass


class AllTokensRateLimitedError(TokenPoolError):
    """All tokens are currently rate-limited."""
    pass


class TokenPool:
    """
    Manages pool of Anthropic OAuth tokens with smart rotation.
    
    Features:
    - Round-robin selection with load balancing
    - Daily/weekly quota tracking
    - 429 rate limit handling with backoff
    - Redis-backed state management
    - Admin statistics endpoint
    """
    
    def __init__(self, redis: Redis):
        self.redis = redis
    
    async def add_token(self, token: str) -> bool:
        """
        Add a token to the pool.
        
        Args:
            token: Anthropic OAuth token (sk-ant-oat01-...)
        
        Returns:
            True if added, False if already exists
        """
        # Add to set of tokens
        added = await self.redis.sadd(_TOKEN_LIST_KEY, token)
        
        if added:
            # Initialize counters
            token_key = f"{_TOKEN_PREFIX}{self._hash(token)}"
            await self.redis.hset(token_key, mapping={
                "token": token,
                "requests_today": 0,
                "requests_this_week": 0,
                "requests_total": 0,
                "last_429_at": 0,
                "daily_reset_at": self._next_midnight(),
                "weekly_reset_at": self._next_monday(),
                "created_at": int(time.time()),
            })
            logger.info(f"Added token to pool: ...{token[-8:]}")
            return True
        
        return False
    
    async def remove_token(self, token: str) -> bool:
        """Remove a token from the pool."""
        removed = await self.redis.srem(_TOKEN_LIST_KEY, token)
        if removed:
            token_key = f"{_TOKEN_PREFIX}{self._hash(token)}"
            await self.redis.delete(token_key)
            logger.info(f"Removed token from pool: ...{token[-8:]}")
        return bool(removed)
    
    async def get_token(self) -> str:
        """
        Get best available token from pool.
        
        Selection algorithm:
        1. Filter out rate-limited tokens (429 within last 60s)
        2. Filter out daily quota exceeded tokens (>400 requests today)
        3. Filter out weekly quota exceeded tokens (>2000 requests this week)
        4. Select token with lowest load (requests_today)
        
        Raises:
            NoTokensAvailableError: Pool is empty
            AllTokensRateLimitedError: All tokens exhausted
        
        Returns:
            Selected OAuth token
        """
        # Get all tokens
        tokens = await self.redis.smembers(_TOKEN_LIST_KEY)
        
        if not tokens:
            raise NoTokensAvailableError("Token pool is empty")
        
        now = int(time.time())
        available = []
        
        # Score each token
        for token in tokens:
            token_key = f"{_TOKEN_PREFIX}{self._hash(token)}"
            data = await self.redis.hgetall(token_key)
            
            if not data:
                # Token metadata missing, initialize it
                await self.add_token(token)
                data = await self.redis.hgetall(token_key)
            
            # Reset counters if needed
            daily_reset = int(data.get("daily_reset_at", 0))
            weekly_reset = int(data.get("weekly_reset_at", 0))
            
            if now >= daily_reset:
                await self.redis.hset(token_key, "requests_today", 0)
                await self.redis.hset(token_key, "daily_reset_at", self._next_midnight())
                data["requests_today"] = "0"
            
            if now >= weekly_reset:
                await self.redis.hset(token_key, "requests_this_week", 0)
                await self.redis.hset(token_key, "weekly_reset_at", self._next_monday())
                data["requests_this_week"] = "0"
            
            # Check if token is available
            last_429 = int(data.get("last_429_at", 0))
            requests_today = int(data.get("requests_today", 0))
            requests_week = int(data.get("requests_this_week", 0))
            
            # Skip if recently rate-limited
            if now - last_429 < RATE_LIMIT_BACKOFF:
                logger.debug(f"Token ...{token[-8:]} rate-limited, skipping")
                continue
            
            # Skip if daily limit reached
            if requests_today >= DAILY_LIMIT:
                logger.debug(f"Token ...{token[-8:]} daily limit reached ({requests_today}/{DAILY_LIMIT})")
                continue
            
            # Skip if weekly limit reached
            if requests_week >= WEEKLY_LIMIT:
                logger.debug(f"Token ...{token[-8:]} weekly limit reached ({requests_week}/{WEEKLY_LIMIT})")
                continue
            
            # Token is available, calculate score
            # Lower score = better (less loaded)
            score = requests_today * 100 + requests_week
            available.append((score, token, data))
        
        if not available:
            raise AllTokensRateLimitedError(
                "All tokens are rate-limited or quota exceeded"
            )
        
        # Select token with lowest score
        available.sort(key=lambda x: x[0])
        selected_token = available[0][1]
        
        # Increment request counters
        token_key = f"{_TOKEN_PREFIX}{self._hash(selected_token)}"
        await self.redis.hincrby(token_key, "requests_today", 1)
        await self.redis.hincrby(token_key, "requests_this_week", 1)
        await self.redis.hincrby(token_key, "requests_total", 1)
        await self.redis.hset(token_key, "last_used_at", now)
        
        logger.info(
            f"Selected token ...{selected_token[-8:]} "
            f"(score={available[0][0]}, available={len(available)}/{len(tokens)})"
        )
        
        return selected_token
    
    async def report_429(self, token: str, retry_after: int = RATE_LIMIT_BACKOFF):
        """
        Mark token as rate-limited after receiving 429 response.
        
        Args:
            token: The token that received 429
            retry_after: Seconds to backoff (default 60)
        """
        token_key = f"{_TOKEN_PREFIX}{self._hash(token)}"
        now = int(time.time())
        
        await self.redis.hset(token_key, "last_429_at", now)
        await self.redis.hincrby(token_key, "rate_limit_count", 1)
        
        logger.warning(
            f"Token ...{token[-8:]} rate-limited (429), "
            f"backing off for {retry_after}s"
        )
    
    async def get_stats(self) -> dict:
        """
        Get statistics for all tokens in pool.
        
        Returns:
            Dict with pool stats and per-token details
        """
        tokens = await self.redis.smembers(_TOKEN_LIST_KEY)
        now = int(time.time())
        
        token_stats = []
        total_requests_today = 0
        total_requests_week = 0
        total_requests_all = 0
        available_count = 0
        
        for token in tokens:
            token_key = f"{_TOKEN_PREFIX}{self._hash(token)}"
            data = await self.redis.hgetall(token_key)
            
            if not data:
                continue
            
            last_429 = int(data.get("last_429_at", 0))
            requests_today = int(data.get("requests_today", 0))
            requests_week = int(data.get("requests_this_week", 0))
            requests_total = int(data.get("requests_total", 0))
            last_used = int(data.get("last_used_at", 0))
            rate_limit_count = int(data.get("rate_limit_count", 0))
            
            is_rate_limited = (now - last_429) < RATE_LIMIT_BACKOFF
            is_daily_limited = requests_today >= DAILY_LIMIT
            is_weekly_limited = requests_week >= WEEKLY_LIMIT
            is_available = not (is_rate_limited or is_daily_limited or is_weekly_limited)
            
            if is_available:
                available_count += 1
            
            total_requests_today += requests_today
            total_requests_week += requests_week
            total_requests_all += requests_total
            
            token_stats.append({
                "token_suffix": f"...{token[-8:]}",
                "is_available": is_available,
                "is_rate_limited": is_rate_limited,
                "rate_limit_ttl_sec": max(0, RATE_LIMIT_BACKOFF - (now - last_429)),
                "requests_today": requests_today,
                "requests_this_week": requests_week,
                "requests_total": requests_total,
                "daily_limit": DAILY_LIMIT,
                "weekly_limit": WEEKLY_LIMIT,
                "daily_usage_percent": round(requests_today / DAILY_LIMIT * 100, 1),
                "weekly_usage_percent": round(requests_week / WEEKLY_LIMIT * 100, 1),
                "rate_limit_count": rate_limit_count,
                "last_used_at": datetime.fromtimestamp(last_used, tz=timezone.utc).isoformat() if last_used else None,
            })
        
        # Sort by availability and load
        token_stats.sort(key=lambda x: (
            not x["is_available"],
            x["requests_today"]
        ))
        
        return {
            "pool_size": len(tokens),
            "available_tokens": available_count,
            "total_requests_today": total_requests_today,
            "total_requests_this_week": total_requests_week,
            "total_requests_all_time": total_requests_all,
            "tokens": token_stats,
        }
    
    def _hash(self, token: str) -> str:
        """Generate consistent hash for token (last 12 chars)."""
        return token[-12:] if len(token) >= 12 else token
    
    def _next_midnight(self) -> int:
        """Get timestamp of next midnight UTC."""
        now = datetime.now(timezone.utc)
        next_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if next_day <= now:
            from datetime import timedelta
            next_day += timedelta(days=1)
        return int(next_day.timestamp())
    
    def _next_monday(self) -> int:
        """Get timestamp of next Monday 00:00 UTC."""
        now = datetime.now(timezone.utc)
        days_until_monday = (7 - now.weekday()) % 7
        if days_until_monday == 0:
            # Today is Monday, next Monday is in 7 days
            days_until_monday = 7
        
        from datetime import timedelta
        next_monday = now.replace(hour=0, minute=0, second=0, microsecond=0)
        next_monday += timedelta(days=days_until_monday)
        return int(next_monday.timestamp())


# Module-level singleton
_pool_instance: Optional[TokenPool] = None


def get_token_pool(redis: Redis) -> TokenPool:
    """Get or create TokenPool singleton."""
    global _pool_instance
    if _pool_instance is None:
        _pool_instance = TokenPool(redis)
    return _pool_instance
