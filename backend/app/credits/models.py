"""Database models for credits module."""

import uuid
from datetime import date

from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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
    transaction_type = Column(String(20), nullable=False, index=True)
    # Types: signup, daily_bonus, referral_bonus, purchase, refund, generation, rollover, admin_adjustment
    description = Column(String(255), nullable=True)

    # Optional project reference (for generation transactions)
    project_id = Column(UUID(as_uuid=True), nullable=True)  # FK added when projects table exists

    # Related user (for referral_bonus transactions)
    related_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Extra data for additional context
    extra_data = Column(JSON, default=dict)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="credit_transactions")
    related_user = relationship("User", foreign_keys=[related_user_id])


class DailyBonus(Base):
    """Daily bonus tracking - one bonus per user per day."""

    __tablename__ = "daily_bonuses"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User reference
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Bonus details
    credits_awarded = Column(Integer, nullable=False)
    bonus_date = Column(Date, nullable=False, index=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint: one bonus per user per day
    __table_args__ = (
        UniqueConstraint("user_id", "bonus_date", name="unique_daily_bonus"),
    )

    # Relationships
    user = relationship("User", back_populates="daily_bonuses")
