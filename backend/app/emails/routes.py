"""FastAPI routes for emails module."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import User
from app.core.database import get_db
from app.emails.schemas import EmailLogResponse, EmailRetryResponse
from app.emails.service import EmailService

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
