"""Repository for Template model."""

from typing import Optional, Sequence, Tuple
from uuid import UUID

from sqlalchemy import desc, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.templates import Template
from infrastructure.database.repositories.base import BaseRepository
from infrastructure.database.utils import escape_like_pattern


class TemplateRepository(BaseRepository[Template]):
    """Repository for Template operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository.

        Args:
            db: Database session
        """
        super().__init__(db, Template)

    async def get_by_slug(self, slug: str) -> Optional[Template]:
        """Get template by slug.

        Args:
            slug: Template slug

        Returns:
            Template or None if not found
        """
        stmt = select(Template).where(Template.slug == slug)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_id(self, template_id: UUID) -> Optional[Template]:
        """Get active template by ID.

        Args:
            template_id: Template UUID

        Returns:
            Template or None if not found or inactive
        """
        stmt = select(Template).where(
            Template.id == template_id,
            Template.is_active == True,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_slug(self, slug: str) -> Optional[Template]:
        """Get active template by slug.

        Args:
            slug: Template slug

        Returns:
            Template or None if not found or inactive
        """
        stmt = select(Template).where(
            Template.slug == slug,
            Template.is_active == True,  # noqa: E712
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_active_templates(
        self,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Sequence[Template]:
        """List all active templates with optional filtering.

        Args:
            category: Filter by category (telegram_bot, api_service)
            search: Search in name/description (case-insensitive)

        Returns:
            List of templates sorted by sort_order, then usage_count descending
        """
        stmt = select(Template).where(Template.is_active == True)  # noqa: E712

        if category:
            stmt = stmt.where(Template.category == category)

        if search:
            # Escape LIKE special characters to prevent pattern injection
            escaped_search = escape_like_pattern(search)
            search_pattern = f"%{escaped_search}%"
            stmt = stmt.where(
                or_(
                    Template.name.ilike(search_pattern),
                    Template.description.ilike(search_pattern),
                )
            )

        stmt = stmt.order_by(Template.sort_order, desc(Template.usage_count))

        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_by_category(
        self,
        category: str,
        is_active: bool = True,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[Template], int]:
        """List templates by category with pagination.

        Args:
            category: Template category
            is_active: Filter by active status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (templates list, total count)
        """
        filters = [
            Template.category == category,
            Template.is_active == is_active,
        ]

        # Get templates
        templates = await self.list(
            filters=filters,
            order_by=Template.sort_order,
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return templates, total

    async def search_templates(
        self,
        query: str,
        category: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[Template], int]:
        """Search templates by name/description with pagination.

        Args:
            query: Search query string
            category: Optional category filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (templates list, total count)
        """
        escaped_query = escape_like_pattern(query)
        search_pattern = f"%{escaped_query}%"

        filters = [
            Template.is_active == True,  # noqa: E712
            or_(
                Template.name.ilike(search_pattern),
                Template.description.ilike(search_pattern),
            ),
        ]

        if category:
            filters.append(Template.category == category)

        # Get templates
        templates = await self.list(
            filters=filters,
            order_by=desc(Template.usage_count),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return templates, total

    async def increment_usage_count(self, template_id: UUID) -> bool:
        """Increment template usage counter atomically.

        Args:
            template_id: Template UUID

        Returns:
            True if incremented, False if template not found
        """
        stmt = (
            update(Template)
            .where(Template.id == template_id)
            .values(usage_count=Template.usage_count + 1)
        )
        result = await self.db.execute(stmt)
        await self.db.flush()
        return result.rowcount > 0

    async def get_popular_templates(
        self,
        limit: int = 10,
        category: Optional[str] = None,
    ) -> Sequence[Template]:
        """Get most popular templates by usage count.

        Args:
            limit: Maximum number of results
            category: Optional category filter

        Returns:
            List of popular templates
        """
        filters = [Template.is_active == True]  # noqa: E712

        if category:
            filters.append(Template.category == category)

        return await self.list(
            filters=filters,
            order_by=desc(Template.usage_count),
            limit=limit,
        )
