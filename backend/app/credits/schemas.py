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


class CreditDeduct(BaseModel):
    """Request to deduct credits."""

    amount: int = Field(..., gt=0, description="Credits to deduct (positive number)")
    transaction_type: str = Field(
        ...,
        pattern="^(generation|admin_adjustment)$",
        description="Type of deduction",
    )
    project_id: UUID | None = Field(None, description="Optional project reference")
    description: str | None = Field(None, max_length=255, description="Optional description")


class CreditAdd(BaseModel):
    """Request to add credits."""

    amount: int = Field(..., gt=0, description="Credits to add (positive number)")
    transaction_type: str = Field(
        ...,
        pattern="^(signup|daily_bonus|referral_bonus|purchase|refund|rollover|admin_adjustment)$",
        description="Type of credit addition",
    )
    related_user_id: UUID | None = Field(None, description="Related user for referrals")
    description: str | None = Field(None, max_length=255, description="Optional description")


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


class CreditOperationResponse(BaseModel):
    """Response for credit add/deduct operations."""

    transaction_id: UUID
    balance_after: int
    success: bool = True
