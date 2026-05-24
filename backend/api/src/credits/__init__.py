"""Credits module for managing credit economy."""

from infrastructure.database.models.credits import CreditTransaction, DailyBonus
from api.src.credits.schemas import (
    DailyBonusClaimResponse,
    DailyBonusInfo,
    TransactionResponse,
    TransactionType,
)
from api.src.credits.service import (
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
