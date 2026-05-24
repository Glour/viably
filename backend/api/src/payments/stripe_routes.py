"""Stripe payment API routes."""

import structlog
import stripe

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header, Form
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from api.src.payments.stripe_schemas import (
    StripeCheckoutRequest,
    StripeCheckoutResponse,
    BillingPortalRequest,
    BillingPortalResponse,
    CancelSubscriptionRequest,
    CancelSubscriptionResponse,
    SubscriptionStatusResponse,
)
from api.src.payments.stripe_service import (
    create_checkout_session,
    handle_webhook_event,
    cancel_subscription,
    create_billing_portal_session,
    get_subscription_status,
)
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db
from settings.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/stripe", tags=["stripe"])


@router.post("/create-checkout", response_model=StripeCheckoutResponse)
async def create_stripe_checkout_endpoint(
    body: StripeCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe Checkout Session for subscription.
    
    This endpoint creates a checkout session and returns a URL to redirect
    the user to Stripe's hosted checkout page.
    
    **Supported plans:** `pro`, `enterprise`
    
    **Supported currencies:** `usd`, `eur`, `rub`
    """
    try:
        result = await create_checkout_session(
            db=db,
            user_id=current_user.id,
            plan_id=body.plan_id,
            currency=body.currency,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.StripeError as e:
        logger.error("stripe_checkout_error", error=str(e))
        raise HTTPException(status_code=500, detail="Stripe checkout creation failed")
    except Exception as e:
        logger.error("checkout_unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Checkout creation failed")
    
    return StripeCheckoutResponse(**result)


@router.post("/webhook")
async def stripe_webhook_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    """
    Handle Stripe webhook notifications.
    
    This endpoint receives and processes events from Stripe webhooks.
    **No authentication required** - verified via webhook signature.
    
    Events handled:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("stripe_webhook_secret_not_configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    # Get raw body
    try:
        payload = await request.body()
    except Exception as e:
        logger.error("webhook_body_read_failed", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")
    
    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as e:
        logger.error("webhook_invalid_payload", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error("webhook_signature_verification_failed", error=str(e))
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Process event
    success = await handle_webhook_event(db, event)
    
    if not success:
        logger.warning("webhook_processing_failed", event_type=event["type"])
    
    # Always return 200 to Stripe
    return {"status": "success"}


@router.post("/cancel-subscription", response_model=CancelSubscriptionResponse)
async def cancel_subscription_endpoint(
    body: CancelSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel user's Stripe subscription.
    
    - **immediate=false** (default): Cancel at period end (user retains access until then)
    - **immediate=true**: Cancel immediately (user loses access now)
    """
    try:
        result = await cancel_subscription(
            db=db,
            user_id=current_user.id,
            immediate=body.immediate,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.StripeError as e:
        logger.error("cancel_subscription_error", error=str(e))
        raise HTTPException(status_code=500, detail="Subscription cancellation failed")
    except Exception as e:
        logger.error("cancel_unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Cancellation failed")
    
    return CancelSubscriptionResponse(**result)


@router.post("/billing-portal", response_model=BillingPortalResponse)
async def create_billing_portal_endpoint(
    body: BillingPortalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe Customer Portal session.
    
    Returns a URL to redirect the user to Stripe's Customer Portal where they can:
    - Update payment methods
    - View billing history
    - Download invoices
    - Manage subscription
    """
    try:
        url = await create_billing_portal_session(
            db=db,
            user_id=current_user.id,
            return_url=body.return_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.StripeError as e:
        logger.error("billing_portal_error", error=str(e))
        raise HTTPException(status_code=500, detail="Billing portal creation failed")
    except Exception as e:
        logger.error("billing_portal_unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Portal creation failed")
    
    return BillingPortalResponse(url=url)


@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's subscription status.
    
    Returns:
    - Current plan tier
    - Subscription status
    - Current period end date
    - Whether subscription is set to cancel at period end
    """
    try:
        status = await get_subscription_status(
            db=db,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("subscription_status_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get subscription status")
    
    return SubscriptionStatusResponse(**status)


@router.post("/create-checkout-session")
async def create_checkout_session_endpoint(
    price_id: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """
    Create Stripe Checkout Session with price_id.
    
    Simple endpoint for frontend integration - accepts price_id directly.
    """
    try:
        base_url = settings.OAUTH_REDIRECT_BASE.rstrip("/")
        session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=f"{base_url}/payments/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/payments/cancel",
        )
        return {"url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"stripe_checkout_error: {str(e)}")
        raise HTTPException(status_code=500, detail="Stripe checkout creation failed")
    except Exception as e:
        logger.error(f"checkout_unexpected_error: {str(e)}")
        raise HTTPException(status_code=500, detail="Checkout creation failed")


@router.post("/create-portal-session")
async def create_portal_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create Stripe Customer Portal session (simplified endpoint).
    
    Returns URL to Stripe Customer Portal where user can:
    - Cancel subscription
    - Update payment method
    - View billing history
    """
    try:
        base_url = settings.OAUTH_REDIRECT_BASE.rstrip("/")
        url = await create_billing_portal_session(
            db=db,
            user_id=current_user.id,
            return_url=f"{base_url}/subscription",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.StripeError as e:
        logger.error("portal_creation_error", error=str(e))
        raise HTTPException(status_code=500, detail="Portal creation failed")
    except Exception as e:
        logger.error("portal_unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Portal creation failed")
    
    return {"url": url}
