"""Repository for Deployment model."""

from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.deploy import Deployment
from infrastructure.database.models.projects import Project
from infrastructure.database.repositories.base import BaseRepository


class DeploymentRepository(BaseRepository[Deployment]):
    """Repository for Deployment operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository.

        Args:
            db: Database session
        """
        super().__init__(db, Deployment)

    async def get_by_project(
        self,
        project_id: UUID,
        limit: Optional[int] = None,
    ) -> Sequence[Deployment]:
        """Get all deployments for a project.

        Args:
            project_id: Project UUID
            limit: Maximum number of results

        Returns:
            List of deployments sorted by creation date (newest first)
        """
        filters = [Deployment.project_id == project_id]

        return await self.list(
            filters=filters,
            order_by=desc(Deployment.created_at),
            limit=limit,
        )

    async def get_latest_by_project(
        self,
        project_id: UUID,
    ) -> Optional[Deployment]:
        """Get the latest deployment for a project.

        Args:
            project_id: Project UUID

        Returns:
            Latest deployment or None if no deployments exist
        """
        stmt = (
            select(Deployment)
            .where(Deployment.project_id == project_id)
            .order_by(desc(Deployment.created_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_deployments(
        self,
        limit: Optional[int] = None,
    ) -> Sequence[Deployment]:
        """Get all active deployments across all projects.

        Args:
            limit: Maximum number of results

        Returns:
            List of active deployments
        """
        filters = [Deployment.status == "active"]

        return await self.list(
            filters=filters,
            order_by=desc(Deployment.deployed_at),
            limit=limit,
        )

    async def update_status(
        self,
        deployment_id: UUID,
        status: str,
        **kwargs,
    ) -> Optional[Deployment]:
        """Update deployment status and optional additional fields.

        Args:
            deployment_id: Deployment UUID
            status: New status
            **kwargs: Additional fields to update (e.g., error_message, url, logs)

        Returns:
            Updated deployment or None if not found
        """
        deployment = await self.get_by_id(deployment_id)
        if not deployment:
            return None

        deployment.status = status
        for key, value in kwargs.items():
            if hasattr(deployment, key):
                setattr(deployment, key, value)

        await self.db.flush()
        await self.db.refresh(deployment)
        return deployment

    async def get_by_external_id(
        self,
        external_id: str,
    ) -> Optional[Deployment]:
        """Get deployment by external platform ID.

        Args:
            external_id: External platform deployment ID (e.g., platform deployment ID)

        Returns:
            Deployment or None if not found
        """
        stmt = select(Deployment).where(Deployment.external_id == external_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_platform(
        self,
        platform: str,
        status: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Sequence[Deployment]:
        """Get deployments by platform with optional status filter.

        Args:
            platform: Deployment platform (e.g., 'render')
            status: Optional filter by deployment status
            limit: Maximum number of results

        Returns:
            List of deployments
        """
        filters = [Deployment.platform == platform]

        if status:
            filters.append(Deployment.status == status)

        return await self.list(
            filters=filters,
            order_by=desc(Deployment.created_at),
            limit=limit,
        )

    async def get_failed_deployments(
        self,
        project_id: Optional[UUID] = None,
        limit: Optional[int] = None,
    ) -> Sequence[Deployment]:
        """Get failed deployments, optionally filtered by project.

        Args:
            project_id: Optional project UUID to filter by
            limit: Maximum number of results

        Returns:
            List of failed deployments
        """
        filters = [Deployment.status == "failed"]

        if project_id:
            filters.append(Deployment.project_id == project_id)

        return await self.list(
            filters=filters,
            order_by=desc(Deployment.created_at),
            limit=limit,
        )

    async def count_active_by_project(
        self,
        project_id: UUID,
    ) -> int:
        """Count active deployments for a project.

        Args:
            project_id: Project UUID

        Returns:
            Count of active deployments
        """
        filters = [
            Deployment.project_id == project_id,
            Deployment.status == "active",
        ]

        return await self.count(filters=filters)

    async def count_active_by_user(
        self,
        user_id: UUID,
    ) -> int:
        """Count active deployments for a user across all projects.

        Args:
            user_id: User UUID

        Returns:
            Count of active deployments for this user
        """
        stmt = (
            select(func.count())
            .select_from(Deployment)
            .join(Project, Deployment.project_id == Project.id)
            .where(
                Project.user_id == user_id,
                Deployment.status == "active",
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0
