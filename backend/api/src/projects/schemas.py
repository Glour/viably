"""Pydantic schemas for projects module."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from infrastructure.database.models.projects import ProjectStatus


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    template_id: UUID | None = None  # Can be null for empty projects
    config: dict[str, Any] | None = None
    allow_empty: bool = False  # Enable empty project creation


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
    template_id: UUID | None  # Nullable for empty projects
    allow_empty: bool
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


class GenerateRequest(BaseModel):
    """Optional body for triggering generation with user prompt."""

    user_prompt: str | None = Field(None, max_length=5000)


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""

    items: list[ProjectResponse]
    total: int
    page: int
    per_page: int
    pages: int


class ProjectCodeFile(BaseModel):
    """Single generated code file."""

    path: str
    content: str
    language: str = "python"  # Default to Python, can be inferred from file extension


class ProjectCodeResponse(BaseModel):
    """Generated code files for a project."""

    files: list[ProjectCodeFile]
