"""Business logic for templates module."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.repositories.template_repository import TemplateRepository
from infrastructure.database.models.templates import Template


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
    repo = TemplateRepository(db)
    templates = await repo.list_active_templates(category=category, search=search)
    return list(templates)


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
    repo = TemplateRepository(db)
    template = await repo.get_active_by_id(template_id)

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
    repo = TemplateRepository(db)
    template = await repo.get_active_by_slug(slug)

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
    repo = TemplateRepository(db)
    await repo.increment_usage_count(template_id)
    await db.commit()
