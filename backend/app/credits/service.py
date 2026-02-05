"""Business logic for credits module."""

import logging
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.credits.models import CreditTransaction, DailyBonus
from app.credits.schemas import DailyBonusClaimResponse, DailyBonusInfo

logger = logging.getLogger(__name__)

# Business constants
DAILY_BONUSES: dict[str, int] = {
    "free": 0,
    "starter": 3,
    "pro": 10,
    "business": 20,
}

ROLLOVER_LIMITS: dict[str, int] = {
    "free": 0,
    "starter": 200,
    "pro": 600,
    "business": 2000,
}

REFERRAL_BONUS: int = 5


def get_daily_bonus_amount(plan: str) -> int:
    """Get daily bonus amount based on plan.

    Args:
        plan: User's subscription plan

    Returns:
        Daily bonus amount (0 for free plan)
    """
    return DAILY_BONUSES.get(plan, 0)


def get_rollover_limit(plan: str) -> int:
    """Get rollover limit based on plan.

    Args:
        plan: User's subscription plan

    Returns:
        Maximum credits that can be carried over monthly
    """
    return ROLLOVER_LIMITS.get(plan, 0)


async def deduct_credits(
    user_id: UUID,
    amount: int,
    transaction_type: str,
    db: AsyncSession,
    project_id: UUID | None = None,
    description: str | None = None,
) -> dict:
    """Deduct credits from user atomically.

    Uses database-level locking (SELECT FOR UPDATE) to prevent race conditions.

    Args:
        user_id: User UUID
        amount: Credits to deduct (positive number)
        transaction_type: "generation" or "admin_adjustment"
        db: Database session
        project_id: Optional project reference
        description: Optional description

    Returns:
        dict with transaction_id, balance_after, success

    Raises:
        HTTPException 422: Insufficient credits
        HTTPException 404: User not found
    """
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Amount must be positive",
        )

    # Lock user row for atomic operation
    stmt = select(User).where(User.id == user_id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Check balance
    if user.credits < amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Insufficient credits. Required: {amount}, Available: {user.credits}",
        )

    # Calculate new balance
    new_balance = user.credits - amount

    # Update user credits
    user.credits = new_balance

    # Create transaction record
    transaction = CreditTransaction(
        user_id=user_id,
        amount=-amount,  # Negative for deduction
        balance_after=new_balance,
        transaction_type=transaction_type,
        project_id=project_id,
        description=description,
    )
    db.add(transaction)

    await db.flush()

    logger.info(
        "Credits deducted",
        extra={
            "user_id": str(user_id),
            "amount": amount,
            "transaction_type": transaction_type,
            "balance_after": new_balance,
            "transaction_id": str(transaction.id),
        },
    )

    return {
        "transaction_id": transaction.id,
        "balance_after": new_balance,
        "success": True,
    }


async def add_credits(
    user_id: UUID,
    amount: int,
    transaction_type: str,
    db: AsyncSession,
    related_user_id: UUID | None = None,
    description: str | None = None,
    metadata: dict | None = None,
) -> dict:
    """Add credits to user atomically.

    Args:
        user_id: User UUID
        amount: Credits to add (positive number)
        transaction_type: Type of credit addition
        db: Database session
        related_user_id: For referrals (who referred)
        description: Optional description
        metadata: Additional data

    Returns:
        dict with transaction_id, balance_after, success

    Raises:
        HTTPException 404: User not found
    """
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Amount must be positive",
        )

    # Lock user row for atomic operation
    stmt = select(User).where(User.id == user_id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Calculate new balance
    new_balance = user.credits + amount

    # Update user credits
    user.credits = new_balance

    # Create transaction record
    transaction = CreditTransaction(
        user_id=user_id,
        amount=amount,  # Positive for addition
        balance_after=new_balance,
        transaction_type=transaction_type,
        related_user_id=related_user_id,
        description=description,
        extra_data=metadata or {},
    )
    db.add(transaction)

    await db.flush()

    logger.info(
        "Credits added",
        extra={
            "user_id": str(user_id),
            "amount": amount,
            "transaction_type": transaction_type,
            "balance_after": new_balance,
            "transaction_id": str(transaction.id),
        },
    )

    return {
        "transaction_id": transaction.id,
        "balance_after": new_balance,
        "success": True,
    }


async def claim_daily_bonus(user_id: UUID, db: AsyncSession) -> DailyBonusClaimResponse:
    """Claim daily bonus if available.

    Args:
        user_id: User UUID
        db: Database session

    Returns:
        DailyBonusClaimResponse with claim result

    Raises:
        HTTPException 400: Plan doesn't include daily bonuses
        HTTPException 409: Already claimed today
        HTTPException 404: User not found
    """
    # Get user with lock
    stmt = select(User).where(User.id == user_id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get bonus amount based on plan
    bonus_amount = get_daily_bonus_amount(user.plan)

    if bonus_amount == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your plan does not include daily bonuses",
        )

    today = date.today()

    # Check if already claimed today
    stmt = select(DailyBonus).where(
        DailyBonus.user_id == user_id,
        DailyBonus.bonus_date == today,
    )
    existing = await db.execute(stmt)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Daily bonus already claimed today",
        )

    # Add credits
    add_result = await add_credits(
        user_id=user_id,
        amount=bonus_amount,
        transaction_type="daily_bonus",
        description=f"Daily bonus for {today}",
        db=db,
    )

    # Record daily bonus
    bonus = DailyBonus(
        user_id=user_id,
        credits_awarded=bonus_amount,
        bonus_date=today,
    )
    db.add(bonus)

    await db.flush()

    # Calculate next available time (tomorrow 00:00 UTC)
    tomorrow = today + timedelta(days=1)
    next_available = datetime.combine(tomorrow, datetime.min.time(), tzinfo=timezone.utc)

    logger.info(
        "Daily bonus claimed",
        extra={
            "user_id": str(user_id),
            "amount": bonus_amount,
            "plan": user.plan,
        },
    )

    return DailyBonusClaimResponse(
        claimed=True,
        amount=bonus_amount,
        new_balance=add_result["balance_after"],
        next_available_at=next_available,
    )


async def get_daily_bonus_info(user_id: UUID, db: AsyncSession) -> DailyBonusInfo:
    """Get daily bonus availability info.

    Args:
        user_id: User UUID
        db: Database session

    Returns:
        DailyBonusInfo with availability status
    """
    # Get user
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    bonus_amount = get_daily_bonus_amount(user.plan)

    if bonus_amount == 0:
        return DailyBonusInfo(
            amount=0,
            claimed_today=True,  # Effectively not available
            next_available_at=None,
        )

    today = date.today()

    # Check if claimed today
    stmt = select(DailyBonus).where(
        DailyBonus.user_id == user_id,
        DailyBonus.bonus_date == today,
    )
    result = await db.execute(stmt)
    claimed_today = result.scalar_one_or_none() is not None

    if claimed_today:
        # Next available tomorrow
        tomorrow = today + timedelta(days=1)
        next_available = datetime.combine(tomorrow, datetime.min.time(), tzinfo=timezone.utc)
    else:
        next_available = None  # Available now

    return DailyBonusInfo(
        amount=bonus_amount,
        claimed_today=claimed_today,
        next_available_at=next_available,
    )


async def award_referral_bonus(
    referrer_id: UUID,
    referee_id: UUID,
    db: AsyncSession,
) -> dict:
    """Award referral bonus to referrer.

    Called when new user (referee) registers with referral code.

    Args:
        referrer_id: User who referred
        referee_id: New user who signed up
        db: Database session

    Returns:
        dict with transaction_id, amount, balance_after
    """
    result = await add_credits(
        user_id=referrer_id,
        amount=REFERRAL_BONUS,
        transaction_type="referral_bonus",
        related_user_id=referee_id,
        description="Referral bonus for inviting new user",
        db=db,
    )

    logger.info(
        "Referral bonus awarded",
        extra={
            "referrer_id": str(referrer_id),
            "referee_id": str(referee_id),
            "amount": REFERRAL_BONUS,
        },
    )

    return {
        "transaction_id": result["transaction_id"],
        "amount": REFERRAL_BONUS,
        "balance_after": result["balance_after"],
    }


async def process_monthly_rollover(db: AsyncSession) -> dict:
    """Monthly cron job: Apply rollover limits.

    Run on 1st of each month at 00:00 UTC.
    For each user with credits > rollover_limit, deducts excess credits.

    Args:
        db: Database session

    Returns:
        dict with processed count and total deducted
    """
    # Get all users with credits > 0
    stmt = select(User).where(User.credits > 0)
    result = await db.execute(stmt)
    users = result.scalars().all()

    processed = 0
    total_deducted = 0
    errors = 0

    for user in users:
        limit = get_rollover_limit(user.plan)

        if user.credits > limit:
            excess = user.credits - limit
            try:
                await deduct_credits(
                    user_id=user.id,
                    amount=excess,
                    transaction_type="rollover",
                    description=f"Monthly rollover: excess credits removed (limit: {limit})",
                    db=db,
                )
                processed += 1
                total_deducted += excess

                logger.info(
                    "Rollover applied",
                    extra={
                        "user_id": str(user.id),
                        "plan": user.plan,
                        "limit": limit,
                        "excess": excess,
                    },
                )
            except Exception as e:
                errors += 1
                logger.error(
                    f"Rollover failed for user {user.id}: {e}",
                    extra={"user_id": str(user.id), "error": str(e)},
                )

    logger.info(
        "Monthly rollover completed",
        extra={
            "processed": processed,
            "total_deducted": total_deducted,
            "errors": errors,
        },
    )

    return {
        "processed": processed,
        "total_deducted": total_deducted,
        "errors": errors,
    }
