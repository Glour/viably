"""Database utility functions for common query patterns."""

import re
from typing import TYPE_CHECKING, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

if TYPE_CHECKING:
    from app.auth.models import User

T = TypeVar("T")


async def get_by_id(
    model: type[T],
    id: UUID,
    db: AsyncSession,
    for_update: bool = False,
) -> T | None:
    """Get model instance by ID with optional row lock.

    Args:
        model: SQLAlchemy model class
        id: UUID of the instance to retrieve
        db: Database session
        for_update: If True, lock row for update (SELECT ... FOR UPDATE)

    Returns:
        Model instance or None if not found

    Example:
        >>> user = await get_by_id(User, user_id, db, for_update=True)
        >>> if not user:
        ...     raise not_found("User", user_id)
    """
    stmt = select(model).where(model.id == id)
    if for_update:
        stmt = stmt.with_for_update()
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def paginate(
    query: Select,
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    max_per_page: int = 100,
) -> tuple[list[T], dict[str, int]]:
    """Paginate SQLAlchemy query.

    Args:
        query: SQLAlchemy select query to paginate
        db: Database session
        page: Page number (1-indexed)
        per_page: Items per page
        max_per_page: Maximum items per page (enforced)

    Returns:
        Tuple of (items, pagination_meta) where pagination_meta contains:
        - page: Current page number
        - per_page: Items per page
        - total: Total number of items
        - total_pages: Total number of pages

    Example:
        >>> query = select(User).where(User.plan == "pro")
        >>> items, meta = await paginate(query, db, page=1, per_page=20)
        >>> print(meta)  # {'page': 1, 'per_page': 20, 'total': 100, 'total_pages': 5}
    """
    # Enforce max per_page
    per_page = min(per_page, max_per_page)

    # Count total items
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Calculate total pages
    total_pages = (total + per_page - 1) // per_page if total > 0 else 0

    # Get paginated results
    offset = (page - 1) * per_page
    paginated_query = query.offset(offset).limit(per_page)
    result = await db.execute(paginated_query)
    items = list(result.scalars().all())

    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "total_pages": total_pages,
    }

    return items, meta


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
    from app.auth.models import User
    from app.core.exceptions import not_found

    stmt = select(User).where(User.id == user_id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise not_found("User", user_id)

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
