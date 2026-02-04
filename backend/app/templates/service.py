"""Business logic for templates module."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
        search_pattern = f"%{search}%"
        query = query.where(
            (Template.name.ilike(search_pattern))
            | (Template.description.ilike(search_pattern))
        )

    query = query.order_by(Template.sort_order, Template.usage_count.desc())

    result = await db.execute(query)
    return list(result.scalars().all())
