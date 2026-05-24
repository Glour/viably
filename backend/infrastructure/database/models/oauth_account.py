"""OAuth Account Pool model for Viably."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID

from infrastructure.database.setup import Base


class OAuthAccount(Base):
    """OAuth account for Claude API pool."""

    __tablename__ = "oauth_accounts"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)

    # OAuth tokens
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Rate limit tracking (from response headers)
    rate_limit_requests = Column(Integer, nullable=True)
    rate_limit_remaining = Column(Integer, nullable=True)
    rate_limit_reset = Column(DateTime(timezone=True), nullable=True)
    rate_limit_tokens = Column(Integer, nullable=True)
    rate_limit_remaining_tokens = Column(Integer, nullable=True)
    rate_limit_tokens_reset = Column(DateTime(timezone=True), nullable=True)

    # Stats
    requests_today = Column(Integer, default=0, nullable=False)
    requests_total = Column(Integer, default=0, nullable=False)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    last_error_at = Column(DateTime(timezone=True), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
