"""Database models for payments module."""

import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from infrastructure.database.setup import Base


class Payment(Base):
    """Payment record model."""

    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="RUB")
    status = Column(String(20), nullable=False, default="pending", index=True)
    plan = Column(String(20), nullable=False)
    yookassa_id = Column(String(255), nullable=True, unique=True, index=True)
    yookassa_confirmation_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Stripe fields (added via migration add_stripe_001)
    provider = Column(String(20), nullable=True, default="yookassa")
    stripe_payment_intent_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, index=True)
    stripe_customer_id = Column(String(255), nullable=True, index=True)
    extra_data = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", backref="payments")
