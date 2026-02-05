"""Database models for users module.

Note: CreditTransaction model has been moved to app/credits/models.py.
Import from app.credits if needed.
"""

# Re-export CreditTransaction for backward compatibility
from app.credits.models import CreditTransaction, DailyBonus

__all__ = ["CreditTransaction", "DailyBonus"]
