"""Repository for User model."""

from datetime import UTC, datetime
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.auth import User
from infrastructure.database.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository.

        Args:
            db: Database session
        """
        super().__init__(db, User)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email (case-insensitive).

        Args:
            email: User email address

        Returns:
            User or None if not found
        """
        stmt = select(User).where(User.email == email.lower())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_referral_code(self, referral_code: str) -> Optional[User]:
        """Get user by referral code.

        Args:
            referral_code: Referral code

        Returns:
            User or None if not found
        """
        stmt = select(User).where(User.referral_code == referral_code)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_credits(self, user_id: UUID, new_balance: int) -> Optional[User]:
        """Update user credits with row locking.

        Args:
            user_id: User UUID
            new_balance: New credits balance

        Returns:
            Updated user or None if not found
        """
        user = await self.get_by_id_with_lock(user_id)
        if not user:
            return None

        user.credits = new_balance
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def increment_credits(self, user_id: UUID, amount: int) -> Optional[User]:
        """Increment user credits atomically.

        Args:
            user_id: User UUID
            amount: Amount to add (can be negative)

        Returns:
            Updated user or None if not found
        """
        user = await self.get_by_id_with_lock(user_id)
        if not user:
            return None

        user.credits += amount
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user_id: UUID) -> bool:
        """Update user's last login timestamp.

        Args:
            user_id: User UUID

        Returns:
            True if updated, False if user not found
        """
        user = await self.get_by_id(user_id)
        if not user:
            return False

        user.last_login_at = datetime.now(UTC)
        await self.db.flush()
        return True

    async def get_referrals(self, user_id: UUID) -> Sequence[User]:
        """Get users referred by the given user.

        Args:
            user_id: Referrer user UUID

        Returns:
            List of referred users
        """
        stmt = select(User).where(User.referred_by == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def count_referrals(self, user_id: UUID) -> int:
        """Count users referred by the given user.

        Args:
            user_id: Referrer user UUID

        Returns:
            Number of referred users
        """
        filters = [User.referred_by == user_id]
        return await self.count(filters=filters)

    async def email_exists(self, email: str) -> bool:
        """Check if email already exists.

        Args:
            email: Email address to check

        Returns:
            True if exists, False otherwise
        """
        user = await self.get_by_email(email)
        return user is not None

    async def get_active_users(
        self,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Sequence[User]:
        """Get active users with pagination.

        Args:
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of active users
        """
        filters = [
            User.is_active == True,  # noqa: E712
            User.is_verified == True,  # noqa: E712
        ]

        return await self.list(
            filters=filters,
            limit=limit,
            offset=offset,
        )
