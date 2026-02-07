"""General utility functions for the application."""

import secrets
import string

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def generate_referral_code() -> str:
    """Generate a unique 8-character referral code.

    Format: 3 uppercase letters + 5 digits (e.g., ABC12345)

    Returns:
        Generated referral code string.

    Example:
        >>> code = generate_referral_code()
        >>> len(code)
        8
        >>> code[:3].isalpha()
        True
        >>> code[3:].isdigit()
        True
    """
    letters = "".join(secrets.choice(string.ascii_uppercase) for _ in range(3))
    digits = "".join(secrets.choice(string.digits) for _ in range(5))
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

    Example:
        >>> code = await generate_unique_referral_code(db)
        >>> len(code)
        8
    """
    from app.auth.models import User

    for _ in range(max_retries):
        code = generate_referral_code()
        result = await db.execute(select(User).where(User.referral_code == code))
        if result.scalar_one_or_none() is None:
            return code

    raise RuntimeError("Unable to generate unique referral code after max retries")
