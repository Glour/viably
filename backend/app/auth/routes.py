"""FastAPI routes for authentication endpoints."""

from fastapi import APIRouter, Depends, Response, status
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
    create_access_token,
    create_refresh_token,
    refresh_access_token,
    register_user,
)
from app.core.database import get_db

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
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

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "data": AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        ).model_dump()
    }


@router.post("/login", response_model=dict)
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

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "data": AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            refresh_token=refresh_token,
        ).model_dump()
    }


@router.post("/refresh", response_model=dict)
async def refresh(
    token_data: TokenRefresh,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Refresh access token.

    Uses refresh token to get new access token without re-authentication.

    Raises:
        401: Invalid or expired refresh token
    """
    new_access_token = await refresh_access_token(
        refresh_token=token_data.refresh_token,
        db=db,
    )

    return {
        "data": TokenResponse(access_token=new_access_token).model_dump()
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
) -> Response:
    """Logout current session.

    Invalidates the current session. In MVP, this just returns 204
    without token blacklisting (tokens expire naturally).

    Raises:
        401: Not authenticated
    """
    # MVP: Just acknowledge the logout request
    # Future: Add token to blacklist
    return Response(status_code=status.HTTP_204_NO_CONTENT)
