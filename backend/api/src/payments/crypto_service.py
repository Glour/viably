"""NowPayments crypto integration service for Viably."""

import uuid
import hmac
import hashlib
import json
from typing import Optional

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.payments import Payment
from infrastructure.database.models.auth import User
from settings.config import settings

logger = structlog.get_logger(__name__)

# Plan prices in USD
PLAN_PRICES = {
    "starter/month": 15.00,
    "starter/year": 144.00,
    "pro/month": 39.00,
    "pro/year": 396.00,
    "business/month": 149.00,
    "business/year": 1440.00,
}


async def create_crypto_invoice(
    db: AsyncSession,
    user_id: uuid.UUID,
    plan_id: str,
    interval: str,
    return_url: str,
) -> Payment:
    """Create a crypto payment invoice via NowPayments."""
    
    plan_key = f"{plan_id}/{interval}"
    if plan_key not in PLAN_PRICES:
        raise ValueError(f"Unknown plan: {plan_key}")

    amount = PLAN_PRICES[plan_key]
    
    # Create payment record first
    payment = Payment(
        user_id=user_id,
        amount=amount,
        currency="USD",
        status="pending",
        plan=plan_id,
        provider="crypto",
        extra_data={},
    )
    
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    
    # Create NowPayments invoice if API key configured
    if settings.NOWPAYMENTS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.nowpayments.io/v1/invoice",
                    headers={
                        "x-api-key": settings.NOWPAYMENTS_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "price_amount": amount,
                        "price_currency": "usd",
                        "order_id": str(payment.id),
                        "order_description": f"Viably {plan_id.capitalize()} - {interval}",
                        "ipn_callback_url": "https://viably.dev/api/crypto/webhook",
                        "success_url": return_url,
                        "cancel_url": return_url,
                    },
                )
                response.raise_for_status()
                data = response.json()
                
                # Store invoice data
                payment.crypto_payment_id = str(data.get("id"))
                payment.extra_data = {
                    "invoice_url": data.get("invoice_url"),
                    "payment_status": data.get("payment_status"),
                }
                
                await db.commit()
                await db.refresh(payment)
                
                logger.info(
                    "crypto_invoice_created",
                    payment_id=str(payment.id),
                    invoice_id=payment.crypto_payment_id,
                )
                
        except httpx.HTTPError as e:
            logger.error("nowpayments_create_error", error=str(e))
            raise
    else:
        # Stub mode
        logger.warning("nowpayments_not_configured", plan=plan_key)
        payment.crypto_payment_id = f"stub-{uuid.uuid4()}"
        payment.extra_data = {"invoice_url": return_url}
        await db.commit()
        await db.refresh(payment)
    
    return payment


async def process_crypto_webhook(
    db: AsyncSession,
    data: dict,
    x_nowpayments_sig: Optional[str],
) -> Optional[Payment]:
    """Process NowPayments IPN webhook notification."""
    
    # Verify signature if secret is configured
    if settings.NOWPAYMENTS_IPN_SECRET and x_nowpayments_sig:
        # Sort JSON keys for signature verification
        sorted_data = json.dumps(data, sort_keys=True, separators=(',', ':'))
        expected_sig = hmac.new(
            settings.NOWPAYMENTS_IPN_SECRET.encode('utf-8'),
            sorted_data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
        
        if not hmac.compare_digest(expected_sig, x_nowpayments_sig):
            logger.warning("crypto_webhook_invalid_signature")
            return None
    
    # Extract order_id (which is our payment.id)
    order_id = data.get("order_id")
    payment_status = data.get("payment_status")
    
    if not order_id or not payment_status:
        logger.warning("crypto_webhook_missing_fields", data=data)
        return None
    
    # Find payment by crypto_payment_id or id
    try:
        payment_uuid = uuid.UUID(order_id)
    except (ValueError, TypeError):
        logger.warning("crypto_webhook_invalid_order_id", order_id=order_id)
        return None
    
    result = await db.execute(
        select(Payment).where(Payment.id == payment_uuid)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        logger.warning("crypto_webhook_payment_not_found", order_id=order_id)
        return None
    
    # Map NowPayments status to our status
    old_status = payment.status
    if payment_status in ["finished", "confirmed", "sending"]:
        payment.status = "succeeded"
    elif payment_status in ["failed", "expired", "refunded"]:
        payment.status = "failed"
    else:
        payment.status = payment_status
    
    # Update extra_data with webhook data
    if not payment.extra_data:
        payment.extra_data = {}
    payment.extra_data["last_webhook"] = data
    
    await db.commit()
    await db.refresh(payment)
    
    logger.info(
        "crypto_webhook_processed",
        payment_id=str(payment.id),
        old_status=old_status,
        new_status=payment.status,
    )
    
    # Activate plan if payment succeeded
    if payment.status == "succeeded" and old_status != "succeeded":
        await _activate_crypto_plan(db, payment)
    
    return payment


async def _activate_crypto_plan(db: AsyncSession, payment: Payment):
    """Activate user's subscription plan after successful crypto payment."""
    
    result = await db.execute(select(User).where(User.id == payment.user_id))
    user = result.scalar_one_or_none()
    
    if user:
        user.plan = payment.plan
        user.subscription_status = "active"
        await db.commit()
        
        logger.info(
            "crypto_plan_activated",
            user_id=str(payment.user_id),
            plan=payment.plan,
        )
