"""Pydantic schemas for deploy module."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DeploymentStatus(str, Enum):
    """Deployment lifecycle status."""

    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    FAILED = "failed"
    STOPPED = "stopped"


class DeploymentPlatform(str, Enum):
    """Supported deployment platforms."""

    RAILWAY = "railway"
    RENDER = "render"


class DeploymentCreate(BaseModel):
    """Schema for creating a new deployment."""

    platform: DeploymentPlatform = DeploymentPlatform.RAILWAY
    env_variables: dict[str, str] = Field(default_factory=dict)


class DeploymentResponse(BaseModel):
    """Schema for deployment response."""

    id: UUID
    project_id: UUID
    platform: str
    status: DeploymentStatus
    url: Optional[str] = None
    build_url: Optional[str] = None
    admin_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    deployed_at: Optional[datetime] = None
    last_health_check: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DeploymentLogsResponse(BaseModel):
    """Schema for deployment logs response."""

    deployment_id: UUID
    logs: Optional[str] = None
    status: DeploymentStatus
