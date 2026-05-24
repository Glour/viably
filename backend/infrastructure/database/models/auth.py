"""User database model for authentication."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from infrastructure.database.setup import Base


class User(Base):
    """User model representing a registered account."""

    __tablename__ = "users"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Profile
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String, nullable=True)

    # OAuth Integration
    oauth_provider = Column(String(20), nullable=True)  # 'google', 'github', or None
    github_access_token = Column(String(255), nullable=True)  # For GitHub API integration
    github_username = Column(String(100), nullable=True)  # Display name from GitHub

    # Plan & Credits
    plan = Column(String(20), default="free", nullable=False)
    # Current credit balance (source of truth)
    # NOTE: This is denormalized - CreditTransaction.balance_after stores snapshots
    # for transaction history display. User.credits is the authoritative current balance.
    credits = Column(Integer, default=5, nullable=False)

    # Stripe subscription fields
    stripe_customer_id = Column(String(255), nullable=True, unique=True, index=True)
    subscription_status = Column(String(20), nullable=False, server_default="inactive")
    subscription_current_period_end = Column(DateTime(timezone=True), nullable=True)
    subscription_cancel_at_period_end = Column(Boolean, default=False, nullable=False)

    # Referrals
    referral_code = Column(String(8), unique=True, nullable=False, index=True)
    referred_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    credit_transactions = relationship(
        "CreditTransaction",
        foreign_keys="CreditTransaction.user_id",
        back_populates="user",
        lazy="dynamic",
    )
    daily_bonuses = relationship(
        "DailyBonus",
        back_populates="user",
        lazy="dynamic",
    )
    projects = relationship(
        "Project",
        back_populates="user",
        lazy="dynamic",
    )
    conversations = relationship(
        "Conversation",
        back_populates="user",
        lazy="dynamic",
    )
    email_logs = relationship(
        "EmailLog",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
