"""Repository for EmailLog model."""

from typing import Optional, Sequence, Tuple
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.emails import EmailLog
from infrastructure.database.repositories.base import BaseRepository


class EmailRepository(BaseRepository[EmailLog]):
    """Repository for EmailLog operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository.

        Args:
            db: Database session
        """
        super().__init__(db, EmailLog)

    async def get_by_user(
        self,
        user_id: UUID,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[EmailLog], int]:
        """Get email logs for a specific user with pagination.

        Args:
            user_id: User UUID
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (email logs list, total count)
        """
        filters = [EmailLog.user_id == user_id]

        # Get logs
        logs = await self.list(
            filters=filters,
            order_by=desc(EmailLog.created_at),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return logs, total

    async def get_by_status(
        self,
        status: str,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[EmailLog], int]:
        """Get email logs by status with pagination.

        Args:
            status: Email status (pending, sent, failed)
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (email logs list, total count)
        """
        filters = [EmailLog.status == status]

        # Get logs
        logs = await self.list(
            filters=filters,
            order_by=desc(EmailLog.created_at),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return logs, total

    async def get_by_type(
        self,
        email_type: str,
        user_id: Optional[UUID] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[EmailLog], int]:
        """Get email logs by type with optional user filter and pagination.

        Args:
            email_type: Email type (welcome, generation_complete, etc.)
            user_id: Optional user ID filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (email logs list, total count)
        """
        filters = [EmailLog.email_type == email_type]

        if user_id:
            filters.append(EmailLog.user_id == user_id)

        # Get logs
        logs = await self.list(
            filters=filters,
            order_by=desc(EmailLog.created_at),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return logs, total

    async def count_by_status(self, status: str) -> int:
        """Count email logs by status.

        Args:
            status: Email status (pending, sent, failed)

        Returns:
            Number of logs with given status
        """
        filters = [EmailLog.status == status]
        return await self.count(filters=filters)

    async def count_by_type(
        self,
        email_type: str,
        user_id: Optional[UUID] = None,
    ) -> int:
        """Count email logs by type with optional user filter.

        Args:
            email_type: Email type
            user_id: Optional user ID filter

        Returns:
            Number of logs matching criteria
        """
        filters = [EmailLog.email_type == email_type]

        if user_id:
            filters.append(EmailLog.user_id == user_id)

        return await self.count(filters=filters)

    async def get_pending_emails(
        self,
        limit: Optional[int] = None,
    ) -> Sequence[EmailLog]:
        """Get pending emails for processing.

        Args:
            limit: Maximum number of results

        Returns:
            List of pending email logs
        """
        filters = [EmailLog.status == "pending"]

        return await self.list(
            filters=filters,
            order_by=EmailLog.created_at,  # Oldest first
            limit=limit,
        )

    async def get_failed_emails(
        self,
        limit: Optional[int] = None,
    ) -> Sequence[EmailLog]:
        """Get failed emails for retry.

        Args:
            limit: Maximum number of results

        Returns:
            List of failed email logs
        """
        filters = [EmailLog.status == "failed"]

        return await self.list(
            filters=filters,
            order_by=desc(EmailLog.created_at),
            limit=limit,
        )
