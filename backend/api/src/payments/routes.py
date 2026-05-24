"""Payment API routes."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from api.src.payments.schemas import (
    PaymentCreateRequest,
    PaymentCreateResponse,
    PaymentHistoryItem,
    PaymentHistoryResponse,
    PaymentWebhookData,
)
from api.src.payments.service import create_payment, get_payment_history, process_webhook
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/create", response_model=PaymentCreateResponse)
async def create_payment_endpoint(
    body: PaymentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new payment for a subscription plan."""
    try:
        payment = await create_payment(
            db=db,
            user_id=current_user.id,
            plan_id=body.plan_id,
            return_url=body.return_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("payment_create_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Payment creation failed")

    return PaymentCreateResponse(
        payment_id=payment.id,
        confirmation_url=payment.yookassa_confirmation_url or "",
        status=payment.status,
    )


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle YooKassa webhook notifications (no auth required)."""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    payment = await process_webhook(db, data)
    if not payment:
        logger.warning("webhook_not_processed", data=data)

    # Always return 200 to YooKassa
    return {"status": "ok"}


@router.get("/history", response_model=PaymentHistoryResponse)
async def payment_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get payment history for the current user."""
    payments, total = await get_payment_history(
        db=db,
        user_id=current_user.id,
        limit=min(limit, 100),
        offset=offset,
    )
    return PaymentHistoryResponse(
        payments=[PaymentHistoryItem.model_validate(p) for p in payments],
        total=total,
    )
