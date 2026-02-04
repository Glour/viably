"""FastAPI routes for users module."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import User
from app.auth.schemas import UserResponse
from app.core.database import get_db
from app.users.schemas import (
    CreditBalanceResponse,
    CreditTransactionResponse,
    DailyBonusInfo,
    PaginationInfo,
    TransactionsListResponse,
    UserUpdate,
)
from app.users.service import (
    get_credit_balance,
    get_credit_transactions,
    update_user_profile,
)

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get current authenticated user profile.

    Returns user data including email, name, avatar, plan, credits, etc.

    Raises:
        401: Unauthorized (invalid token)
        403: User inactive
    """
    return {"data": UserResponse.model_validate(current_user).model_dump()}


@router.patch("/me", response_model=dict)
async def update_current_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update current user profile.

    Updates full_name and/or avatar_url.

    Raises:
        400: Validation error (invalid URL, name too long)
        401: Unauthorized
    """
    # Convert HttpUrl to string if provided
    avatar_url = str(user_data.avatar_url) if user_data.avatar_url else None

    updated_user = await update_user_profile(
        user=current_user,
        full_name=user_data.full_name,
        avatar_url=avatar_url,
        db=db,
    )

    return {"data": UserResponse.model_validate(updated_user).model_dump()}


@router.get("/me/credits", response_model=dict)
async def get_current_user_credits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get current user credit balance.

    Returns credits, plan, daily bonus info, and rollover limit.

    Raises:
        401: Unauthorized
    """
    balance = await get_credit_balance(current_user, db)

    response = CreditBalanceResponse(
        credits=balance["credits"],
        plan=balance["plan"],
        daily_bonus=DailyBonusInfo(**balance["daily_bonus"]) if balance["daily_bonus"] else None,
        rollover_limit=balance["rollover_limit"],
    )

    return {"data": response.model_dump()}


@router.get("/me/transactions", response_model=dict)
async def get_current_user_transactions(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    type: str | None = Query(None, description="Filter by transaction type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get credit transaction history.

    Returns paginated list of credit transactions with optional type filter.

    Raises:
        401: Unauthorized
    """
    result = await get_credit_transactions(
        user_id=current_user.id,
        db=db,
        page=page,
        per_page=per_page,
        transaction_type=type,
    )

    transactions = [
        CreditTransactionResponse.model_validate(tx).model_dump()
        for tx in result["transactions"]
    ]

    response = TransactionsListResponse(
        transactions=[CreditTransactionResponse(**tx) for tx in transactions],
        pagination=PaginationInfo(**result["pagination"]),
    )

    return {"data": response.model_dump()}
