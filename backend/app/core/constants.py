"""Shared business constants for plan-based limits and bonuses.

This module centralizes plan-related constants that were previously duplicated
across users/service.py and credits/service.py.

Note on DAILY_BONUS values:
- DAILY_BONUS_CLAIMABLE: Used for actual credit operations when claiming bonus.
  Free tier gets 0 to enforce upgrade incentive.
"""

from typing import Final

# Rollover limits per plan (maximum credits that can be carried over monthly)
ROLLOVER_LIMITS: Final[dict[str, int]] = {
    "free": 0,
    "starter": 200,
    "pro": 600,
    "business": 2000,
}

# Daily bonus amounts for actual credit claiming
# Free tier gets 0 to enforce upgrade incentive
DAILY_BONUS_CLAIMABLE: Final[dict[str, int]] = {
    "free": 0,
    "starter": 3,
    "pro": 10,
    "business": 20,
}

# Referral bonus (credits awarded to referrer when new user signs up)
REFERRAL_BONUS: Final[int] = 5


def get_rollover_limit(plan: str) -> int:
    """Get rollover limit for a plan.

    Args:
        plan: User's subscription plan name.

    Returns:
        Maximum credits that can be carried over monthly (0 for unknown plans).
    """
    return ROLLOVER_LIMITS.get(plan, 0)


def get_daily_bonus_claimable(plan: str) -> int:
    """Get actual claimable daily bonus amount.

    Args:
        plan: User's subscription plan name.

    Returns:
        Daily bonus amount user can claim (0 for free/unknown plans).
    """
    return DAILY_BONUS_CLAIMABLE.get(plan, 0)
