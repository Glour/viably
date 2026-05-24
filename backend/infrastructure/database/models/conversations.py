"""Conversation database models."""

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from infrastructure.database.setup import Base, JSONBType


class Conversation(Base):
    """Conversation model representing a chat session within a project."""

    __tablename__ = "conversations"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE", use_alter=True, name="fk_conversation_project"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Conversation info
    title = Column(String(255), nullable=True)

    # Metadata: {template_used: UUID | null, settings: {}}
    # Note: Using metadata_ with key='metadata' to avoid SQLAlchemy reserved name
    metadata_ = Column("metadata", JSONBType, nullable=False, default=dict, server_default='{}')

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    project = relationship(
        "Project",
        back_populates="conversations",
        foreign_keys=[project_id],
        overlaps="current_conversation",
    )
    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )
    artifacts = relationship(
        "Artifact",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_conversations_project_id", "project_id"),
        Index("idx_conversations_user_id", "user_id"),
        Index("idx_conversations_created_at", "created_at", postgresql_ops={"created_at": "DESC"}),
    )


class Message(Base):
    """Message model representing a single message in a conversation."""

    __tablename__ = "messages"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Message data
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    tokens_used = Column(Integer, nullable=False, default=0)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    artifacts = relationship(
        "Artifact",
        back_populates="message",
        cascade="all, delete-orphan",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_messages_conversation_id", "conversation_id"),
        Index("idx_messages_created_at", "created_at"),
    )


class Artifact(Base):
    """Artifact model representing a code artifact generated in a conversation."""

    __tablename__ = "artifacts"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    message_id = Column(
        UUID(as_uuid=True),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Artifact data
    type = Column(String(50), nullable=False)  # 'html', 'react', 'vue', 'python', etc.
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    language = Column(String(50), nullable=True)
    version = Column(Integer, nullable=False, default=1)

    # Versioning - reference to parent artifact for version history
    parent_artifact_id = Column(
        UUID(as_uuid=True),
        ForeignKey("artifacts.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    conversation = relationship("Conversation", back_populates="artifacts")
    message = relationship("Message", back_populates="artifacts")
    parent_artifact = relationship(
        "Artifact",
        remote_side=[id],
        backref="child_artifacts",
    )

    # Indexes for common queries
    __table_args__ = (
        Index("idx_artifacts_conversation_id", "conversation_id"),
        Index("idx_artifacts_message_id", "message_id"),
        Index("idx_artifacts_parent_id", "parent_artifact_id"),
        Index("idx_artifacts_created_at", "created_at", postgresql_ops={"created_at": "DESC"}),
    )
