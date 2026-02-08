"""Pydantic schemas for users module requests and responses."""


from pydantic import BaseModel, Field, HttpUrl

# Re-export UserResponse from auth for consistency
from app.auth.schemas import UserResponse

# Re-export DailyBonusInfo and TransactionResponse from credits for consistency
from app.credits.schemas import DailyBonusInfo, TransactionResponse

__all__ = [
    "UserResponse",
    "UserUpdate",
    "CreditBalanceResponse",
    "DailyBonusInfo",
    "TransactionResponse",
    "TransactionsListResponse",
    "PaginationInfo",
]


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = Field(None, max_length=255)
    avatar_url: HttpUrl | None = None


class CreditBalanceResponse(BaseModel):
    """User credit balance info."""

    credits: int
    plan: str
    daily_bonus: DailyBonusInfo | None = None
    rollover_limit: int


class PaginationInfo(BaseModel):
    """Pagination metadata."""

    page: int
    per_page: int
    total: int
    total_pages: int


class TransactionsListResponse(BaseModel):
    """Paginated list of transactions."""

    transactions: list[TransactionResponse]
    pagination: PaginationInfo
