"""Pydantic schemas for projects module."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.projects.models import ProjectStatus


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    template_id: UUID
    config: dict[str, Any] | None = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    config: dict[str, Any] | None = None
    is_public: bool | None = None


class ProjectResponse(BaseModel):
    """Project in list view (compact)."""

    id: UUID
    user_id: UUID
    name: str
    description: str | None
    template_id: UUID
    config: dict[str, Any] | None
    status: ProjectStatus
    is_public: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    """Full project details including generated code."""

    generated_code: dict[str, Any] | None
    generation_logs: str | None
    ai_model_used: str | None
    error_message: str | None
    deployed_url: str | None
    deploy_platform: str | None
    generated_at: datetime | None
    deployed_at: datetime | None


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""

    items: list[ProjectResponse]
    total: int
    page: int
    per_page: int
    pages: int
