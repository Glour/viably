"""Database utility functions for common query patterns."""

import re
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from infrastructure.database.models.auth import User


async def get_user_with_lock(user_id: UUID, db: AsyncSession) -> "User":
    """Get user with row lock for atomic operations.

    Args:
        user_id: User UUID
        db: Database session

    Returns:
        User instance with row lock acquired

    Raises:
        HTTPException 404: If user not found

    Example:
        >>> user = await get_user_with_lock(user_id, db)
        >>> user.credits -= 10  # Safe atomic operation
        >>> await db.commit()
    """
    from infrastructure.database.models.auth import User
    from fastapi import HTTPException, status

    stmt = select(User).where(User.id == user_id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )

    return user


def escape_like_pattern(s: str) -> str:
    """Escape special LIKE characters to prevent pattern injection.

    Args:
        s: Input string to escape.

    Returns:
        Escaped string safe for LIKE queries.

    Example:
        >>> escape_like_pattern("test%name")
        'test\\\\%name'
        >>> escape_like_pattern("user_123")
        'user\\\\_123'

    Note:
        This prevents SQL injection in LIKE queries by escaping:
        - % (wildcard for any characters)
        - _ (wildcard for single character)
        - \\ (escape character itself)
    """
    return re.sub(r'([%_\\])', r'\\\1', s)
