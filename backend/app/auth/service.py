"""Authentication service with JWT token management and business logic."""

import random
import string
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.security import hash_password, verify_password
from app.core.config import settings


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
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> UUID | None:
    """Verify a JWT token and extract user_id.

    Args:
        token: JWT token string to verify.
        token_type: Expected token type ("access" or "refresh").

    Returns:
        User UUID if token is valid, None otherwise.

    Raises:
        ValueError: If token is invalid, expired, or wrong type.
    """
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
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


def generate_referral_code() -> str:
    """Generate a unique 8-character referral code.

    Format: 3 uppercase letters + 5 digits (e.g., ABC12345)

    Returns:
        Generated referral code string.
    """
    letters = "".join(random.choices(string.ascii_uppercase, k=3))
    digits = "".join(random.choices(string.digits, k=5))
    return f"{letters}{digits}"


async def generate_unique_referral_code(db: AsyncSession, max_retries: int = 10) -> str:
    """Generate a unique referral code with collision retry.

    Args:
        db: Database session.
        max_retries: Maximum number of retries on collision.

    Returns:
        Unique referral code string.

    Raises:
        RuntimeError: If unable to generate unique code after max retries.
    """
    for _ in range(max_retries):
        code = generate_referral_code()
        result = await db.execute(select(User).where(User.referral_code == code))
        if result.scalar_one_or_none() is None:
            return code

    raise RuntimeError("Unable to generate unique referral code after max retries")


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
    result = await db.execute(select(User).where(User.email == email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Find referrer if code provided
    referred_by_id = None
    if referrer_code:
        result = await db.execute(select(User).where(User.referral_code == referrer_code))
        referrer = result.scalar_one_or_none()
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
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()

    # Generic error message to prevent user enumeration
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(user)

    return user


async def refresh_access_token(
    refresh_token: str,
    db: AsyncSession,
) -> str:
    """Refresh access token using a valid refresh token.

    Args:
        refresh_token: JWT refresh token.
        db: Database session.

    Returns:
        New access token string.

    Raises:
        HTTPException 401: If refresh token is invalid or expired.
        HTTPException 403: If user account is inactive.
    """
    try:
        user_id = verify_token(refresh_token, token_type="refresh")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
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

    return create_access_token(user.id)
