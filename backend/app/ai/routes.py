"""API routes for AI module."""

import logging

from fastapi import APIRouter, Depends

from app.ai.client import get_anthropic_client
from app.ai.schemas import AiServiceStatus, AiStatusResponse
from app.auth.deps import get_current_admin_user
from app.auth.models import User
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/status", response_model=AiStatusResponse)
async def get_ai_status(
    _admin: User = Depends(get_current_admin_user),
) -> AiStatusResponse:
    """Get AI service status (admin only).

    Returns the current operational status of the AI service
    and the configured model for generation.
    """
    # Check if client is initialized
    try:
        client = get_anthropic_client()
        if client.client and settings.ANTHROPIC_API_KEY:
            status = AiServiceStatus.OPERATIONAL
        else:
            status = AiServiceStatus.DOWN
    except Exception as e:
        logger.warning("AI client check failed: %s", e)
        status = AiServiceStatus.DOWN

    return AiStatusResponse(
        status=status,
        model=settings.GENERATION_MODEL,
    )
