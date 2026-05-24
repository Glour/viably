"""Stripe integration service for Viably."""

import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone

import stripe
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.payments import Payment
from infrastructure.database.models.auth import User
from infrastructure.database.models.credits import CreditTransaction
from settings.config import settings
from api.src.payments.stripe_config import get_stripe_price_config, SUPPORTED_CURRENCIES, TIER_CREDITS

logger = structlog.get_logger(__name__)

# Configure Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    stripe.api_version = "2023-10-16"


async def get_or_create_stripe_customer(
    db: AsyncSession,
    user: User,
) -> str:
    """Get existing Stripe customer ID or create new customer."""
    
    # If user already has a Stripe customer ID, return it
    if user.stripe_customer_id:
        return user.stripe_customer_id
    
    # Create new Stripe customer
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name or user.email,
            metadata={
                "user_id": str(user.id),
                "viably_plan": user.plan,
            },
        )
        
        # Store customer ID
        user.stripe_customer_id = customer.id
        await db.commit()
        await db.refresh(user)
        
        logger.info("stripe_customer_created", user_id=str(user.id), customer_id=customer.id)
        return customer.id
        
    except stripe.error.StripeError as e:
        logger.error("stripe_customer_creation_failed", user_id=str(user.id), error=str(e))
        raise


async def create_checkout_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    plan_id: str,
    currency: str,
    success_url: str,
    cancel_url: str,
) -> Dict[str, Any]:
    """
    Create Stripe Checkout Session for subscription.
    
    Returns:
        {
            "session_id": "cs_xxx",
            "url": "https://checkout.stripe.com/xxx",
            "payment_id": "uuid-xxx"
        }
    """
    
    # Validate currency
    currency = currency.lower()
    if currency not in SUPPORTED_CURRENCIES:
        raise ValueError(f"Unsupported currency: {currency}")
    
    # Validate plan
    if plan_id not in ["starter", "pro", "business"]:
        raise ValueError(f"Invalid plan: {plan_id}. Must be 'starter', 'pro', or 'business'")
    
    # Get price configuration
    price_config = get_stripe_price_config(plan_id, currency)
    if not price_config:
        raise ValueError(f"No price configuration for {plan_id}/{currency}")
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError(f"User not found: {user_id}")
    
    # Get or create Stripe customer
    customer_id = await get_or_create_stripe_customer(db, user)
    
    # Create checkout session
    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_config.stripe_price_id,
                    "quantity": 1,
                },
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": str(user_id),
                "plan_id": plan_id,
                "currency": currency,
            },
            subscription_data={
                "metadata": {
                    "user_id": str(user_id),
                    "plan_id": plan_id,
                },
            },
        )
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            amount=price_config.amount / 100.0,  # Convert cents to currency units
            currency=currency.upper(),
            status="pending",
            plan=plan_id,
            provider="stripe",
            stripe_customer_id=customer_id,
            extra_data={
                "checkout_session_id": session.id,
                "stripe_price_id": price_config.stripe_price_id,
            },
        )
        
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        
        logger.info(
            "stripe_checkout_created",
            user_id=str(user_id),
            plan_id=plan_id,
            session_id=session.id,
            payment_id=str(payment.id),
        )
        
        return {
            "session_id": session.id,
            "url": session.url,
            "payment_id": str(payment.id),
        }
        
    except stripe.error.StripeError as e:
        logger.error("stripe_checkout_failed", user_id=str(user_id), error=str(e))
        raise


async def handle_webhook_event(
    db: AsyncSession,
    event: stripe.Event,
) -> bool:
    """
    Process Stripe webhook events.
    
    Returns:
        True if event was handled successfully, False otherwise.
    """
    
    event_type = event["type"]
    data = event["data"]["object"]
    
    logger.info("stripe_webhook_received", event_type=event_type, event_id=event["id"])
    
    try:
        if event_type == "checkout.session.completed":
            await _handle_checkout_completed(db, data)
        
        elif event_type == "customer.subscription.created":
            await _handle_subscription_created(db, data)
        
        elif event_type == "customer.subscription.updated":
            await _handle_subscription_updated(db, data)
        
        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_deleted(db, data)
        
        elif event_type == "invoice.payment_succeeded":
            await _handle_invoice_payment_succeeded(db, data)
        
        elif event_type == "invoice.payment_failed":
            await _handle_invoice_payment_failed(db, data)
        
        else:
            logger.info("stripe_webhook_unhandled", event_type=event_type)
            return False
        
        return True
        
    except Exception as e:
        logger.error("stripe_webhook_error", event_type=event_type, error=str(e), exc_info=True)
        return False


async def _handle_checkout_completed(db: AsyncSession, session_data: Dict[str, Any]):
    """Handle checkout.session.completed event."""
    
    session_id = session_data["id"]
    customer_id = session_data.get("customer")
    subscription_id = session_data.get("subscription")
    
    metadata = session_data.get("metadata", {})
    user_id_str = metadata.get("user_id")
    plan_id = metadata.get("plan_id")
    
    if not user_id_str:
        logger.warning("checkout_completed_no_user_id", session_id=session_id)
        return
    
    user_id = uuid.UUID(user_id_str)
    
    # Update payment record
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id)
        .where(Payment.extra_data["checkout_session_id"].astext == session_id)
    )
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = "succeeded"
        payment.stripe_subscription_id = subscription_id
        payment.stripe_customer_id = customer_id
        await db.commit()

    # Update user subscription
    if subscription_id:
        await _update_user_subscription_from_stripe(db, subscription_id, user_id)
    else:
        # Fallback: update plan from metadata if no subscription_id yet
        if plan_id:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                user.plan = plan_id
                user.subscription_status = "active"
                if customer_id:
                    user.stripe_customer_id = customer_id
                await db.commit()
                await _add_subscription_credits(db, user, plan_id)

    logger.info(
        "checkout_completed",
        user_id=user_id_str,
        session_id=session_id,
        subscription_id=subscription_id,
    )


async def _handle_subscription_created(db: AsyncSession, subscription_data: Dict[str, Any]):
    """Handle customer.subscription.created event."""
    
    subscription_id = subscription_data["id"]
    customer_id = subscription_data["customer"]
    metadata = subscription_data.get("metadata", {})
    user_id_str = metadata.get("user_id")
    
    if not user_id_str:
        # Try to find user by customer_id
        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = result.scalar_one_or_none()
        if user:
            user_id = user.id
        else:
            logger.warning("subscription_created_no_user", subscription_id=subscription_id)
            return
    else:
        user_id = uuid.UUID(user_id_str)
    
    await _update_user_subscription_from_stripe(db, subscription_id, user_id)
    
    logger.info("subscription_created", user_id=str(user_id), subscription_id=subscription_id)


async def _handle_subscription_updated(db: AsyncSession, subscription_data: Dict[str, Any]):
    """Handle customer.subscription.updated event."""
    
    subscription_id = subscription_data["id"]
    customer_id = subscription_data["customer"]
    
    # Find user by customer_id
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning("subscription_updated_user_not_found", subscription_id=subscription_id)
        return
    
    await _update_user_subscription_from_stripe(db, subscription_id, user.id)
    
    logger.info("subscription_updated", user_id=str(user.id), subscription_id=subscription_id)


async def _handle_subscription_deleted(db: AsyncSession, subscription_data: Dict[str, Any]):
    """Handle customer.subscription.deleted event."""
    
    subscription_id = subscription_data["id"]
    customer_id = subscription_data["customer"]
    
    # Find user
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning("subscription_deleted_user_not_found", subscription_id=subscription_id)
        return
    
    # Downgrade to free tier
    user.plan = "free"
    user.subscription_status = "canceled"
    user.subscription_current_period_end = None
    user.subscription_cancel_at_period_end = False
    
    await db.commit()
    
    logger.info("subscription_deleted", user_id=str(user.id), subscription_id=subscription_id)


async def _handle_invoice_payment_succeeded(db: AsyncSession, invoice_data: Dict[str, Any]):
    """Handle invoice.payment_succeeded event."""
    
    customer_id = invoice_data.get("customer")
    subscription_id = invoice_data.get("subscription")
    amount_paid = invoice_data.get("amount_paid", 0) / 100.0  # Convert cents to currency units
    currency = invoice_data.get("currency", "usd").upper()
    
    if not subscription_id:
        return
    
    # Find user
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning("invoice_payment_succeeded_user_not_found", customer_id=customer_id)
        return
    
    # Create payment record
    payment = Payment(
        user_id=user.id,
        amount=amount_paid,
        currency=currency,
        status="succeeded",
        plan=user.plan,
        provider="stripe",
        stripe_customer_id=customer_id,
        stripe_subscription_id=subscription_id,
        extra_data={"invoice_id": invoice_data["id"]},
    )

    db.add(payment)
    await db.commit()

    # Add monthly credits for subscription renewal
    billing_reason = invoice_data.get("billing_reason", "")
    if billing_reason == "subscription_cycle":
        await db.refresh(user)
        await _add_subscription_credits(db, user, user.plan)

    logger.info(
        "invoice_payment_succeeded",
        user_id=str(user.id),
        amount=amount_paid,
        currency=currency,
        billing_reason=billing_reason,
    )


async def _handle_invoice_payment_failed(db: AsyncSession, invoice_data: Dict[str, Any]):
    """Handle invoice.payment_failed event."""
    
    customer_id = invoice_data.get("customer")
    subscription_id = invoice_data.get("subscription")
    
    # Find user
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning("invoice_payment_failed_user_not_found", customer_id=customer_id)
        return
    
    # Update subscription status
    user.subscription_status = "past_due"
    await db.commit()
    
    logger.warning(
        "invoice_payment_failed",
        user_id=str(user.id),
        subscription_id=subscription_id,
    )


async def _update_user_subscription_from_stripe(
    db: AsyncSession,
    subscription_id: str,
    user_id: uuid.UUID,
):
    """Update user subscription details from Stripe subscription object."""
    
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
    except stripe.error.StripeError as e:
        logger.error("stripe_subscription_retrieve_failed", subscription_id=subscription_id, error=str(e))
        return
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning("user_not_found", user_id=str(user_id))
        return
    
    # Extract plan from subscription metadata
    plan_id = subscription.metadata.get("plan_id", "pro")
    
    old_plan = user.plan

    # Update user
    user.plan = plan_id
    user.subscription_status = subscription.status
    user.subscription_current_period_end = datetime.fromtimestamp(
        subscription.current_period_end, tz=timezone.utc
    )
    user.subscription_cancel_at_period_end = subscription.cancel_at_period_end or False

    await db.commit()
    await db.refresh(user)

    # Add credits when subscription becomes active (new subscription or upgrade)
    if subscription.status == "active" and old_plan != plan_id:
        await _add_subscription_credits(db, user, plan_id)

    logger.info(
        "user_subscription_updated",
        user_id=str(user_id),
        plan=plan_id,
        status=subscription.status,
    )


async def _add_subscription_credits(db: AsyncSession, user: User, plan_id: str):
    """Add credits to user when subscription is activated."""
    credits_to_add = TIER_CREDITS.get(plan_id)
    if not credits_to_add:
        return

    user.credits = (user.credits or 0) + credits_to_add

    transaction = CreditTransaction(
        user_id=user.id,
        amount=credits_to_add,
        balance_after=user.credits,
        transaction_type="purchase",
        description=f"Subscription credits for {plan_id} plan",
        extra_data={"plan": plan_id},
    )
    db.add(transaction)
    await db.commit()

    logger.info(
        "subscription_credits_added",
        user_id=str(user.id),
        plan=plan_id,
        credits=credits_to_add,
        new_balance=user.credits,
    )


async def cancel_subscription(
    db: AsyncSession,
    user_id: uuid.UUID,
    immediate: bool = False,
) -> Dict[str, Any]:
    """
    Cancel user's Stripe subscription.
    
    Args:
        immediate: If True, cancel immediately. If False, cancel at period end.
    
    Returns:
        {
            "status": "canceled" | "active",
            "cancel_at_period_end": bool,
            "current_period_end": datetime
        }
    """
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise ValueError(f"User not found: {user_id}")
    
    if not user.stripe_customer_id:
        raise ValueError("User has no Stripe customer")
    
    # Find active subscription
    try:
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status="active",
            limit=1,
        )
        
        if not subscriptions.data:
            raise ValueError("No active subscription found")
        
        subscription = subscriptions.data[0]
        
        if immediate:
            # Cancel immediately
            canceled = stripe.Subscription.cancel(subscription.id)
            user.plan = "free"
            user.subscription_status = "canceled"
            user.subscription_current_period_end = None
            user.subscription_cancel_at_period_end = False
        else:
            # Cancel at period end
            updated = stripe.Subscription.modify(
                subscription.id,
                cancel_at_period_end=True,
            )
            user.subscription_cancel_at_period_end = True
            canceled = updated
        
        await db.commit()
        await db.refresh(user)
        
        logger.info(
            "subscription_canceled",
            user_id=str(user_id),
            immediate=immediate,
            subscription_id=subscription.id,
        )
        
        return {
            "status": canceled.status,
            "cancel_at_period_end": canceled.cancel_at_period_end,
            "current_period_end": datetime.fromtimestamp(canceled.current_period_end),
        }
        
    except stripe.error.StripeError as e:
        logger.error("subscription_cancel_failed", user_id=str(user_id), error=str(e))
        raise


async def create_billing_portal_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    return_url: str,
) -> str:
    """
    Create Stripe Customer Portal session.
    
    Returns:
        URL to redirect user to billing portal.
    """
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise ValueError(f"User not found: {user_id}")
    
    if not user.stripe_customer_id:
        raise ValueError("User has no Stripe customer")
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )
        
        logger.info("billing_portal_created", user_id=str(user_id))
        
        return session.url
        
    except stripe.error.StripeError as e:
        logger.error("billing_portal_failed", user_id=str(user_id), error=str(e))
        raise


async def get_subscription_status(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Get current user's subscription status.
    
    Returns:
        {
            "plan": "free" | "pro" | "enterprise",
            "status": "active" | "inactive" | "canceled" | "past_due",
            "current_period_end": datetime | None,
            "cancel_at_period_end": bool
        }
    """
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise ValueError(f"User not found: {user_id}")
    
    return {
        "plan": user.plan,
        "status": user.subscription_status,
        "current_period_end": user.subscription_current_period_end,
        "cancel_at_period_end": user.subscription_cancel_at_period_end,
    }
