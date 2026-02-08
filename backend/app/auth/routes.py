"""FastAPI routes for authentication endpoints."""

import logging

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import User
from app.auth.schemas import (
    AuthResponse,
    TokenRefresh,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.auth.service import (
    authenticate_user,
    blacklist_token,
    create_access_token,
    create_refresh_token,
    refresh_access_token,
    register_user,
)
from app.celery_tasks.email_tasks import send_template_email_task
from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/register",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=5, minutes=1))],
)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Register a new user.

    Creates a new user account with email and password.
    Returns user data and authentication tokens.

    Raises:
        400: Validation error (weak password, invalid email)
        409: Email already registered
    """
    user = await register_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        referrer_code=user_data.referrer_code,
        db=db,
    )

    logger.info(
        "Security event: new user registered",
        extra={
            "event_type": "user_registration",
            "user_id": str(user.id),
            "email": user.email,
        },
    )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Send welcome email asynchronously via Celery
    try:
        send_template_email_task.delay(
            template_name="welcome",
            email_type="welcome",
            recipient=user.email,
            subject="Welcome to Viably - Your Account is Ready! 🎉",
            template_props={
                "userName": user.full_name or user.email.split("@")[0],
                "userEmail": user.email,
                "credits": user.credits,
                "dashboardUrl": f"{settings.CORS_ORIGINS.split(',')[0]}/dashboard",
            },
            user_id=str(user.id),
        )
        logger.info(
            "Welcome email queued",
            extra={
                "user_id": str(user.id),
                "email": user.email,
            },
        )
    except Exception as e:
        # Don't fail registration if email fails
        logger.error(
            "Failed to queue welcome email",
            extra={
                "user_id": str(user.id),
                "error": str(e),
            },
            exc_info=True,
        )

    return {
        "data": AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        ).model_dump()
    }


@router.post(
    "/login",
    response_model=dict,
    dependencies=[Depends(RateLimiter(times=5, minutes=1))],
)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Login with email and password.

    Authenticates user and returns tokens.

    Raises:
        401: Invalid credentials
        403: Account inactive
    """
    user = await authenticate_user(
        email=user_data.email,
        password=user_data.password,
        db=db,
    )

    logger.info(
        "Security event: successful login",
        extra={
            "event_type": "successful_login",
            "user_id": str(user.id),
            "email": user.email,
        },
    )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "data": AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        ).model_dump()
    }


@router.post(
    "/refresh",
    response_model=dict,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def refresh(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Refresh access token with token rotation.

    Issues new access and refresh tokens. The old refresh token is blacklisted.

    Raises:
        401: Invalid or expired refresh token
    """
    new_access_token, new_refresh_token = await refresh_access_token(
        refresh_token=token_data.refresh_token,
        db=db,
    )

    return {
        "data": TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
        ).model_dump()
    }


security = HTTPBearer()


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_user),
    token_data: TokenRefresh | None = None,
) -> Response:
    """Logout current session.

    Invalidates the access token and optionally the refresh token.
    Tokens are stored in Redis blacklist until their natural expiration.

    Raises:
        401: Not authenticated
    """
    # Blacklist the access token
    access_token = credentials.credentials
    access_ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    await blacklist_token(access_token, access_ttl)

    # Blacklist the refresh token if provided
    if token_data and token_data.refresh_token:
        refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        await blacklist_token(token_data.refresh_token, refresh_ttl)

    # Log logout for audit trail
    logger.info("User %s logged out, tokens blacklisted", current_user.id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
