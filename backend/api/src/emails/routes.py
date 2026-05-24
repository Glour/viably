"""FastAPI routes for emails module."""

from uuid import UUID
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi_limiter.depends import RateLimiter
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from infrastructure.database.models.auth import User
from api.celery_tasks.email_tasks import send_template_email_task
from settings.config import settings
from infrastructure.database.setup import get_db
from api.src.emails.schemas import EmailLogResponse, EmailRetryResponse
from api.src.emails.service import EmailService

router = APIRouter()


@router.get(
    "/logs",
    response_model=dict,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_email_logs(
    limit: int = Query(50, ge=1, le=100, description="Number of logs to retrieve (max 100)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get email logs for the current user.

    Returns list of email logs ordered by created_at DESC.

    Raises:
        401: Unauthorized (invalid token)
        403: User inactive
    """
    service = EmailService(db)
    logs = await service.get_email_logs(user_id=current_user.id, limit=limit)

    logs_data = [EmailLogResponse.model_validate(log).model_dump() for log in logs]

    return {"data": logs_data}


@router.post(
    "/retry/{email_log_id}",
    response_model=dict,
    dependencies=[Depends(RateLimiter(times=5, minutes=1))],
)
async def retry_email(
    email_log_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retry sending a failed email.

    Only emails with 'failed' status can be retried.

    Raises:
        400: Email log not found, doesn't belong to user, or not in failed state
        401: Unauthorized
        403: User inactive
    """
    service = EmailService(db)
    success = await service.retry_failed_email(email_log_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email log not found or not in failed state",
        )

    response = EmailRetryResponse(
        message="Email retry initiated successfully",
        email_log_id=email_log_id,
        status="pending",
    )

    return {"data": response.model_dump()}


@router.get(
    "/logs/{email_log_id}",
    response_model=dict,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_email_log(
    email_log_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get a specific email log.

    Raises:
        404: Email log not found or doesn't belong to current user
        401: Unauthorized
        403: User inactive
    """
    service = EmailService(db)
    logs = await service.get_email_logs(user_id=current_user.id, limit=1000)

    log = next((l for l in logs if l.id == email_log_id), None)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email log not found or access denied",
        )

    return {"data": EmailLogResponse.model_validate(log).model_dump()}


# Test email sending schema
class TestEmailRequest(BaseModel):
    """Request schema for test email endpoint."""

    template_name: str = Field(
        ...,
        description="Template name (welcome, generation-complete, deploy-success, low-credits)",
    )
    recipient: str = Field(
        ..., description="Recipient email address (for testing)"
    )
    template_props: dict[str, Any] = Field(
        default_factory=dict,
        description="Optional template props override (uses defaults if not provided)",
    )


class TestEmailResponse(BaseModel):
    """Response schema for test email endpoint."""

    message: str
    template: str
    recipient: str
    task_id: str
    available_templates: list[str]


@router.post(
    "/test-send",
    response_model=dict,
    dependencies=[Depends(RateLimiter(times=5, minutes=1))],
)
async def test_send_email(
    data: TestEmailRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Test email template rendering and sending.

    Allows testing all email templates with custom or default props.
    Only available to authenticated users for testing purposes.

    Available templates:
    - welcome: Welcome email for new users
    - generation-complete: Sent when AI generation completes
    - deploy-success: Sent when deployment succeeds
    - low-credits: Warning when credits are low

    Raises:
        400: Invalid template name or missing required props
        401: Unauthorized
        403: User inactive
    """
    service = EmailService(db)
    available_templates = service.renderer.get_available_templates()

    # Validate template exists
    if data.template_name not in available_templates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid template. Available: {', '.join(available_templates)}",
        )

    # Default props for each template
    base_url = settings.CORS_ORIGINS.split(',')[0]
    default_props = {
        "welcome": {
            "userName": current_user.full_name or current_user.email.split("@")[0],
            "userEmail": current_user.email,
            "credits": current_user.credits,
            "dashboardUrl": f"{base_url}/dashboard",
        },
        "generation-complete": {
            "userName": current_user.full_name or current_user.email.split("@")[0],
            "projectName": "Test Project",
            "templateUsed": "Discord Bot Starter",
            "generatedAt": "2024-02-08T10:00:00Z",
            "projectUrl": f"{base_url}/projects/test-123",
            "creditsUsed": 10,
            "creditsRemaining": current_user.credits,
        },
        "deploy-success": {
            "userName": current_user.full_name or current_user.email.split("@")[0],
            "projectName": "Test Bot",
            "deploymentUrl": "https://test-bot.localhost:8080",
            "platform": "Docker",
            "deployedAt": "2024-02-08T10:00:00Z",
            "projectUrl": f"{base_url}/projects/test-123",
        },
        "low-credits": {
            "userName": current_user.full_name or current_user.email.split("@")[0],
            "currentCredits": 15,
            "threshold": 20,
            "dashboardUrl": f"{base_url}/dashboard",
            "buyCreditsUrl": f"{base_url}/credits/buy",
        },
    }

    # Merge user-provided props with defaults
    template_props = {
        **default_props.get(data.template_name, {}),
        **data.template_props,
    }

    # Subject lines for each template
    subjects = {
        "welcome": "Welcome to Viably - Your Account is Ready! 🎉",
        "generation-complete": f"Your project is ready! 🎉",
        "deploy-success": f"Your bot is live! 🚀",
        "low-credits": "Low Credits Warning - Refill to Continue Creating",
    }

    # Queue email for sending
    task = send_template_email_task.delay(
        template_name=data.template_name,
        email_type=f"test_{data.template_name}",
        recipient=data.recipient,
        subject=subjects.get(data.template_name, "Test Email from Viably"),
        template_props=template_props,
        user_id=str(current_user.id),
    )

    response = TestEmailResponse(
        message="Test email queued successfully",
        template=data.template_name,
        recipient=data.recipient,
        task_id=task.id,
        available_templates=available_templates,
    )

    return {"data": response.model_dump()}
