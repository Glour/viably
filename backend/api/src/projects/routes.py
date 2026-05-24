"""FastAPI routes for projects module."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db
from infrastructure.database.models.projects import Project, ProjectStatus
from api.src.projects.schemas import (
    GenerateRequest,
    ProjectCodeFile,
    ProjectCodeResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from infrastructure.database.models.deploy import Deployment
from api.src.deploy.schemas import (
    DeploymentCreate,
    DeploymentLogsResponse,
    DeploymentResponse,
    DeploymentStatus,
)
from api.src.deploy.tasks import process_deployment
from api.src.deploy.service import DeploymentService
from api.src.projects.service import (
    create_project,
    delete_project,
    get_project_by_id,
    get_public_project,
    list_user_projects,
    trigger_generation,
    update_project,
)

router = APIRouter()


@router.post(
    "",
    response_model=ProjectDetailResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
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


@router.get(
    "",
    response_model=ProjectListResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def list_projects_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: ProjectStatus | None = Query(
        None, alias="status", description="Filter by status",
    ),
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


@router.get(
    "/public/{project_id}",
    response_model=ProjectResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
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


@router.get(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
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


@router.patch(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
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


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
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


@router.post(
    "/{project_id}/generate",
    response_model=ProjectDetailResponse,
    dependencies=[Depends(RateLimiter(times=3, minutes=1))],
)
async def trigger_generation_endpoint(
    project_id: UUID,
    body: GenerateRequest | None = Body(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    """Trigger AI code generation for a project.

    Args:
        project_id: Project UUID.
        body: Optional generation request with user_prompt.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Project with status='generating'.

    Raises:
        400: Project not in draft status.
        401: Unauthorized.
        404: Project not found.
    """
    user_prompt = body.user_prompt if body else None
    project = await trigger_generation(project_id, current_user.id, db, user_prompt=user_prompt)
    return ProjectDetailResponse.model_validate(project)


@router.post(
    "/{project_id}/deploy",
    response_model=DeploymentResponse,
    dependencies=[Depends(RateLimiter(times=3, minutes=1))],
)
async def deploy_project_endpoint(
    project_id: UUID,
    data: DeploymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Deploy a project as Docker container (async via Celery).

    Args:
        project_id: Project UUID.
        data: Deployment configuration (platform, env_variables).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Deployment record with status='pending'.

    Raises:
        400: Project not in ready status or missing generated_code.
        401: Unauthorized.
        404: Project not found.
    """
    from sqlalchemy import select

    from api.src.deploy.schemas import DeploymentStatus
    from infrastructure.database.models.projects import ProjectStatus

    # Validate project exists and has required status
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    deployable_statuses = (
        ProjectStatus.READY.value,
        ProjectStatus.DEPLOYED.value,
        ProjectStatus.ERROR.value,
    )
    if project.status not in deployable_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project must be in 'ready', 'deployed', or 'error' status to deploy, got '{project.status}'",
        )

    if not project.generated_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No generated code to deploy",
        )

    # Create deployment record with status=pending
    deployment = Deployment(
        project_id=project_id,
        platform=data.platform.value,
        status=DeploymentStatus.PENDING.value,
    )
    db.add(deployment)
    await db.commit()
    await db.refresh(deployment)

    # Dispatch Celery task for async deployment
    process_deployment.delay(
        str(project_id),
        str(current_user.id),
        data.env_variables,
    )

    # Return deployment immediately (don't wait for completion)
    return DeploymentResponse.model_validate(deployment)


@router.get(
    "/{project_id}/code",
    response_model=ProjectCodeResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_project_code_endpoint(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectCodeResponse:
    """Get generated code files for a project.

    Args:
        project_id: Project UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Generated code files with paths, content, and language detection.

    Raises:
        401: Unauthorized.
        404: Project not found or no generated code available.
    """
    project = await get_project_by_id(project_id, current_user.id, db)

    if not project.generated_code or "files" not in project.generated_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project has no generated code yet",
        )

    # Map file extension to language for syntax highlighting
    extension_to_language = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".jsx": "javascript",
        ".tsx": "typescript",
        ".json": "json",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".md": "markdown",
        ".txt": "plaintext",
        ".sh": "bash",
        ".dockerfile": "dockerfile",
        ".env": "plaintext",
        ".toml": "toml",
        ".ini": "ini",
        ".xml": "xml",
        ".html": "html",
        ".css": "css",
    }

    files = []
    for path, content in project.generated_code["files"].items():
        # Detect language from file extension
        language = "plaintext"
        for ext, lang in extension_to_language.items():
            if path.lower().endswith(ext):
                language = lang
                break

        files.append(
            ProjectCodeFile(
                path=path,
                content=content,
                language=language,
            )
        )

    return ProjectCodeResponse(files=files)


@router.get(
    "/{project_id}/download",
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def download_project_endpoint(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download project code as ZIP file.

    Args:
        project_id: Project UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        ZIP file containing all generated code files.

    Raises:
        401: Unauthorized.
        404: Project not found or no generated code available.
    """
    import io
    import zipfile
    import urllib.parse

    from fastapi.responses import StreamingResponse

    project = await get_project_by_id(project_id, current_user.id, db)

    if not project.generated_code or "files" not in project.generated_code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project has no generated code yet",
        )

    # Create ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_path, content in project.generated_code["files"].items():
            zip_file.writestr(file_path, content)

    zip_buffer.seek(0)

    # Build safe Content-Disposition header (handles Cyrillic / emoji names)
    safe_ascii = ''.join(
        c for c in project.name
        if c.isascii() and c.isprintable() and c not in '\\/":<>|?*'
    ).strip() or "project"
    encoded_name = urllib.parse.quote(project.name, safe="")

    # Return as streaming response
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f"attachment; filename=\"{safe_ascii}.zip\"; "
                f"filename*=UTF-8''{encoded_name}.zip"
            )
        },
    )


@router.get(
    "/{project_id}/conversations",
    dependencies=[Depends(RateLimiter(times=60, minutes=1))],
)
async def list_project_conversations_endpoint(
    project_id: UUID,
    limit: int = Query(50, ge=1, le=100, description="Maximum items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations for a project.

    Args:
        project_id: Project UUID.
        limit: Maximum items to return (default 50, max 100).
        offset: Number of items to skip (default 0).
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Paginated list of conversations.

    Raises:
        401: Unauthorized.
        403: User doesn't own the project.
        404: Project not found.
    """
    # Local import to avoid circular dependency
    from api.src.conversations.schemas import (
        ConversationListResponse,
        ConversationResponse,
    )
    from api.src.conversations.service import list_project_conversations

    conversations, total = await list_project_conversations(
        project_id, current_user.id, db, limit, offset
    )

    return ConversationListResponse(
        items=[ConversationResponse.model_validate(c) for c in conversations],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{project_id}/deployments/{deployment_id}",
    response_model=DeploymentResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_deployment_status_endpoint(
    project_id: UUID,
    deployment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Get deployment status.

    Args:
        project_id: Project UUID.
        deployment_id: Deployment UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Deployment details including status and URL.

    Raises:
        401: Unauthorized.
        404: Deployment not found or doesn't belong to project.
    """
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    if deployment.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found for this project",
        )

    return DeploymentResponse.model_validate(deployment)


@router.post(
    "/{project_id}/deployments/{deployment_id}/stop",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def stop_deployment_endpoint(
    project_id: UUID,
    deployment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Stop and delete a deployment.

    Args:
        project_id: Project UUID.
        deployment_id: Deployment UUID.
        current_user: Authenticated user.
        db: Database session.

    Raises:
        401: Unauthorized.
        404: Deployment not found or doesn't belong to project.
    """
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    if deployment.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found for this project",
        )

    stopped = await service.stop_deployment(deployment_id, current_user.id)

    if not stopped:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop deployment",
        )


@router.get(
    "/{project_id}/deployments/{deployment_id}/logs",
    response_model=DeploymentLogsResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_deployment_logs_endpoint(
    project_id: UUID,
    deployment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentLogsResponse:
    """Get deployment logs.

    Args:
        project_id: Project UUID.
        deployment_id: Deployment UUID.
        current_user: Authenticated user.
        db: Database session.

    Returns:
        Deployment logs and status.

    Raises:
        401: Unauthorized.
        404: Deployment not found or doesn't belong to project.
    """
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    if deployment.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found for this project",
        )

    logs = await service.get_deployment_logs(deployment_id, current_user.id)

    return DeploymentLogsResponse(
        deployment_id=deployment_id,
        logs=logs,
        status=deployment.status,
    )
