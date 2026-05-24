"""FastAPI routes for credits module."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi_limiter.depends import RateLimiter
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db
from infrastructure.database.models.credits import CreditTransaction
from api.src.credits.schemas import (
    BalanceResponse,
    TransactionResponse,
    TransactionsListResponse,
)
from api.src.credits.service import claim_daily_bonus, get_daily_bonus_info

router = APIRouter()


@router.get(
    "/balance", response_model=dict,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_balance(
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Get current user's credit balance and plan."""
    return {
        "data": BalanceResponse(
            credits=current_user.credits,
            plan=current_user.plan,
        )
    }


@router.get(
    "/transactions",
    response_model=TransactionsListResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    transaction_type: str | None = Query(None, alias="type"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> TransactionsListResponse:
    """Get user's transaction history with pagination."""
    # Base query
    base_stmt = select(CreditTransaction).where(
        CreditTransaction.user_id == current_user.id
    )

    # Apply type filter if provided
    if transaction_type:
        base_stmt = base_stmt.where(
            CreditTransaction.transaction_type == transaction_type
        )

    # Get total count
    count_stmt = select(func.count()).select_from(base_stmt.subquery())
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    # Get paginated results
    stmt = (
        base_stmt
        .order_by(CreditTransaction.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    return TransactionsListResponse(
        data=[
            TransactionResponse(
                id=tx.id,
                amount=tx.amount,
                balance_after=tx.balance_after,
                transaction_type=tx.transaction_type,
                description=tx.description,
                project_id=tx.project_id,
                related_user_id=tx.related_user_id,
                extra_data=tx.extra_data or {},
                created_at=tx.created_at,
            )
            for tx in transactions
        ],
        meta={
            "total": total,
            "limit": limit,
            "offset": offset,
        },
    )


@router.get(
    "/daily-bonus", response_model=dict,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_daily_bonus_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Get daily bonus availability info."""
    info = await get_daily_bonus_info(user_id=current_user.id, db=db)
    return {"data": info}


@router.post(
    "/daily-bonus", response_model=dict,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def claim_daily_bonus_endpoint(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Claim daily bonus."""
    result = await claim_daily_bonus(user_id=current_user.id, db=db)
    return {"data": result}
