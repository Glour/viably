"""User database model for authentication."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


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

    # Plan & Credits
    plan = Column(String(20), default="free", nullable=False)
    credits = Column(Integer, default=5, nullable=False)

    # Referrals
    referral_code = Column(String(8), unique=True, nullable=False, index=True)
    referred_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

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
