"""Templates module for managing bot and API service templates."""

from infrastructure.database.models.templates import Template
from api.src.templates.routes import router
from api.src.templates.schemas import TemplateDetail, TemplateListItem, TemplatesListResponse
from api.src.templates.service import (
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
