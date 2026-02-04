"""Pydantic schemas for templates module."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TemplateListItem(BaseModel):
    """Template in list view (compact)."""

    id: UUID
    name: str
    slug: str
    description: str | None
    category: str
    credit_cost: int
    preview_image_url: str | None
    features: list[str]
    tags: list[str]
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateDetail(BaseModel):
    """Full template details."""

    id: UUID
    name: str
    slug: str
    description: str | None
    category: str
    credit_cost: int
    config_schema: dict  # JSON Schema
    preview_image_url: str | None
    features: list[str]
    tags: list[str]
    usage_count: int
    example_config: dict | None = None  # Example values for config
    created_at: datetime

    class Config:
        from_attributes = True


class TemplatesListResponse(BaseModel):
    """Response for template list endpoint."""

    templates: list[TemplateListItem]
