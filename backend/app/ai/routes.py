"""API routes for AI module."""

from fastapi import APIRouter, Depends

from app.ai.client import anthropic_client
from app.ai.schemas import AiServiceStatus, AiStatusResponse
from app.auth.deps import get_current_admin_user
from app.auth.models import User
from app.core.config import settings

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
        if anthropic_client.client and settings.ANTHROPIC_API_KEY:
            status = AiServiceStatus.OPERATIONAL
        else:
            status = AiServiceStatus.DOWN
    except Exception:
        status = AiServiceStatus.DOWN

    return AiStatusResponse(
        status=status,
        model=settings.GENERATION_MODEL,
    )
