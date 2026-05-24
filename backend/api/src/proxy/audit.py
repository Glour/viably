"""
Audit logging service for AI requests.
Stores logs in Redis for admin queries.
"""

import json
import time
import structlog
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from redis.asyncio import Redis

logger = structlog.get_logger(__name__)


class AuditLogService:
    """Service for logging and querying AI request audit trails."""

    def __init__(self, redis: Redis):
        self.redis = redis

    async def log_request(
        self,
        user_id: UUID,
        conversation_id: UUID | None,
        model: str,
        tokens_input: int,
        tokens_output: int,
        cost: int,
        duration_ms: int,
        status: str = "success",
        error: str | None = None,
    ):
        """Log an AI request to Redis."""
        str_user_id = str(user_id)
        str_conversation_id = str(conversation_id) if conversation_id else None

        log_entry = {
            "timestamp": int(time.time()),
            "user_id": str_user_id,
            "conversation_id": str_conversation_id,
            "model": model,
            "tokens_input": tokens_input,
            "tokens_output": tokens_output,
            "cost": cost,
            "duration_ms": duration_ms,
            "status": status,
            "error": error,
        }

        # Store in user-specific list (last 1000 entries)
        await self.redis.lpush(
            f"viably:audit:{str_user_id}", json.dumps(log_entry)
        )
        await self.redis.ltrim(f"viably:audit:{str_user_id}", 0, 999)

        # Also store in global audit log
        await self.redis.lpush("viably:audit:global", json.dumps(log_entry))
        await self.redis.ltrim("viably:audit:global", 0, 9999)

        logger.info(
            "AI request logged",
            user_id=str_user_id,
            model=model,
            cost=cost,
            status=status,
        )

    async def get_user_logs(
        self, user_id: UUID, limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get audit logs for a specific user."""
        str_user_id = str(user_id)
        logs = await self.redis.lrange(f"viably:audit:{str_user_id}", 0, limit - 1)
        return [json.loads(log) for log in logs]

    async def get_global_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get global audit logs (admin only)."""
        logs = await self.redis.lrange("viably:audit:global", 0, limit - 1)
        return [json.loads(log) for log in logs]

    async def get_logs_by_timerange(
        self,
        user_id: UUID | None,
        start_time: datetime,
        end_time: datetime,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Get audit logs within a time range."""
        start_ts = int(start_time.timestamp())
        end_ts = int(end_time.timestamp())

        if user_id:
            str_user_id = str(user_id)
            key = f"viably:audit:{str_user_id}"
        else:
            key = "viably:audit:global"

        logs = await self.redis.lrange(key, 0, limit - 1)
        parsed_logs = [json.loads(log) for log in logs]

        # Filter by timestamp
        filtered = [
            log
            for log in parsed_logs
            if start_ts <= log.get("timestamp", 0) <= end_ts
        ]
        return filtered

    async def get_stats(self, user_id: UUID | None = None) -> Dict[str, Any]:
        """Get usage statistics."""
        if user_id:
            str_user_id = str(user_id)
            logs = await self.get_user_logs(user_id, limit=1000)
        else:
            logs = await self.get_global_logs(limit=1000)

        if not logs:
            return {
                "total_requests": 0,
                "total_cost": 0,
                "total_tokens_input": 0,
                "total_tokens_output": 0,
                "avg_cost": 0,
                "errors": 0,
            }

        total_cost = sum(log.get("cost", 0) for log in logs)
        total_tokens_input = sum(log.get("tokens_input", 0) for log in logs)
        total_tokens_output = sum(log.get("tokens_output", 0) for log in logs)
        errors = sum(1 for log in logs if log.get("status") != "success")

        return {
            "total_requests": len(logs),
            "total_cost": total_cost,
            "total_tokens_input": total_tokens_input,
            "total_tokens_output": total_tokens_output,
            "avg_cost": total_cost / len(logs) if logs else 0,
            "errors": errors,
        }
