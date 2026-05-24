"""Business logic for projects module."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from settings.config import settings
from core.validation import validate_config_against_schema
from api.src.credits.service import deduct_credits
from infrastructure.database.models.projects import Project, ProjectStatus
from api.src.projects.schemas import ProjectCreate, ProjectUpdate
from api.src.templates.service import get_template_by_id, increment_usage_count

logger = logging.getLogger(__name__)


async def create_project(
    user_id: UUID,
    data: ProjectCreate,
    db: AsyncSession,
) -> Project:
    """Create a new project.

    Args:
        user_id: Owner's user ID.
        data: Project creation data.
        db: Database session.

    Returns:
        Created project.

    Raises:
        HTTPException 404: If template not found.
        HTTPException 400: If config validation fails or invalid empty project.
    """
    # Handle empty project creation
    if data.allow_empty:
        if data.template_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty projects cannot have a template_id",
            )
        # Create empty project
        project = Project(
            user_id=user_id,
            name=data.name,
            description=data.description,
            template_id=None,
            allow_empty=True,
            config=data.config or {},
            status=ProjectStatus.DRAFT.value,
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        return project

    # Regular template-based project
    if data.template_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="template_id is required when allow_empty is False",
        )

    # Get and validate template
    template = await get_template_by_id(data.template_id, db)

    # Validate config against template schema
    validate_config_against_schema(data.config, template.config_schema)

    # Create project
    project = Project(
        user_id=user_id,
        name=data.name,
        description=data.description,
        template_id=data.template_id,
        allow_empty=False,
        config=data.config or {},
        status=ProjectStatus.DRAFT.value,
    )

    # If template has ready-made code — apply it immediately
    if template and template.code_template:
        project.generated_code = template.code_template
        project.status = ProjectStatus.READY.value
        project.generated_at = datetime.now(timezone.utc)
        logger.info(
            "Applied template code_template to project",
            extra={"slug": template.slug if hasattr(template, "slug") else str(template.id)},
        )

    db.add(project)
    await db.commit()
    await db.refresh(project)

    # Deduct credits when template code is applied (counts as a generation)
    if template and template.code_template:
        credit_cost = template.credit_cost if template.credit_cost else settings.GENERATION_COST
        try:
            await deduct_credits(
                user_id=user_id,
                amount=credit_cost,
                transaction_type="generation",
                project_id=project.id,
                description=f"Template code generation for project: {project.name}",
                db=db,
            )
            await db.commit()
            logger.info(
                "Credits deducted for template code generation",
                extra={
                    "user_id": str(user_id),
                    "project_id": str(project.id),
                    "cost": credit_cost,
                },
            )
        except HTTPException as credit_err:
            logger.warning(
                "Credit deduction failed for template project: %s",
                credit_err.detail,
                extra={"user_id": str(user_id), "project_id": str(project.id)},
            )
            raise

    # Increment template usage count
    await increment_usage_count(template.id, db)

    return project


async def get_project_by_id(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Project:
    """Get project by ID (owner only).

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        Project object.

    Raises:
        HTTPException 404: If project not found or not owned by user.
    """
    query = select(Project).where(
        Project.id == project_id,
        Project.user_id == user_id,
    )
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


async def list_user_projects(
    user_id: UUID,
    db: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    status_filter: ProjectStatus | None = None,
) -> tuple[list[Project], int]:
    """List user's projects with pagination.

    Args:
        user_id: Owner's user ID.
        db: Database session.
        page: Page number (1-indexed).
        per_page: Items per page.
        status_filter: Optional status filter.

    Returns:
        Tuple of (projects list, total count).
    """
    query = select(Project).where(Project.user_id == user_id)

    if status_filter:
        query = query.where(Project.status == status_filter.value)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginate
    query = query.order_by(Project.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    projects = list(result.scalars().all())

    return projects, total


async def update_project(
    project_id: UUID,
    user_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession,
) -> Project:
    """Update project fields.

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        data: Update data.
        db: Database session.

    Returns:
        Updated project.

    Raises:
        HTTPException 404: If project not found.
        HTTPException 400: If config validation fails.
    """
    project = await get_project_by_id(project_id, user_id, db)

    # If config is being updated, validate against template schema
    if data.config is not None:
        from infrastructure.database.models.templates import Template

        template_query = select(Template).where(Template.id == project.template_id)
        result = await db.execute(template_query)
        template = result.scalar_one_or_none()
        if template:
            validate_config_against_schema(data.config, template.config_schema)

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> None:
    """Delete a project.

    Before deleting, stops and cleans up any active deployments.

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        db: Database session.

    Raises:
        HTTPException 404: If project not found.
    """
    from sqlalchemy import select as sa_select
    from infrastructure.database.models.deploy import Deployment
    from api.src.deploy.service import DeploymentService

    project = await get_project_by_id(project_id, user_id, db)
    
    # Stop all deployments first
    deploy_svc = DeploymentService(db)
    result = await db.execute(
        sa_select(Deployment).where(Deployment.project_id == project_id)
    )
    deployments = result.scalars().all()
    for dep in deployments:
        try:
            await deploy_svc.stop_deployment(dep.id, user_id)
        except Exception as e:
            logger.warning("Failed to stop deployment on delete", error=str(e))
    
    await db.delete(project)
    await db.commit()


async def trigger_generation(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession,
    user_prompt: str | None = None,
) -> Project:
    """Trigger AI code generation for a project.

    Workflow:
    1. Validate project exists and status is draft/error
    2. Get template to determine credit cost
    3. Check user has sufficient credits
    4. Deduct credits atomically
    5. Set status to generating
    6. Call AI generation service (synchronous MVP)
    7. On error: refund credits, set error status

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        Updated project with status='generating' -> 'ready' or 'error'.

    Raises:
        HTTPException 404: If project not found or template not found.
        HTTPException 400: If project not in draft/error/ready status.
        HTTPException 422: If insufficient credits.
    """
    project = await get_project_by_id(project_id, user_id, db)

    # Allow generation from: draft, error (retry), ready (re-generation),
    # or generating (stuck task recovery — credits already deducted)
    allowed_statuses = (
        ProjectStatus.DRAFT.value,
        ProjectStatus.ERROR.value,
        ProjectStatus.READY.value,
        ProjectStatus.GENERATING.value,
    )
    if project.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generation can only be triggered for draft, error, ready, or generating projects",
        )

    # Track if we need to deduct credits (skip if already generating — credits were deducted)
    already_generating = project.status == ProjectStatus.GENERATING.value

    # Get template to determine credit cost (template is optional for free-text generation)
    from infrastructure.database.models.templates import Template

    template = None
    if project.template_id:
        template_query = select(Template).where(Template.id == project.template_id)
        result = await db.execute(template_query)
        template = result.scalar_one_or_none()

    # Deduct credits only if not already in generating state
    # (generating = credits were already deducted, this is a retry of stuck task)
    if not already_generating:
        # Use template credit cost if available, otherwise default generation cost
        generation_cost = template.credit_cost if (template and template.credit_cost is not None and template.credit_cost > 0) else settings.GENERATION_COST

        logger.info(
            "Deducting credits for generation",
            extra={
                "project_id": str(project_id),
                "user_id": str(user_id),
                "template_id": str(template.id) if template else None,
                "template_name": template.name if template else "free-text",
                "cost": generation_cost,
            },
        )

        if generation_cost > 0:
            await deduct_credits(
                user_id=user_id,
                amount=generation_cost,
                transaction_type="generation",
                project_id=project_id,
                description=f"AI code generation for project: {project.name}",
                db=db,
            )
    else:
        logger.info(
            "Retrying stuck generation (credits already deducted)",
            extra={
                "project_id": str(project_id),
                "user_id": str(user_id),
            },
        )

    # Set status to generating
    project.status = ProjectStatus.GENERATING.value
    project.error_message = None  # Clear previous error
    await db.commit()
    await db.refresh(project)

    # Dispatch Celery task for async generation with streaming progress.
    # The task publishes progress to Redis pub/sub, which is relayed
    # to the frontend via WebSocket in real-time.
    pass  # Generation handled by conversation WebSocket (ai_service.py)

    logger.info(
        "Generation task dispatched to Celery",
        extra={
            "project_id": str(project_id),
            "user_id": str(user_id),
        },
    )

    # Return immediately — project status is "generating",
    # actual generation happens in background via Celery worker.
    # Credit refunds on failure are handled by the Celery task.
    return project


async def get_public_project(
    project_id: UUID,
    db: AsyncSession,
) -> Project:
    """Get a public project (no auth required).

    Args:
        project_id: Project UUID.
        db: Database session.

    Returns:
        Project object.

    Raises:
        HTTPException 404: If project not found or not public.
    """
    query = select(Project).where(
        Project.id == project_id,
        Project.is_public == True,  # noqa: E712
    )
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project
