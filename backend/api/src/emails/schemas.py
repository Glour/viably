"""Pydantic schemas for emails module."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, EmailStr


class EmailLogResponse(BaseModel):
    """Single email log response."""

    id: UUID
    user_id: UUID
    email_type: str
    recipient_email: EmailStr
    subject: str
    template_variables: dict[str, Any] | None = None
    status: str
    error_message: str | None = None
    sent_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailRetryResponse(BaseModel):
    """Response after retrying email send."""

    message: str
    email_log_id: UUID
    status: str
