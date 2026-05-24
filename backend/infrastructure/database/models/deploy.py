"""Deployment database model."""

import uuid
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from infrastructure.database.setup import Base


class DeploymentStatus(str, Enum):
    """Deployment lifecycle status."""

    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    FAILED = "failed"
    STOPPED = "stopped"


class DeploymentPlatform(str, Enum):
    """Supported deployment platforms."""

    DOCKER = "docker"
    RENDER = "render"  # Placeholder for future Render.com integration


class Deployment(Base):
    """Deployment model representing a project deployment to external platform."""

    __tablename__ = "deployments"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key to project
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Platform info
    platform = Column(String(50), nullable=False, default=DeploymentPlatform.DOCKER.value)
    external_id = Column(String(255), nullable=True)  # Platform deployment ID

    # Status
    status = Column(String(20), nullable=False, default=DeploymentStatus.PENDING.value)

    # URLs
    url = Column(Text, nullable=True)  # Public bot/site URL
    build_url = Column(Text, nullable=True)  # Platform build logs URL
    admin_url = Column(Text, nullable=True)  # Platform admin panel URL
    custom_domain = Column(Text, nullable=True)  # User-provided custom domain

    # Logs and errors
    logs = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Platform-specific metadata
    platform_data = Column(JSON, nullable=True, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="deployments")

    # Indexes for common queries
    __table_args__ = (
        Index("deployments_project_id_idx", "project_id"),
        Index("deployments_status_idx", "status"),
        Index("deployments_created_at_idx", created_at.desc()),
    )
