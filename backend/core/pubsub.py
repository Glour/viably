"""Redis pub/sub utilities for real-time generation progress.

Provides synchronous Redis publishing functions for use in Celery workers.
Messages are published to per-user channels and relayed to WebSocket clients.
"""

import json
import logging

import redis as sync_redis

from settings.config import settings

logger = logging.getLogger(__name__)

# Lazy singleton for sync Redis client (used in Celery workers)
_sync_redis_client: sync_redis.Redis | None = None


def get_sync_redis() -> sync_redis.Redis:
    """Get synchronous Redis client for Celery worker context.

    Uses lazy initialization with a singleton pattern.
    The sync client is needed because Celery tasks run in a sync context
    (even though they call async code via asyncio.run).
    """
    global _sync_redis_client
    if _sync_redis_client is None:
        _sync_redis_client = sync_redis.from_url(
            settings.CELERY_BROKER_URL,
            encoding="utf8",
            decode_responses=True,
            socket_timeout=5,
        )
    return _sync_redis_client


def get_generation_channel(user_id: str) -> str:
    """Return Redis pub/sub channel name for a user's generation updates.

    Channel format: 'generation:{user_id}'
    Using user_id (not project_id) because the frontend WebSocket connects
    per-user, and messages contain project_id for client-side filtering.
    """
    return f"generation:{user_id}"


def publish_progress(
    user_id: str,
    project_id: str,
    step: int,
    step_name: str,
    step_status: str,
    progress: int,
    log: str | None = None,
    code_snippet: str | None = None,
) -> None:
    """Publish generation_progress message to Redis channel.

    Args:
        user_id: User UUID string (determines channel).
        project_id: Project UUID string (included in message for filtering).
        step: Step number (1-6).
        step_name: Human-readable step name.
        step_status: "running" or "complete".
        progress: Progress percentage (0-100).
        log: Optional log text.
        code_snippet: Optional code snippet for typewriter animation.
    """
    data: dict = {
        "step": step,
        "step_name": step_name,
        "step_status": step_status,
        "progress": progress,
    }
    if log is not None:
        data["log"] = log
    if code_snippet is not None:
        data["code_snippet"] = code_snippet

    message = {
        "type": "generation_progress",
        "project_id": project_id,
        "data": data,
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish generation progress")


def publish_complete(
    user_id: str,
    project_id: str,
    generated_code: list[dict],
) -> None:
    """Publish generation_complete message to Redis channel.

    Args:
        user_id: User UUID string.
        project_id: Project UUID string.
        generated_code: List of dicts with {path, content, language}.
    """
    message = {
        "type": "generation_complete",
        "project_id": project_id,
        "data": {
            "generated_code": generated_code,
        },
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish generation complete")


def publish_error(
    user_id: str,
    project_id: str,
    error: str,
) -> None:
    """Publish generation_error message to Redis channel.

    Args:
        user_id: User UUID string.
        project_id: Project UUID string.
        error: Error message string.
    """
    message = {
        "type": "generation_error",
        "project_id": project_id,
        "data": {
            "error": error,
        },
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish generation error")


def publish_credits_updated(
    user_id: str,
    balance: int,
) -> None:
    """Publish credits_updated message to Redis channel.

    Args:
        user_id: User UUID string.
        balance: New credits balance.
    """
    message = {
        "type": "credits_updated",
        "project_id": "",
        "data": {
            "balance": balance,
        },
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish credits update")


def publish_deploy_progress(
    user_id: str,
    project_id: str,
    step: int,
    step_name: str,
    step_status: str,
    progress: int,
    log: str | None = None,
) -> None:
    """Publish deploy_progress message to Redis channel.

    Args:
        user_id: User UUID string (determines channel).
        project_id: Project UUID string (included in message for filtering).
        step: Step number.
        step_name: Human-readable step name.
        step_status: "running" or "complete".
        progress: Progress percentage (0-100).
        log: Optional log text.
    """
    data: dict = {
        "step": step,
        "step_name": step_name,
        "step_status": step_status,
        "progress": progress,
    }
    if log is not None:
        data["log"] = log

    message = {
        "type": "deploy_progress",
        "project_id": project_id,
        "data": data,
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish deploy progress")


def publish_deploy_complete(
    user_id: str,
    project_id: str,
    deployment_info: dict,
) -> None:
    """Publish deploy_complete message to Redis channel.

    Args:
        user_id: User UUID string.
        project_id: Project UUID string.
        deployment_info: Dict with platform, url, botUsername, botUrl, status, deployedAt.
    """
    message = {
        "type": "deploy_complete",
        "project_id": project_id,
        "data": deployment_info,
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish deploy complete")


def publish_deploy_error(
    user_id: str,
    project_id: str,
    error: str,
) -> None:
    """Publish deploy_error message to Redis channel.

    Args:
        user_id: User UUID string.
        project_id: Project UUID string.
        error: Error message string.
    """
    message = {
        "type": "deploy_error",
        "project_id": project_id,
        "data": {
            "error": error,
        },
    }

    try:
        client = get_sync_redis()
        channel = get_generation_channel(user_id)
        client.publish(channel, json.dumps(message))
    except Exception:
        logger.exception("Failed to publish deploy error")
