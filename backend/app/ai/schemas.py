"""Pydantic schemas for AI generation module."""

from enum import Enum

from pydantic import BaseModel, Field


class AiServiceStatus(str, Enum):
    """AI service operational status."""

    OPERATIONAL = "operational"
    DEGRADED = "degraded"  # Placeholder for future partial outage detection
    DOWN = "down"


class AiStatusResponse(BaseModel):
    """Response schema for AI service status endpoint."""

    status: AiServiceStatus = Field(
        ...,
        description="Current operational status of the AI service",
    )
    model: str = Field(
        ...,
        description="Currently configured AI model for generation",
    )

    model_config = {"from_attributes": True}


