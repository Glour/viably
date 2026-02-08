"""Database models for email logging."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class EmailLog(Base):
    """Email log model for tracking sent emails."""

    __tablename__ = "email_logs"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User reference
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Email details
    email_type = Column(
        String(50), nullable=False, index=True
    )  # welcome, generation_complete, deploy_success, low_credits
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    template_variables = Column(JSONB, nullable=True)

    # Status tracking
    status = Column(
        String(20), nullable=False, default="pending", index=True
    )  # pending, sent, failed
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="email_logs")
