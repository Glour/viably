"""Templates module for managing bot and API service templates."""

from app.templates.models import Template
from app.templates.routes import router
from app.templates.schemas import TemplateDetail, TemplateListItem, TemplatesListResponse
from app.templates.service import (
    get_template_by_id,
    get_template_by_slug,
    increment_usage_count,
    list_templates,
)

__all__ = [
    "Template",
    "TemplateDetail",
    "TemplateListItem",
    "TemplatesListResponse",
    "get_template_by_id",
    "get_template_by_slug",
    "increment_usage_count",
    "list_templates",
    "router",
]
