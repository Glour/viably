"""FastAPI routes for templates module.

DESIGN DECISION: Templates endpoints are intentionally public (no authentication).
Templates serve as a public catalog for the MVP, allowing users to browse
available project templates before signing up. This is a deliberate product
decision to reduce friction in the user journey.

Security considerations:
- Templates contain no user-specific data
- Prompt templates and config schemas are non-proprietary
- Rate limiting is applied to prevent abuse
- Future versions may add authentication for premium templates
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.templates.schemas import TemplateDetail, TemplateListItem, TemplatesListResponse
from app.templates.service import get_template_by_id, get_template_by_slug, list_templates

router = APIRouter()


@router.get("", response_model=dict, dependencies=[Depends(RateLimiter(times=30, minutes=1))])
async def get_templates(
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, min_length=1, max_length=100, description="Search term"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List all active templates.

    Optionally filter by category or search in name/description.

    Args:
        category: Filter by category (telegram_bot, api_service).
        search: Search in name and description (case-insensitive).
        db: Database session.

    Returns:
        List of templates.
    """
    templates = await list_templates(db=db, category=category, search=search)

    return {
        "data": TemplatesListResponse(
            templates=[TemplateListItem.model_validate(t) for t in templates]
        ).model_dump()
    }


@router.get("/{template_id}", response_model=dict, dependencies=[Depends(RateLimiter(times=30, minutes=1))])
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get template details by ID or slug.

    Accepts either a UUID or a slug as the template identifier.

    Args:
        template_id: Template UUID or slug.
        db: Database session.

    Returns:
        Full template details including config_schema.

    Raises:
        404: Template not found or inactive.
    """
    # Try to parse as UUID, otherwise treat as slug
    try:
        uuid_id = UUID(template_id)
        template = await get_template_by_id(uuid_id, db)
    except ValueError:
        # Not a valid UUID, treat as slug
        template = await get_template_by_slug(template_id, db)

    return {"data": TemplateDetail.model_validate(template).model_dump()}
