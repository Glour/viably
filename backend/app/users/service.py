"""Business logic for users module."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.users.models import CreditTransaction

# Plan-specific rollover limits
ROLLOVER_LIMITS: dict[str, int] = {
    "free": 0,
    "starter": 200,
    "pro": 600,
    "business": 2000,
}

# Plan-specific daily bonus amounts
DAILY_BONUS_AMOUNTS: dict[str, int] = {
    "free": 1,
    "starter": 3,
    "pro": 5,
    "business": 10,
}


def calculate_rollover_limit(plan: str) -> int:
    """Calculate rollover limit based on plan.

    Args:
        plan: User's subscription plan name.

    Returns:
        Rollover limit for the plan, or 0 if plan unknown.
    """
    return ROLLOVER_LIMITS.get(plan, 0)


def get_daily_bonus_amount(plan: str) -> int:
    """Get daily bonus amount for a plan.

    Args:
        plan: User's subscription plan name.

    Returns:
        Daily bonus amount for the plan, or 1 if plan unknown.
    """
    return DAILY_BONUS_AMOUNTS.get(plan, 1)


async def get_user_by_id(user_id: UUID, db: AsyncSession) -> User | None:
    """Get user by ID.

    Args:
        user_id: User UUID.
        db: Database session.

    Returns:
        User object or None if not found.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user_profile(
    user: User,
    full_name: str | None = None,
    avatar_url: str | None = None,
    db: AsyncSession | None = None,
) -> User:
    """Update user profile fields.

    Args:
        user: User object to update.
        full_name: New full name (None to skip update).
        avatar_url: New avatar URL (None to skip update).
        db: Database session (optional, for commit).

    Returns:
        Updated user object.
    """
    if full_name is not None:
        user.full_name = full_name
    if avatar_url is not None:
        user.avatar_url = str(avatar_url)

    if db:
        await db.commit()
        await db.refresh(user)

    return user


async def get_daily_bonus_info(
    user_id: UUID,
    plan: str,
    db: AsyncSession,
) -> dict:
    """Get daily bonus information for a user.

    Args:
        user_id: User UUID.
        plan: User's subscription plan.
        db: Database session.

    Returns:
        Dict with 'amount' and 'next_bonus_at' keys.
    """
    bonus_amount = get_daily_bonus_amount(plan)

    # Find most recent daily_bonus transaction for this user
    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == user_id)
        .where(CreditTransaction.transaction_type == "daily_bonus")
        .order_by(CreditTransaction.created_at.desc())
        .limit(1)
    )
    last_bonus = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if last_bonus is None or last_bonus.created_at < today_start:
        # No bonus today - available now
        next_bonus_at = None
    else:
        # Bonus claimed today - next available tomorrow 00:00 UTC
        next_bonus_at = today_start + timedelta(days=1)

    return {
        "amount": bonus_amount,
        "next_bonus_at": next_bonus_at,
    }


async def get_credit_balance(user: User, db: AsyncSession) -> dict:
    """Get user credit balance with plan details.

    Args:
        user: User object.
        db: Database session.

    Returns:
        Dict with credits, plan, daily_bonus, and rollover_limit.
    """
    daily_bonus = await get_daily_bonus_info(user.id, user.plan, db)

    return {
        "credits": user.credits,
        "plan": user.plan,
        "daily_bonus": daily_bonus,
        "rollover_limit": calculate_rollover_limit(user.plan),
    }


async def get_credit_transactions(
    user_id: UUID,
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    transaction_type: str | None = None,
) -> dict:
    """Get paginated credit transactions for a user.

    Args:
        user_id: User UUID.
        db: Database session.
        page: Page number (1-indexed).
        per_page: Items per page (max 100).
        transaction_type: Optional filter by transaction type.

    Returns:
        Dict with 'transactions' list and 'pagination' metadata.
    """
    # Enforce max per_page
    per_page = min(per_page, 100)

    # Base query
    query = select(CreditTransaction).where(CreditTransaction.user_id == user_id)

    # Apply type filter if provided
    if transaction_type:
        query = query.where(CreditTransaction.transaction_type == transaction_type)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Calculate total pages
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0

    # Get paginated results
    offset = (page - 1) * per_page
    query = query.order_by(CreditTransaction.created_at.desc()).offset(offset).limit(per_page)

    result = await db.execute(query)
    transactions = result.scalars().all()

    return {
        "transactions": transactions,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages,
        },
    }
