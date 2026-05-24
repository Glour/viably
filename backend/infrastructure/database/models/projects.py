"""Project database model."""

import uuid
from enum import Enum

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from infrastructure.database.setup import Base


class ProjectStatus(str, Enum):
    """Project lifecycle status."""

    DRAFT = "draft"
    GENERATING = "generating"
    READY = "ready"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    ERROR = "error"


class Project(Base):
    """Project model representing a user's bot or API project."""

    __tablename__ = "projects"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Owner
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Project info
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    template_id = Column(
        UUID(as_uuid=True),
        ForeignKey("templates.id", ondelete="RESTRICT"),
        nullable=True,  # Allow null for empty projects
    )

    # Empty project support
    allow_empty = Column(Boolean, nullable=False, default=False)

    # Current active conversation
    current_conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Configuration (user inputs matching template.config_schema)
    # Using JSON type which maps to JSONB in PostgreSQL, JSON in SQLite
    config = Column(JSON, nullable=True, default=dict)

    # Generated code: {"files": {"path": "content"}, "entry_point": "...", "runtime": "..."}
    generated_code = Column(JSON, nullable=True)

    # Generation metadata
    generation_logs = Column(Text, nullable=True)
    ai_model_used = Column(String(50), nullable=True)

    # Status
    status = Column(String(20), nullable=False, default=ProjectStatus.DRAFT.value)
    error_message = Column(Text, nullable=True)

    # Deployment info
    deployed_url = Column(Text, nullable=True)
    deploy_platform = Column(String(50), nullable=True)

    # Visibility
    is_public = Column(Boolean, nullable=False, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    generated_at = Column(DateTime(timezone=True), nullable=True)
    deployed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="projects")
    template = relationship("Template")
    deployments = relationship(
        "Deployment", back_populates="project", cascade="all, delete-orphan"
    )
    conversations = relationship(
        "Conversation",
        back_populates="project",
        cascade="all, delete-orphan",
        foreign_keys="[Conversation.project_id]",
        overlaps="current_conversation",
    )
    current_conversation = relationship(
        "Conversation",
        foreign_keys=[current_conversation_id],
        post_update=True,
        overlaps="conversations",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("projects_user_id_idx", "user_id"),
        Index("projects_status_idx", "status"),
        Index("projects_template_id_idx", "template_id"),
        Index("projects_created_at_idx", created_at.desc()),
    )
