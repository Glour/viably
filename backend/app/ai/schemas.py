"""Pydantic schemas for AI generation module."""

from enum import Enum

from pydantic import BaseModel, Field


class AiServiceStatus(str, Enum):
    """AI service operational status."""

    OPERATIONAL = "operational"
    DEGRADED = "degraded"
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


class GenerationMetrics(BaseModel):
    """Metrics from a code generation run."""

    input_tokens: int = Field(..., description="Tokens in the input prompt")
    output_tokens: int = Field(..., description="Tokens in the generated response")
    files_generated: int = Field(..., description="Number of code files extracted")
    model_used: str = Field(..., description="AI model used for generation")


class CodeExtractionResult(BaseModel):
    """Result of extracting code files from AI response."""

    files: dict[str, str] = Field(
        ...,
        description="Mapping of filename to code content",
    )
    file_count: int = Field(..., description="Total number of files extracted")
    extensions: dict[str, int] = Field(
        ...,
        description="Count of files by extension",
    )
