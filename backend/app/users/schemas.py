"""Pydantic schemas for users module requests and responses."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

# Re-export UserResponse from auth for consistency
from app.auth.schemas import UserResponse

__all__ = [
    "UserResponse",
    "UserUpdate",
    "CreditBalanceResponse",
    "DailyBonusInfo",
    "CreditTransactionResponse",
    "ProjectInfo",
    "TransactionsListResponse",
    "PaginationInfo",
]


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = Field(None, max_length=255)
    avatar_url: HttpUrl | None = None


class DailyBonusInfo(BaseModel):
    """Daily bonus information."""

    amount: int
    next_bonus_at: datetime | None = None


class CreditBalanceResponse(BaseModel):
    """User credit balance info."""

    credits: int
    plan: str
    daily_bonus: DailyBonusInfo | None = None
    rollover_limit: int


class ProjectInfo(BaseModel):
    """Minimal project info for transaction display."""

    id: UUID
    name: str


class CreditTransactionResponse(BaseModel):
    """Single credit transaction."""

    id: UUID
    amount: int
    balance_after: int
    transaction_type: str
    description: str | None
    project: ProjectInfo | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginationInfo(BaseModel):
    """Pagination metadata."""

    page: int
    per_page: int
    total: int
    total_pages: int


class TransactionsListResponse(BaseModel):
    """Paginated list of transactions."""

    transactions: list[CreditTransactionResponse]
    pagination: PaginationInfo
