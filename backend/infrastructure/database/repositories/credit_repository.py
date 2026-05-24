"""Repository for CreditTransaction and DailyBonus models."""

from datetime import date
from typing import Optional, Sequence, Tuple
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.credits import CreditTransaction, DailyBonus
from infrastructure.database.repositories.base import BaseRepository


class CreditRepository(BaseRepository[CreditTransaction]):
    """Repository for credit transaction operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository.

        Args:
            db: Database session
        """
        super().__init__(db, CreditTransaction)

    async def get_user_transactions(
        self,
        user_id: UUID,
        transaction_type: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[CreditTransaction], int]:
        """Get user's credit transactions with pagination.

        Args:
            user_id: User UUID
            transaction_type: Optional filter by transaction type
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (transactions list, total count)
        """
        filters = [CreditTransaction.user_id == user_id]

        if transaction_type:
            filters.append(CreditTransaction.transaction_type == transaction_type)

        # Get transactions
        transactions = await self.list(
            filters=filters,
            order_by=desc(CreditTransaction.created_at),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return transactions, total

    async def create_transaction(
        self,
        user_id: UUID,
        amount: int,
        balance_after: int,
        transaction_type: str,
        project_id: Optional[UUID] = None,
        related_user_id: Optional[UUID] = None,
        description: Optional[str] = None,
        extra_data: Optional[dict] = None,
    ) -> CreditTransaction:
        """Create a credit transaction record.

        Args:
            user_id: User UUID
            amount: Credit amount (positive for credit, negative for debit)
            balance_after: User's balance after this transaction
            transaction_type: Transaction type (signup, daily_bonus, etc.)
            project_id: Optional project reference
            related_user_id: Optional related user (for referrals)
            description: Optional description
            extra_data: Additional metadata

        Returns:
            Created transaction
        """
        return await self.create(
            user_id=user_id,
            amount=amount,
            balance_after=balance_after,
            transaction_type=transaction_type,
            project_id=project_id,
            related_user_id=related_user_id,
            description=description,
            extra_data=extra_data or {},
        )

    async def get_last_transaction(
        self,
        user_id: UUID,
    ) -> Optional[CreditTransaction]:
        """Get user's most recent transaction.

        Args:
            user_id: User UUID

        Returns:
            Most recent transaction or None
        """
        stmt = (
            select(CreditTransaction)
            .where(CreditTransaction.user_id == user_id)
            .order_by(desc(CreditTransaction.created_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_transactions_by_type(
        self,
        user_id: UUID,
        transaction_type: str,
        limit: Optional[int] = None,
    ) -> Sequence[CreditTransaction]:
        """Get user's transactions of specific type.

        Args:
            user_id: User UUID
            transaction_type: Transaction type to filter
            limit: Maximum number of results

        Returns:
            List of matching transactions
        """
        filters = [
            CreditTransaction.user_id == user_id,
            CreditTransaction.transaction_type == transaction_type,
        ]

        return await self.list(
            filters=filters,
            order_by=desc(CreditTransaction.created_at),
            limit=limit,
        )

    # DailyBonus operations
    async def get_daily_bonus_for_date(
        self,
        user_id: UUID,
        bonus_date: date,
    ) -> Optional[DailyBonus]:
        """Get daily bonus record for specific date.

        Args:
            user_id: User UUID
            bonus_date: Date to check

        Returns:
            DailyBonus record or None
        """
        stmt = select(DailyBonus).where(
            DailyBonus.user_id == user_id,
            DailyBonus.bonus_date == bonus_date,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_daily_bonus(
        self,
        user_id: UUID,
        credits_awarded: int,
        bonus_date: date,
    ) -> DailyBonus:
        """Create daily bonus record.

        Args:
            user_id: User UUID
            credits_awarded: Credits awarded
            bonus_date: Bonus date

        Returns:
            Created DailyBonus record
        """
        daily_bonus = DailyBonus(
            user_id=user_id,
            credits_awarded=credits_awarded,
            bonus_date=bonus_date,
        )
        self.db.add(daily_bonus)
        await self.db.flush()
        await self.db.refresh(daily_bonus)
        return daily_bonus

    async def has_claimed_bonus_today(
        self,
        user_id: UUID,
        today: date,
    ) -> bool:
        """Check if user has claimed bonus for given date.

        Args:
            user_id: User UUID
            today: Date to check

        Returns:
            True if already claimed, False otherwise
        """
        bonus = await self.get_daily_bonus_for_date(user_id, today)
        return bonus is not None

    async def get_user_bonuses(
        self,
        user_id: UUID,
        limit: Optional[int] = None,
    ) -> Sequence[DailyBonus]:
        """Get user's daily bonus history.

        Args:
            user_id: User UUID
            limit: Maximum number of results

        Returns:
            List of daily bonuses
        """
        stmt = (
            select(DailyBonus)
            .where(DailyBonus.user_id == user_id)
            .order_by(desc(DailyBonus.bonus_date))
        )

        if limit:
            stmt = stmt.limit(limit)

        result = await self.db.execute(stmt)
        return result.scalars().all()
