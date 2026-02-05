"""Credits module for managing credit economy."""

from app.credits.models import CreditTransaction, DailyBonus
from app.credits.schemas import (
    CreditAdd,
    CreditDeduct,
    DailyBonusClaimResponse,
    DailyBonusInfo,
    TransactionResponse,
    TransactionType,
)
from app.credits.service import (
    add_credits,
    award_referral_bonus,
    claim_daily_bonus,
    deduct_credits,
    get_daily_bonus_amount,
    get_daily_bonus_info,
    get_rollover_limit,
    process_monthly_rollover,
)

__all__ = [
    # Models
    "CreditTransaction",
    "DailyBonus",
    # Schemas
    "CreditAdd",
    "CreditDeduct",
    "DailyBonusClaimResponse",
    "DailyBonusInfo",
    "TransactionResponse",
    "TransactionType",
    # Service functions
    "add_credits",
    "award_referral_bonus",
    "claim_daily_bonus",
    "deduct_credits",
    "get_daily_bonus_amount",
    "get_daily_bonus_info",
    "get_rollover_limit",
    "process_monthly_rollover",
]
