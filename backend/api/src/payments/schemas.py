"""Pydantic schemas for payments module."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PaymentCreateRequest(BaseModel):
    """Request to create a payment."""
    plan_id: str  # e.g. "starter", "pro", "business"
    return_url: str


class PaymentCreateResponse(BaseModel):
    """Response after creating a payment."""
    payment_id: UUID
    confirmation_url: str
    status: str


class PaymentWebhookData(BaseModel):
    """YooKassa webhook notification data."""
    type: str
    event: str
    object: dict


class PaymentHistoryItem(BaseModel):
    """Single payment in history."""
    id: UUID
    amount: float
    currency: str
    status: str
    plan: str
    created_at: datetime
    yookassa_id: Optional[str] = None

    model_config = {"from_attributes": True}


class PaymentHistoryResponse(BaseModel):
    """Payment history response."""
    payments: list[PaymentHistoryItem]
    total: int
