"""Business logic for projects module."""

import logging
from datetime import datetime, timezone
from uuid import UUID

import jsonschema
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.credits.service import add_credits, deduct_credits
from app.projects.models import Project, ProjectStatus
from app.projects.schemas import ProjectCreate, ProjectUpdate
from app.templates.service import get_template_by_id, increment_usage_count

logger = logging.getLogger(__name__)


def validate_config_against_schema(config: dict | None, schema: dict) -> None:
    """Validate project config against template's JSON schema.

    Args:
        config: User-provided configuration.
        schema: Template's config_schema (JSON Schema format).

    Raises:
        HTTPException 400: If config doesn't match schema.
    """
    if config is None:
        config = {}

    try:
        jsonschema.validate(instance=config, schema=schema)
    except jsonschema.ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Config validation failed: {e.message}",
        )


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
        HTTPException 400: If config validation fails.
    """
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
        config=data.config or {},
        status=ProjectStatus.DRAFT.value,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

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
        from app.templates.models import Template

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

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        db: Database session.

    Raises:
        HTTPException 404: If project not found.
    """
    project = await get_project_by_id(project_id, user_id, db)
    await db.delete(project)
    await db.commit()


async def trigger_generation(
    project_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Project:
    """Trigger AI code generation for a project.

    Workflow:
    1. Validate project exists and status is draft/error
    2. Check user has sufficient credits
    3. Deduct credits atomically
    4. Set status to generating
    5. Call AI generation service (synchronous MVP)
    6. On error: refund credits, set error status

    Args:
        project_id: Project UUID.
        user_id: Owner's user ID.
        db: Database session.

    Returns:
        Updated project with status='generating' -> 'ready' or 'error'.

    Raises:
        HTTPException 404: If project not found.
        HTTPException 400: If project not in draft/error status.
        HTTPException 422: If insufficient credits.
    """
    project = await get_project_by_id(project_id, user_id, db)

    # Allow generation from draft or error status (retry)
    if project.status not in (ProjectStatus.DRAFT.value, ProjectStatus.ERROR.value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Generation can only be triggered for draft or error projects",
        )

    generation_cost = settings.GENERATION_COST

    # Deduct credits atomically (raises HTTPException 422 if insufficient)
    logger.info(
        "Deducting credits for generation",
        extra={
            "project_id": str(project_id),
            "user_id": str(user_id),
            "cost": generation_cost,
        },
    )

    await deduct_credits(
        user_id=user_id,
        amount=generation_cost,
        transaction_type="generation",
        project_id=project_id,
        description=f"AI code generation for project: {project.name}",
        db=db,
    )

    # Set status to generating
    project.status = ProjectStatus.GENERATING.value
    project.error_message = None  # Clear previous error
    await db.commit()
    await db.refresh(project)

    # Import here to avoid circular import
    from app.ai.service import AIGenerationService

    try:
        # Synchronous generation (MVP) - will be async via Celery later
        ai_service = AIGenerationService(db)
        await ai_service.generate_project_code(project_id)

        # Refresh to get updated status
        await db.refresh(project)

        logger.info(
            "Generation completed successfully",
            extra={
                "project_id": str(project_id),
                "status": project.status,
            },
        )

    except Exception as e:
        # Refund credits on failure
        logger.error(
            "Generation failed, refunding credits",
            extra={
                "project_id": str(project_id),
                "error": str(e),
            },
        )

        await add_credits(
            user_id=user_id,
            amount=generation_cost,
            transaction_type="generation_refund",
            description=f"Refund for failed generation: {project.name}",
            db=db,
        )

        # Re-raise the exception for proper error response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}",
        )

    return project


async def save_generated_code(
    project_id: UUID,
    code_files: dict,
    ai_model: str,
    db: AsyncSession,
) -> None:
    """Save generated code to project (called by AI module).

    Args:
        project_id: Project UUID.
        code_files: Generated code files dict.
        ai_model: AI model used for generation.
        db: Database session.
    """
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if project and project.status == ProjectStatus.GENERATING.value:
        project.generated_code = code_files
        project.ai_model_used = ai_model
        project.status = ProjectStatus.READY.value
        project.generated_at = datetime.now(timezone.utc)
        await db.commit()


async def set_error(
    project_id: UUID,
    error_message: str,
    db: AsyncSession,
) -> None:
    """Set project to error status (called by AI/Deploy modules).

    Args:
        project_id: Project UUID.
        error_message: Error description.
        db: Database session.
    """
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if project:
        project.status = ProjectStatus.ERROR.value
        project.error_message = error_message
        await db.commit()


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
