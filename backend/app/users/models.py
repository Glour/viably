"""Database models for users module."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class CreditTransaction(Base):
    """Credit transaction model for tracking credit changes."""

    __tablename__ = "credit_transactions"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User reference
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Transaction details
    amount = Column(Integer, nullable=False)  # Positive for credit, negative for debit
    balance_after = Column(Integer, nullable=False)  # Denormalized for fast history display
    transaction_type = Column(String(20), nullable=False)  # generation, daily_bonus, purchase, referral, adjustment
    description = Column(String(255), nullable=True)

    # Optional project reference (for generation transactions)
    project_id = Column(UUID(as_uuid=True), nullable=True)  # FK added when projects table exists

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
