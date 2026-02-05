"""FastAPI dependencies for authentication."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import verify_token
from app.core.database import get_db

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency to get current authenticated user.

    Extracts and validates JWT from Authorization header,
    fetches user from database, and checks if user is active.

    Args:
        credentials: HTTP Bearer credentials from Authorization header.
        db: Database session.

    Returns:
        Authenticated User object.

    Raises:
        HTTPException 401: If token invalid or user not found.
        HTTPException 403: If user inactive.
    """
    token = credentials.credentials

    try:
        user_id = await verify_token(token, token_type="access")
    except ValueError as e:
        logger.warning(
            "Security event: token validation failed",
            extra={
                "event_type": "token_validation_failed",
                "error": str(e),
                "token_prefix": token[:10] if len(token) > 10 else "***",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(
            "Security event: user not found for valid token",
            extra={
                "event_type": "user_not_found",
                "user_id": str(user_id),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(
            "Security event: inactive user access attempt",
            extra={
                "event_type": "inactive_user_access",
                "user_id": str(user.id),
                "email": user.email,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to get current admin user.

    Requires authenticated user with admin privileges.

    Args:
        current_user: Current authenticated user from get_current_user.

    Returns:
        Admin User object.

    Raises:
        HTTPException 403: If user is not an admin.
    """
    if not current_user.is_admin:
        logger.warning(
            "Security event: unauthorized admin access attempt",
            extra={
                "event_type": "unauthorized_admin_access",
                "user_id": str(current_user.id),
                "email": current_user.email,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
