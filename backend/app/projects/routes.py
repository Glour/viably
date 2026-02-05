"""FastAPI routes for projects module."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import User
from app.core.database import get_db
from app.projects.models import ProjectStatus
from app.projects.schemas import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.projects.service import (
    create_project,
    delete_project,
    get_project_by_id,
    get_public_project,
    list_user_projects,
    trigger_generation,
    update_project,
)

router = APIRouter()


@router.post("", response_model=ProjectDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    """Create a new project.

    Args:
        data: Project creation data (name, template_id, config).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Created project details.

    Raises:
        400: Template not found or config validation failed.
        401: Unauthorized.
    """
    project = await create_project(current_user.id, data, db)
    return ProjectDetailResponse.model_validate(project)


@router.get("", response_model=ProjectListResponse)
async def list_projects_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: ProjectStatus | None = Query(None, alias="status", description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectListResponse:
    """List user's projects with pagination.

    Args:
        page: Page number (1-indexed).
        per_page: Items per page (default 20, max 100).
        status_filter: Optional status filter.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Paginated list of projects.

    Raises:
        401: Unauthorized.
    """
    projects, total = await list_user_projects(
        current_user.id, db, page, per_page, status_filter
    )

    pages = (total + per_page - 1) // per_page if total > 0 else 0

    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.get("/public/{project_id}", response_model=ProjectResponse)
async def get_public_project_endpoint(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    """Get public project details (no auth required).

    Args:
        project_id: Project UUID.
        db: Database session.

    Returns:
        Project details (limited fields).

    Raises:
        404: Project not found or not public.
    """
    project = await get_public_project(project_id, db)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project_endpoint(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    """Get project details.

    Args:
        project_id: Project UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Full project details including generated code.

    Raises:
        401: Unauthorized.
        404: Project not found.
    """
    project = await get_project_by_id(project_id, current_user.id, db)
    return ProjectDetailResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectDetailResponse)
async def update_project_endpoint(
    project_id: UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    """Update project fields.

    Args:
        project_id: Project UUID.
        data: Fields to update.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Updated project details.

    Raises:
        400: Config validation failed.
        401: Unauthorized.
        404: Project not found.
    """
    project = await update_project(project_id, current_user.id, data, db)
    return ProjectDetailResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_endpoint(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a project.

    Args:
        project_id: Project UUID.
        current_user: Authenticated user.
        db: Database session.

    Raises:
        401: Unauthorized.
        404: Project not found.
    """
    await delete_project(project_id, current_user.id, db)


@router.post("/{project_id}/generate", response_model=ProjectDetailResponse)
async def trigger_generation_endpoint(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    """Trigger AI code generation for a project.

    Args:
        project_id: Project UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Project with status='generating'.

    Raises:
        400: Project not in draft status.
        401: Unauthorized.
        404: Project not found.
    """
    project = await trigger_generation(project_id, current_user.id, db)
    return ProjectDetailResponse.model_validate(project)
