"""Pydantic models for generation output validation."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ValidationError(BaseModel):
    """Single validation error found in generated output."""

    file_path: str
    severity: Literal["error", "warning"]
    code: str
    message: str
    line: int | None = None
    auto_fixable: bool = False


class ValidationResult(BaseModel):
    """Aggregated validation result for a generation run."""

    passed: bool
    errors: list[ValidationError] = Field(default_factory=list)
    warnings: list[ValidationError] = Field(default_factory=list)
    auto_fixed_count: int = 0
