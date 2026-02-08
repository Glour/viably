"""General utility functions for the application."""

import secrets
import string
from datetime import date, datetime, timedelta, timezone

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


def get_next_day_start(from_date: date | None = None) -> datetime:
    """Get start of next day (00:00 UTC).

    Args:
        from_date: Starting date (default: today)

    Returns:
        Datetime at 00:00 UTC of next day

    Example:
        >>> next_day = get_next_day_start(date(2024, 1, 15))
        >>> next_day.date()
        datetime.date(2024, 1, 16)
        >>> next_day.hour
        0
    """
    base_date = from_date or date.today()
    tomorrow = base_date + timedelta(days=1)
    return datetime.combine(tomorrow, datetime.min.time(), tzinfo=timezone.utc)


def get_day_start(for_date: date | None = None) -> datetime:
    """Get start of given day (00:00 UTC).

    Args:
        for_date: Target date (default: today)

    Returns:
        Datetime at 00:00 UTC of given day

    Example:
        >>> day_start = get_day_start(date(2024, 1, 15))
        >>> day_start.date()
        datetime.date(2024, 1, 15)
        >>> day_start.hour
        0
    """
    target_date = for_date or date.today()
    return datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
