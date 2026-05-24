"""Repository for Project model."""

from typing import Optional, Sequence, Tuple
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.projects import Project
from infrastructure.database.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    """Repository for Project operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository.

        Args:
            db: Database session
        """
        super().__init__(db, Project)

    async def get_by_id_and_user(
        self,
        project_id: UUID,
        user_id: UUID,
    ) -> Optional[Project]:
        """Get project by ID and user (ensures ownership).

        Args:
            project_id: Project UUID
            user_id: User UUID

        Returns:
            Project or None if not found or doesn't belong to user
        """
        stmt = select(Project).where(
            Project.id == project_id,
            Project.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_user_projects(
        self,
        user_id: UUID,
        status_filter: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[Project], int]:
        """List user's projects with optional status filter and pagination.

        Args:
            user_id: User UUID
            status_filter: Optional filter by project status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (projects list, total count)
        """
        filters = [Project.user_id == user_id]

        if status_filter:
            filters.append(Project.status == status_filter)

        # Get projects
        projects = await self.list(
            filters=filters,
            order_by=desc(Project.created_at),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return projects, total

    async def count_user_projects(
        self,
        user_id: UUID,
        status_filter: Optional[str] = None,
    ) -> int:
        """Count user's projects with optional status filter.

        Args:
            user_id: User UUID
            status_filter: Optional filter by project status

        Returns:
            Count of matching projects
        """
        filters = [Project.user_id == user_id]

        if status_filter:
            filters.append(Project.status == status_filter)

        return await self.count(filters=filters)

    async def get_user_project_by_status(
        self,
        user_id: UUID,
        status: str,
    ) -> Optional[Project]:
        """Get first user's project with specific status.

        Args:
            user_id: User UUID
            status: Project status

        Returns:
            Project or None if not found
        """
        stmt = (
            select(Project)
            .where(
                Project.user_id == user_id,
                Project.status == status,
            )
            .order_by(desc(Project.created_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_status(
        self,
        project_id: UUID,
        status: str,
        **kwargs,
    ) -> Optional[Project]:
        """Update project status and optional additional fields.

        Args:
            project_id: Project UUID
            status: New status
            **kwargs: Additional fields to update (e.g., error_message, deployed_url)

        Returns:
            Updated project or None if not found
        """
        project = await self.get_by_id(project_id)
        if not project:
            return None

        project.status = status
        for key, value in kwargs.items():
            if hasattr(project, key):
                setattr(project, key, value)

        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def get_by_template(
        self,
        template_id: UUID,
        limit: Optional[int] = None,
    ) -> Sequence[Project]:
        """Get projects created from specific template.

        Args:
            template_id: Template UUID
            limit: Maximum number of results

        Returns:
            List of projects
        """
        filters = [Project.template_id == template_id]

        return await self.list(
            filters=filters,
            order_by=desc(Project.created_at),
            limit=limit,
        )

    async def get_public_projects(
        self,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> Tuple[Sequence[Project], int]:
        """Get public projects with pagination.

        Args:
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (projects list, total count)
        """
        filters = [Project.is_public == True]  # noqa: E712

        # Get projects
        projects = await self.list(
            filters=filters,
            order_by=desc(Project.created_at),
            limit=limit,
            offset=offset,
        )

        # Get total count
        total = await self.count(filters=filters)

        return projects, total

    async def get_deployed_projects(
        self,
        user_id: Optional[UUID] = None,
        limit: Optional[int] = None,
    ) -> Sequence[Project]:
        """Get deployed projects, optionally filtered by user.

        Args:
            user_id: Optional user UUID to filter by
            limit: Maximum number of results

        Returns:
            List of deployed projects
        """
        filters = [Project.status == "deployed"]

        if user_id:
            filters.append(Project.user_id == user_id)

        return await self.list(
            filters=filters,
            order_by=desc(Project.deployed_at),
            limit=limit,
        )
