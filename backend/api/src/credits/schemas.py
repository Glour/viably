"""Pydantic schemas for credits module."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionType(str, Enum):
    """Types of credit transactions."""

    SIGNUP = "signup"
    DAILY_BONUS = "daily_bonus"
    REFERRAL_BONUS = "referral_bonus"
    PURCHASE = "purchase"
    REFUND = "refund"
    GENERATION = "generation"
    ROLLOVER = "rollover"
    ADMIN_ADJUSTMENT = "admin_adjustment"


class TransactionResponse(BaseModel):
    """Single transaction response."""

    id: UUID
    amount: int
    balance_after: int
    transaction_type: str
    description: str | None
    project_id: UUID | None
    related_user_id: UUID | None
    extra_data: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionsListResponse(BaseModel):
    """Paginated list of transactions."""

    data: list[TransactionResponse]
    meta: dict[str, int]  # total, limit, offset


class DailyBonusInfo(BaseModel):
    """Daily bonus availability info."""

    amount: int = Field(..., description="Credits user will get (0 if plan doesn't include)")
    claimed_today: bool = Field(..., description="Whether bonus was claimed today")
    next_available_at: datetime | None = Field(
        None,
        description="When next bonus is available (None if available now)",
    )
    streak_days: int = Field(default=0, description="Consecutive days (future feature)")


class DailyBonusClaimResponse(BaseModel):
    """Response after claiming daily bonus."""

    claimed: bool
    amount: int
    new_balance: int
    next_available_at: datetime


class BalanceResponse(BaseModel):
    """User balance response."""

    credits: int
    plan: str
    daily_bonus: DailyBonusInfo | None = Field(None, description="Daily bonus info")
    rollover_limit: int | None = Field(None, description="Credit rollover limit for plan")
