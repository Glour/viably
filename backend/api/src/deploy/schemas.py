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

    DOCKER = "docker"
    RENDER = "render"  # Placeholder for future Render.com integration


class DeploymentCreate(BaseModel):
    """Schema for creating a new deployment."""

    platform: DeploymentPlatform = DeploymentPlatform.DOCKER
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
                    "Must start with uppercase letter and"
                    " contain only uppercase letters,"
                    " numbers, and underscores."
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
    custom_domain: Optional[str] = None
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


class CustomDomainSet(BaseModel):
    """Schema for setting a custom domain."""

    domain: str = Field(..., min_length=3, max_length=253)

    @field_validator("domain")
    @classmethod
    def validate_domain(cls, v: str) -> str:
        v = v.strip().lower()
        # Remove protocol if user accidentally included it
        v = re.sub(r'^https?://', '', v)
        # Remove trailing slash
        v = v.rstrip('/')
        # Basic hostname validation: labels separated by dots
        label_re = re.compile(r'^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?$')
        labels = v.split('.')
        if len(labels) < 2:
            raise ValueError("Domain must include at least one dot (e.g. example.com)")
        for label in labels:
            if not label_re.match(label):
                raise ValueError(f"Invalid domain format: '{v}'")
        return v


class CustomDomainVerifyResponse(BaseModel):
    """Response for DNS verification check."""

    domain: str
    verified: bool
    cname_found: Optional[str] = None
    expected_cname: str
    message: str
