"""Crypto payment API routes (NowPayments)."""

from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from api.src.payments.crypto_service import create_crypto_invoice, process_crypto_webhook
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db

logger = structlog.get_logger(__name__)
router = APIRouter()


class CreateInvoiceRequest(BaseModel):
    """Request body for creating crypto invoice."""
    plan_id: str
    interval: str = "month"
    return_url: str


class CreateInvoiceResponse(BaseModel):
    """Response for crypto invoice creation."""
    payment_id: str
    invoice_url: str
    status: str


@router.post("/create-invoice", response_model=CreateInvoiceResponse)
async def create_invoice_endpoint(
    body: CreateInvoiceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new crypto payment invoice."""
    
    if body.interval not in ["month", "year"]:
        raise HTTPException(status_code=400, detail="Invalid interval. Must be 'month' or 'year'")
    
    try:
        payment = await create_crypto_invoice(
            db=db,
            user_id=current_user.id,
            plan_id=body.plan_id,
            interval=body.interval,
            return_url=body.return_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("crypto_invoice_create_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Crypto invoice creation failed")
    
    invoice_url = payment.extra_data.get("invoice_url", "") if payment.extra_data else ""
    
    return CreateInvoiceResponse(
        payment_id=str(payment.id),
        invoice_url=invoice_url,
        status=payment.status,
    )


@router.post("/webhook")
async def crypto_webhook_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_nowpayments_sig: Optional[str] = Header(None),
):
    """Handle NowPayments IPN webhook notifications (no auth required)."""
    
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    payment = await process_crypto_webhook(db, data, x_nowpayments_sig)
    
    if not payment:
        logger.warning("crypto_webhook_not_processed", data=data)
    
    # Always return 200 to NowPayments
    return {"status": "ok"}
