"""Business logic for AI code generation module."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import get_anthropic_client
from app.ai.prompts import SYSTEM_PROMPT, build_generation_prompt, extract_code_files
from app.projects.models import Project, ProjectStatus
from app.templates.models import Template

logger = logging.getLogger(__name__)


class AIGenerationService:
    """Service for AI code generation workflow.

    Handles the complete generation flow including:
    - Fetching project and template data
    - Building prompts from templates
    - Calling AI API for code generation
    - Extracting and saving generated files
    - Managing project status transitions
    """

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the service with a database session.

        Args:
            db: Async database session for persistence operations.
        """
        self.db = db

    async def generate_project_code(self, project_id: UUID) -> dict:
        """Complete generation workflow for a project.

        Executes the full AI code generation pipeline:
        1. Get project and validate status (must be draft or error)
        2. Get template
        3. Build AI prompt from template + user config
        4. Call Anthropic API
        5. Extract code files from response
        6. Save to project.generated_code
        7. Update status -> ready

        On error:
        - Set status=error with error_message
        - Raise exception for caller to handle (credits are refunded in caller)

        Args:
            project_id: Project UUID to generate code for.

        Returns:
            dict with:
                - success: bool indicating successful generation
                - files_count: number of files generated
                - files: list of generated file names

        Raises:
            ValueError: If project/template not found or invalid status.
        """
        # Get project
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project {project_id} not found")

        # Validate status - only draft or error projects can be regenerated
        if project.status not in (ProjectStatus.DRAFT.value, ProjectStatus.ERROR.value):
            raise ValueError(
                f"Project status must be 'draft' or 'error' for generation, "
                f"got '{project.status}'"
            )

        try:
            # Get template
            result = await self.db.execute(
                select(Template).where(Template.id == project.template_id)
            )
            template = result.scalar_one_or_none()

            if not template:
                raise ValueError(f"Template {project.template_id} not found")

            # Build prompt from template and user config
            user_prompt = build_generation_prompt(
                template.prompt_template,
                project.config or {},
            )

            # Log generation start
            logger.info(
                "Starting code generation",
                extra={
                    "project_id": str(project_id),
                    "template_id": str(template.id),
                    "template_name": template.name,
                    "config_keys": list((project.config or {}).keys()),
                },
            )

            # Generate code via AI
            client = get_anthropic_client()
            response = await client.generate_code(
                prompt=user_prompt,
                system_prompt=SYSTEM_PROMPT,
            )

            # Extract files from AI response
            files = extract_code_files(response)

            if not files:
                raise ValueError("No code files extracted from AI response")

            # Save generated code to project
            project.generated_code = {"files": files}
            project.ai_model_used = client.default_model
            project.status = ProjectStatus.READY.value
            project.generated_at = datetime.now(timezone.utc)
            project.generation_logs = f"Generated {len(files)} files"
            project.error_message = None  # Clear any previous error

            await self.db.commit()

            # Log successful completion
            logger.info(
                "Code generation completed successfully",
                extra={
                    "project_id": str(project_id),
                    "files_count": len(files),
                    "files": list(files.keys()),
                    "model_used": client.default_model,
                },
            )

            return {
                "success": True,
                "files_count": len(files),
                "files": list(files.keys()),
            }

        except Exception as e:
            # Log error
            logger.error(
                "Code generation failed",
                extra={
                    "project_id": str(project_id),
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )

            # Update project with sanitized error status
            project.status = ProjectStatus.ERROR.value
            error_type = type(e).__name__
            safe_errors = {
                "AuthenticationError": "AI service authentication failed",
                "APITimeoutError": "AI service timed out",
                "RateLimitError": "AI service rate limit exceeded",
                "APIConnectionError": "AI service connection failed",
            }
            project.error_message = safe_errors.get(error_type, "Code generation failed")
            await self.db.commit()

            # Re-raise for caller to handle (e.g., credit refund)
            raise

    async def validate_project_for_generation(self, project_id: UUID) -> Project:
        """Validate that a project is ready for generation.

        This method provides standalone validation that can be called before
        generation to check prerequisites without initiating the generation
        process. It is used in tests and can be useful for pre-flight checks
        in API endpoints.

        Note: generate_project_code() performs its own inline validation,
        so this method is not strictly required for generation. It exists
        for cases where validation-only checks are needed.

        Checks:
        - Project exists
        - Project status is draft or error
        - Template exists and is active

        Args:
            project_id: Project UUID to validate.

        Returns:
            Project object if valid.

        Raises:
            ValueError: If validation fails.
        """
        # Get project
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError(f"Project {project_id} not found")

        if project.status not in (ProjectStatus.DRAFT.value, ProjectStatus.ERROR.value):
            raise ValueError(
                f"Project status must be 'draft' or 'error' for generation, "
                f"got '{project.status}'"
            )

        # Verify template exists
        result = await self.db.execute(
            select(Template).where(Template.id == project.template_id)
        )
        template = result.scalar_one_or_none()

        if not template:
            raise ValueError(f"Template {project.template_id} not found")

        if not template.is_active:
            raise ValueError(f"Template '{template.name}' is not active")

        logger.info(
            "Project validated for generation",
            extra={
                "project_id": str(project_id),
                "template_id": str(template.id),
            },
        )

        return project
