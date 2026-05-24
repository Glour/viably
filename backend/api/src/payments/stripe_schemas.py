"""Pydantic schemas for Stripe payment endpoints."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StripeCheckoutRequest(BaseModel):
    """Request to create Stripe checkout session."""
    
    plan_id: str = Field(..., description="Plan ID: 'pro' or 'enterprise'")
    currency: str = Field("usd", description="Currency code: 'usd', 'eur', or 'rub'")
    success_url: str = Field(..., description="URL to redirect after successful payment")
    cancel_url: str = Field(..., description="URL to redirect after canceled payment")


class StripeCheckoutResponse(BaseModel):
    """Response after creating checkout session."""
    
    session_id: str = Field(..., description="Stripe Checkout Session ID")
    url: str = Field(..., description="URL to redirect user to Stripe Checkout")
    payment_id: str = Field(..., description="Internal payment record ID")


class BillingPortalRequest(BaseModel):
    """Request to create billing portal session."""
    
    return_url: str = Field(..., description="URL to redirect after exiting portal")


class BillingPortalResponse(BaseModel):
    """Response after creating billing portal session."""
    
    url: str = Field(..., description="URL to redirect user to Stripe Customer Portal")


class CancelSubscriptionRequest(BaseModel):
    """Request to cancel subscription."""
    
    immediate: bool = Field(False, description="Cancel immediately (True) or at period end (False)")


class CancelSubscriptionResponse(BaseModel):
    """Response after canceling subscription."""
    
    status: str = Field(..., description="Subscription status")
    cancel_at_period_end: bool
    current_period_end: Optional[datetime] = None


class SubscriptionStatusResponse(BaseModel):
    """Current user's subscription status."""
    
    plan: str = Field(..., description="Current plan: 'free', 'pro', or 'enterprise'")
    status: str = Field(..., description="Subscription status")
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool
