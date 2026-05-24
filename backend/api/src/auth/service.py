"""Authentication service with JWT token management and business logic."""

import logging
import uuid
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.auth import User
from infrastructure.database.repositories.user_repository import UserRepository
from settings.security import hash_password, verify_password
from settings.config import settings
from core.redis import get_redis
from core.utils import generate_unique_referral_code

logger = logging.getLogger(__name__)

# Account lockout configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes


async def check_account_lockout(email: str) -> None:
    """Check if account is locked due to failed login attempts.

    Args:
        email: User's email address.

    Raises:
        HTTPException 429: If account is temporarily locked.
    """
    redis = await get_redis()
    key = f"failed_login:{email}"
    attempts = await redis.get(key)

    if attempts and int(attempts) >= MAX_FAILED_ATTEMPTS:
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
            "Account temporarily locked due to multiple failed"
            f" login attempts. Try again in {ttl} seconds."
        ),
        )


async def increment_failed_attempts(email: str) -> None:
    """Increment failed login attempts counter.

    Args:
        email: User's email address.
    """
    redis = await get_redis()
    key = f"failed_login:{email}"
    attempts = await redis.incr(key)

    # Set expiration on first failed attempt
    if attempts == 1:
        await redis.expire(key, LOCKOUT_DURATION_SECONDS)

    logger.warning(
        "Failed login attempt",
        extra={
            "event_type": "failed_login",
            "email": email,
            "attempts": attempts,
        },
    )


async def clear_failed_attempts(email: str) -> None:
    """Clear failed login attempts counter after successful login.

    Args:
        email: User's email address.
    """
    redis = await get_redis()
    key = f"failed_login:{email}"
    await redis.delete(key)


def create_access_token(user_id: UUID, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token.

    Args:
        user_id: User's UUID to encode in token.
        expires_delta: Optional custom expiration time.

    Returns:
        Encoded JWT access token string.
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(UTC) + expires_delta
    to_encode = {
        "sub": str(user_id),
        "type": "access",
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: UUID, expires_delta: timedelta | None = None) -> str:
    """Create a JWT refresh token.

    Args:
        user_id: User's UUID to encode in token.
        expires_delta: Optional custom expiration time.

    Returns:
        Encoded JWT refresh token string.
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    expire = datetime.now(UTC) + expires_delta
    to_encode = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def verify_token(token: str, token_type: str = "access") -> UUID | None:
    """Verify a JWT token and extract user_id.

    Args:
        token: JWT token string to verify.
        token_type: Expected token type ("access" or "refresh").

    Returns:
        User UUID if token is valid, None otherwise.

    Raises:
        ValueError: If token is invalid, expired, wrong type, or blacklisted.
    """
    # Check if token is blacklisted
    redis_client = await get_redis()
    is_blacklisted = await redis_client.exists(f"blacklist:{token}")
    if is_blacklisted:
        raise ValueError("Token has been revoked")

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str | None = payload.get("sub")
        payload_type: str | None = payload.get("type")

        if user_id is None:
            raise ValueError("Token missing subject claim")
        if payload_type != token_type:
            raise ValueError(f"Invalid token type: expected {token_type}, got {payload_type}")

        return UUID(user_id)

    except ExpiredSignatureError:
        raise ValueError("Token has expired")
    except InvalidTokenError as e:
        raise ValueError(f"Invalid token: {e}")


async def register_user(
    email: str,
    password: str,
    db: AsyncSession,
    full_name: str | None = None,
    referrer_code: str | None = None,
) -> User:
    """Register a new user.

    Args:
        email: User's email address.
        password: Plain text password (will be hashed).
        db: Database session.
        full_name: Optional user's full name.
        referrer_code: Optional referral code of the user who referred this user.

    Returns:
        Created User object.

    Raises:
        HTTPException 409: If email already registered.
        HTTPException 400: If referrer_code is invalid.
    """
    # Check if email exists
    repo = UserRepository(db)
    if await repo.email_exists(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Find referrer if code provided
    referred_by_id = None
    if referrer_code:
        referrer = await repo.get_by_referral_code(referrer_code)
        if referrer:
            referred_by_id = referrer.id
        # Silently ignore invalid referral codes (don't block registration)

    # Generate unique referral code with collision handling
    unique_code = await generate_unique_referral_code(db)

    # Create user with hashed password and referral code
    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name,
        referral_code=unique_code,
        referred_by=referred_by_id,
        credits=5,  # Welcome credits
    )

    db.add(user)
    await db.flush()
    await db.refresh(user)

    return user


async def authenticate_user(
    email: str,
    password: str,
    db: AsyncSession,
) -> User:
    """Authenticate user by email and password.

    Args:
        email: User's email address.
        password: Plain text password to verify.
        db: Database session.

    Returns:
        Authenticated User object.

    Raises:
        HTTPException 401: If credentials invalid.
        HTTPException 403: If account inactive.
        HTTPException 429: If account is locked.
    """
    # Check if account is locked due to failed attempts
    await check_account_lockout(email.lower())

    # Find user by email
    repo = UserRepository(db)
    user = await repo.get_by_email(email)

    # Generic error message to prevent user enumeration
    if not user or not verify_password(password, user.password_hash):
        # Increment failed attempts counter
        await increment_failed_attempts(email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный пароль или email не найден",
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Clear failed attempts on successful login
    await clear_failed_attempts(email.lower())

    # Update last login timestamp
    user.last_login_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(user)

    return user


async def refresh_access_token(
    refresh_token: str,
    db: AsyncSession,
) -> tuple[str, str]:
    """Refresh access token using a valid refresh token.

    Implements refresh token rotation: the old refresh token is blacklisted
    and a new refresh token is issued alongside the new access token.

    Args:
        refresh_token: JWT refresh token.
        db: Database session.

    Returns:
        Tuple of (new_access_token, new_refresh_token).

    Raises:
        HTTPException 401: If refresh token is invalid or expired.
        HTTPException 403: If user account is inactive.
    """
    try:
        user_id = await verify_token(refresh_token, token_type="refresh")
    except ValueError as e:
        logger.warning("Token refresh failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please log in again.",
        )

    # Verify user still exists and is active
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Blacklist the old refresh token to prevent reuse
    await blacklist_token(refresh_token, settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400)

    return create_access_token(user.id), create_refresh_token(user.id)


async def blacklist_token(token: str, ttl_seconds: int) -> None:
    """Add token to blacklist.

    Stores token in Redis with TTL matching token expiration.

    Args:
        token: JWT token to blacklist.
        ttl_seconds: Time-to-live in seconds (should match token expiration).
    """
    redis_client = await get_redis()
    await redis_client.setex(f"blacklist:{token}", ttl_seconds, "1")
