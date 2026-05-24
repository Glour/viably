"""Payment service — YooKassa integration logic."""

import logging
import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.payments import Payment
from settings.config import settings

logger = logging.getLogger(__name__)

# Plan prices mapping
PLAN_PRICES = {
    "starter": 990.0,
    "pro": 2490.0,
    "business": 7990.0,
}


async def create_payment(
    db: AsyncSession,
    user_id: uuid.UUID,
    plan_id: str,
    return_url: str,
) -> Payment:
    """Create a payment via YooKassa and store in DB."""
    if plan_id not in PLAN_PRICES:
        raise ValueError(f"Unknown plan: {plan_id}")

    amount = PLAN_PRICES[plan_id]
    payment = Payment(
        user_id=user_id,
        amount=amount,
        currency="RUB",
        status="pending",
        plan=plan_id,
    )

    # If YooKassa credentials are configured, create real payment
    if settings.YOOKASSA_SHOP_ID and settings.YOOKASSA_SECRET_KEY:
        try:
            from yookassa import Configuration, Payment as YKPayment

            Configuration.account_id = settings.YOOKASSA_SHOP_ID
            Configuration.secret_key = settings.YOOKASSA_SECRET_KEY

            yk_payment = YKPayment.create({
                "amount": {"value": str(amount), "currency": "RUB"},
                "confirmation": {
                    "type": "redirect",
                    "return_url": return_url,
                },
                "capture": True,
                "description": f"Подписка Viably {plan_id.capitalize()}",
                "metadata": {"user_id": str(user_id), "plan_id": plan_id},
            }, uuid.uuid4())

            payment.yookassa_id = yk_payment.id
            payment.yookassa_confirmation_url = yk_payment.confirmation.confirmation_url
            payment.status = yk_payment.status
        except Exception as e:
            logger.error("yookassa_create_error", error=str(e))
            raise
    else:
        # Stub mode — no real payment
        logger.warning("yookassa_not_configured", plan=plan_id)
        payment.yookassa_id = f"stub-{uuid.uuid4()}"
        payment.yookassa_confirmation_url = return_url

    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


async def process_webhook(db: AsyncSession, data: dict) -> Optional[Payment]:
    """Process YooKassa webhook notification."""
    obj = data.get("object", {})
    yookassa_id = obj.get("id")
    status = obj.get("status")

    if not yookassa_id or not status:
        logger.warning("webhook_missing_fields", data=data)
        return None

    result = await db.execute(
        select(Payment).where(Payment.yookassa_id == yookassa_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        logger.warning("webhook_payment_not_found", yookassa_id=yookassa_id)
        return None

    payment.status = status
    await db.commit()
    await db.refresh(payment)

    # If payment succeeded, update user plan
    if status == "succeeded":
        await _activate_plan(db, payment)

    return payment


async def _activate_plan(db: AsyncSession, payment: Payment):
    """Activate user's subscription plan after successful payment."""
    from infrastructure.database.models.auth import User

    result = await db.execute(select(User).where(User.id == payment.user_id))
    user = result.scalar_one_or_none()
    if user:
        user.plan = payment.plan
        await db.commit()
        logger.info("plan_activated", user_id=str(payment.user_id), plan=payment.plan)


async def get_payment_history(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Payment], int]:
    """Get payment history for a user."""
    # Count
    count_result = await db.execute(
        select(func.count()).select_from(Payment).where(Payment.user_id == user_id)
    )
    total = count_result.scalar() or 0

    # Items
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    payments = list(result.scalars().all())
    return payments, total
