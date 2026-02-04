"""FastAPI routes for templates module."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.templates.schemas import TemplateListItem, TemplatesListResponse
from app.templates.service import list_templates

router = APIRouter()


@router.get("", response_model=dict)
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
