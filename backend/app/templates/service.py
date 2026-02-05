"""Business logic for templates module."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db_utils import escape_like_pattern
from app.templates.models import Template


async def list_templates(
    db: AsyncSession,
    category: str | None = None,
    search: str | None = None,
) -> list[Template]:
    """List all active templates.

    Args:
        db: Database session.
        category: Filter by category (telegram_bot, api_service).
        search: Search in name/description (case-insensitive).

    Returns:
        List of templates sorted by sort_order, then usage_count descending.
    """
    query = select(Template).where(Template.is_active == True)  # noqa: E712

    if category:
        query = query.where(Template.category == category)

    if search:
        # Escape LIKE special characters to prevent pattern injection
        escaped_search = escape_like_pattern(search)
        search_pattern = f"%{escaped_search}%"
        query = query.where(
            (Template.name.ilike(search_pattern))
            | (Template.description.ilike(search_pattern))
        )

    query = query.order_by(Template.sort_order, Template.usage_count.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_template_by_id(template_id: UUID, db: AsyncSession) -> Template:
    """Get template by ID.

    Args:
        template_id: Template UUID.
        db: Database session.

    Returns:
        Template object.

    Raises:
        HTTPException 404: If template not found or inactive.
    """
    query = select(Template).where(
        Template.id == template_id,
        Template.is_active == True,  # noqa: E712
    )
    result = await db.execute(query)
    template = result.scalar_one_or_none()

    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    return template


async def get_template_by_slug(slug: str, db: AsyncSession) -> Template:
    """Get template by slug.

    Args:
        slug: Template slug.
        db: Database session.

    Returns:
        Template object.

    Raises:
        HTTPException 404: If template not found or inactive.
    """
    query = select(Template).where(
        Template.slug == slug,
        Template.is_active == True,  # noqa: E712
    )
    result = await db.execute(query)
    template = result.scalar_one_or_none()

    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    return template


async def increment_usage_count(template_id: UUID, db: AsyncSession) -> None:
    """Increment template usage counter atomically.

    Called when a project is created with this template.

    Args:
        template_id: Template UUID.
        db: Database session.
    """
    stmt = (
        update(Template)
        .where(Template.id == template_id)
        .values(usage_count=Template.usage_count + 1)
    )
    await db.execute(stmt)
    await db.commit()
