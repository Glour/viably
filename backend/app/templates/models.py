"""Template database model."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.sql import func

from app.core.database import Base


class Template(Base):
    """Template model for bot and API service templates."""

    __tablename__ = "templates"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Template info
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # telegram_bot, api_service

    # Pricing
    credit_cost = Column(Integer, nullable=False, default=0)

    # Configuration schema (JSON Schema format)
    config_schema = Column(JSONB, nullable=False, default=dict)

    # Code template and prompts
    code_template = Column(JSONB, nullable=True, default=dict)
    prompt_template = Column(Text, nullable=False)

    # Metadata
    preview_image_url = Column(Text, nullable=True)
    features = Column(ARRAY(Text), default=list)
    tags = Column(ARRAY(Text), default=list)

    # Stats
    usage_count = Column(Integer, default=0, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Ordering
    sort_order = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
