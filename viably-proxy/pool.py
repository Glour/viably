"""
OAT Token Pool — manages rotation and rate-limit backoff.
Tokens stored in Redis, round-robin with least-used selection.
"""

import logging
import time
from datetime import datetime, timedelta, timezone

from redis.asyncio import Redis

logger = logging.getLogger("proxy.pool")

_TOKEN_LIST_KEY = "proxy:pool:tokens"
_TOKEN_PREFIX = "proxy:pool:token:"

DAILY_LIMIT = 400
WEEKLY_LIMIT = 2000
RATE_LIMIT_BACKOFF = 60        # default seconds after 429
MAX_RATE_LIMIT_BACKOFF = 300   # max 5 min regardless of retry-after
BILLING_ERROR_BACKOFF = 14400  # 4h after 402


class NoTokensError(Exception):
    pass


class AllTokensExhaustedError(Exception):
    pass


class TokenPool:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def add_token(self, token: str) -> bool:
        added = await self.redis.sadd(_TOKEN_LIST_KEY, token)
        if added:
            await self.redis.hset(_tkey(token), mapping={
                "token": token,
                "requests_today": 0,
                "requests_this_week": 0,
                "requests_total": 0,
                "last_429_at": 0,
                "last_402_at": 0,
                "daily_reset_at": _next_midnight(),
                "weekly_reset_at": _next_monday(),
                "created_at": int(time.time()),
            })
            logger.info(f"Added token ...{token[-8:]}")
        return bool(added)

    async def get_token(self) -> str:
        """Select best available token (lowest daily usage, not blocked)."""
        tokens = await self.redis.smembers(_TOKEN_LIST_KEY)
        if not tokens:
            raise NoTokensError("Token pool is empty — add OAT tokens via /admin/pool")

        now = int(time.time())
        candidates = []

        for token in tokens:
            key = _tkey(token)
            data = await self.redis.hgetall(key)
            if not data:
                await self.add_token(token)
                data = await self.redis.hgetall(key)

            # Auto-reset counters
            if now >= int(data.get("daily_reset_at", 0)):
                await self.redis.hset(key, mapping={
                    "requests_today": 0,
                    "daily_reset_at": _next_midnight(),
                })
                data["requests_today"] = "0"

            if now >= int(data.get("weekly_reset_at", 0)):
                await self.redis.hset(key, mapping={
                    "requests_this_week": 0,
                    "weekly_reset_at": _next_monday(),
                })
                data["requests_this_week"] = "0"

            last_429 = int(data.get("last_429_at", 0))
            last_402 = int(data.get("last_402_at", 0))
            req_today = int(data.get("requests_today", 0))
            req_week = int(data.get("requests_this_week", 0))

            if now - last_429 < RATE_LIMIT_BACKOFF:
                continue
            if now - last_402 < BILLING_ERROR_BACKOFF:
                continue
            if req_today >= DAILY_LIMIT:
                continue
            if req_week >= WEEKLY_LIMIT:
                continue

            candidates.append((req_today * 100 + req_week, token))

        if not candidates:
            raise AllTokensExhaustedError(
                f"All {len(tokens)} tokens exhausted or rate-limited"
            )

        candidates.sort(key=lambda x: x[0])
        selected = candidates[0][1]

        key = _tkey(selected)
        await self.redis.hincrby(key, "requests_today", 1)
        await self.redis.hincrby(key, "requests_this_week", 1)
        await self.redis.hincrby(key, "requests_total", 1)
        await self.redis.hset(key, "last_used_at", now)

        logger.info(
            f"Selected ...{selected[-8:]} "
            f"({len(candidates)}/{len(tokens)} available)"
        )
        return selected

    async def report_429(self, token: str, retry_after: int = RATE_LIMIT_BACKOFF):
        # Cap backoff — Anthropic sometimes returns huge retry-after (days)
        actual_backoff = min(retry_after, MAX_RATE_LIMIT_BACKOFF)
        await self.redis.hset(_tkey(token), "last_429_at", int(time.time()))
        await self.redis.hincrby(_tkey(token), "rate_limit_count", 1)
        logger.warning(f"...{token[-8:]} → 429, backoff {actual_backoff}s (requested {retry_after}s)")

    async def report_402(self, token: str):
        await self.redis.hset(_tkey(token), "last_402_at", int(time.time()))
        await self.redis.hincrby(_tkey(token), "billing_error_count", 1)
        logger.warning(f"...{token[-8:]} → 402, backoff {BILLING_ERROR_BACKOFF // 3600}h")

    async def stats(self) -> dict:
        tokens = await self.redis.smembers(_TOKEN_LIST_KEY)
        now = int(time.time())
        items = []
        available = 0

        for token in tokens:
            data = await self.redis.hgetall(_tkey(token))
            if not data:
                continue

            last_429 = int(data.get("last_429_at", 0))
            last_402 = int(data.get("last_402_at", 0))
            req_today = int(data.get("requests_today", 0))
            req_week = int(data.get("requests_this_week", 0))

            blocked = False
            status = "ok"
            if now - last_429 < RATE_LIMIT_BACKOFF:
                status = f"429 ({RATE_LIMIT_BACKOFF - (now - last_429)}s)"
                blocked = True
            elif now - last_402 < BILLING_ERROR_BACKOFF:
                status = f"402 ({(BILLING_ERROR_BACKOFF - (now - last_402)) // 60}min)"
                blocked = True
            elif req_today >= DAILY_LIMIT:
                status = "daily_limit"
                blocked = True
            elif req_week >= WEEKLY_LIMIT:
                status = "weekly_limit"
                blocked = True

            if not blocked:
                available += 1

            items.append({
                "suffix": f"...{token[-8:]}",
                "status": status,
                "today": req_today,
                "week": req_week,
                "total": int(data.get("requests_total", 0)),
            })

        items.sort(key=lambda x: (x["status"] != "ok", x["today"]))
        return {"pool_size": len(tokens), "available": available, "tokens": items}


def _tkey(token: str) -> str:
    return f"{_TOKEN_PREFIX}{token[-12:]}"


def _next_midnight() -> int:
    now = datetime.now(timezone.utc)
    nxt = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int(nxt.timestamp())


def _next_monday() -> int:
    now = datetime.now(timezone.utc)
    days = (7 - now.weekday()) % 7 or 7
    nxt = (now + timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int(nxt.timestamp())
