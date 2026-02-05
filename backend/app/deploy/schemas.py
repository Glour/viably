"""Pydantic schemas for deploy module."""

import re
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


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
    RENDER = "render"  # Placeholder for future Render.com integration


class DeploymentCreate(BaseModel):
    """Schema for creating a new deployment."""

    platform: DeploymentPlatform = DeploymentPlatform.RAILWAY
    env_variables: dict[str, str] = Field(default_factory=dict)

    @field_validator("env_variables")
    @classmethod
    def validate_env_vars(cls, v: dict[str, str]) -> dict[str, str]:
        """Validate environment variable names and values.

        Args:
            v: Environment variables dictionary.

        Returns:
            Validated environment variables.

        Raises:
            ValueError: If validation fails.
        """
        for key, value in v.items():
            # Validate key format: uppercase letters, numbers, and underscores
            if not re.match(r'^[A-Z][A-Z0-9_]*$', key):
                raise ValueError(
                    f"Invalid env var name '{key}'. "
                    "Must start with uppercase letter and contain only uppercase letters, numbers, and underscores."
                )

            # Validate value length to prevent abuse
            if len(value) > 10000:
                raise ValueError(
                    f"Env var value for '{key}' exceeds maximum length of 10000 characters"
                )

        return v


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
