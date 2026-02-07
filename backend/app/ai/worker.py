"""Celery worker for asynchronous AI generation tasks.

This module provides a Celery-based background worker for processing
AI code generation requests asynchronously. Users receive immediate
response while generation happens in background.

Usage:
    celery -A app.ai.worker worker --loglevel=info

Features:
    - Redis as broker and result backend
    - Automatic retry with exponential backoff for transient errors
    - Credit refund on permanent failures
    - Structured logging with task context
"""

import asyncio
import logging
from uuid import UUID

from celery import Celery
from anthropic import (
    APITimeoutError,
    RateLimitError,
    APIConnectionError,
    AuthenticationError,
    BadRequestError,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

# =============================================================================
# Celery App Configuration
# =============================================================================

celery_app = Celery(
    "ai_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Reliability settings
    task_acks_late=True,  # Acknowledge after task completes for reliability
    task_reject_on_worker_lost=True,  # Reject task if worker dies unexpectedly
    task_track_started=True,  # Track when task starts execution
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
)

# =============================================================================
# Exception Classification
# =============================================================================

# Retryable exceptions (temporary/transient failures)
RETRYABLE_EXCEPTIONS = (
    APITimeoutError,
    RateLimitError,
    APIConnectionError,
)

# Permanent exceptions (do not retry, refund credits)
PERMANENT_EXCEPTIONS = (
    AuthenticationError,
    BadRequestError,
    ValueError,
)


# =============================================================================
# Celery Tasks
# =============================================================================


@celery_app.task(
    name="process_generation",
    bind=True,
    autoretry_for=RETRYABLE_EXCEPTIONS,
    retry_backoff=True,
    retry_backoff_max=600,  # Maximum 10 minutes between retries
    max_retries=3,
    throws=PERMANENT_EXCEPTIONS,
)
def process_generation(self, project_id: str) -> dict:
    """Process AI code generation asynchronously.

    This task handles the complete AI code generation workflow for a project.
    It is designed to be queued and processed in the background, allowing
    the API to return immediately after accepting the generation request.

    Args:
        project_id: Project UUID as string.

    Returns:
        dict with generation result:
            - success: bool indicating successful generation
            - files_count: number of files generated
            - files: list of generated file names

    Raises:
        AuthenticationError: Invalid API credentials (permanent, not retried).
        BadRequestError: Invalid request to AI API (permanent, not retried).
        ValueError: Project/template not found or invalid state (permanent).
        APITimeoutError: Request timeout (will be retried).
        RateLimitError: Rate limit exceeded (will be retried with backoff).
        APIConnectionError: Connection failed (will be retried).

    Retry Behavior:
        - Retryable exceptions trigger automatic retry with exponential backoff
        - Maximum 3 retries with up to 10 minutes between attempts
        - Permanent exceptions are not retried and trigger credit refund
    """
    logger.info(
        "Starting async generation",
        extra={
            "project_id": project_id,
            "task_id": self.request.id,
            "retry_count": self.request.retries,
        },
    )

    try:
        # Run async code in sync Celery context
        result = asyncio.run(_process_generation_async(project_id))

        logger.info(
            "Async generation completed successfully",
            extra={
                "project_id": project_id,
                "task_id": self.request.id,
                "result": result,
            },
        )

        return result

    except PERMANENT_EXCEPTIONS as e:
        # Log permanent error - credits will be refunded in async handler
        logger.error(
            "Permanent generation error (not retrying)",
            extra={
                "project_id": project_id,
                "task_id": self.request.id,
                "error": str(e),
                "error_type": type(e).__name__,
            },
        )
        raise

    except RETRYABLE_EXCEPTIONS as e:
        # Log retry attempt - Celery will handle the retry automatically
        logger.warning(
            "Retryable error occurred, will retry",
            extra={
                "project_id": project_id,
                "task_id": self.request.id,
                "retry_count": self.request.retries,
                "max_retries": self.max_retries,
                "error": str(e),
                "error_type": type(e).__name__,
            },
        )
        raise

    except Exception as e:
        # Unexpected error - log and re-raise
        logger.error(
            "Unexpected error during generation",
            extra={
                "project_id": project_id,
                "task_id": self.request.id,
                "error": str(e),
                "error_type": type(e).__name__,
            },
        )
        raise


# =============================================================================
# Async Implementation
# =============================================================================


async def _process_generation_async(project_id: str) -> dict:
    """Async implementation of generation processing.

    This function is called from the sync Celery task and handles
    the actual async database and AI operations.

    Args:
        project_id: Project UUID as string.

    Returns:
        dict with generation result from AIGenerationService.

    Raises:
        Any exception from AIGenerationService.generate_project_code().
    """
    # Import here to avoid circular imports and ensure fresh imports
    from app.ai.service import AIGenerationService
    from app.credits.service import add_credits
    from app.projects.models import Project
    from app.core.database import async_session_maker
    from sqlalchemy import select

    async with async_session_maker() as db:
        try:
            # Run the generation service
            service = AIGenerationService(db)
            result = await service.generate_project_code(UUID(project_id))

            # Commit is handled by AIGenerationService, but ensure it's done
            await db.commit()

            return result

        except PERMANENT_EXCEPTIONS as e:
            # Permanent error - refund credits to user
            logger.error(
                "Permanent generation error, refunding credits",
                extra={
                    "project_id": project_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )

            # Get project to find user_id for refund
            stmt = select(Project).where(Project.id == UUID(project_id))
            db_result = await db.execute(stmt)
            project = db_result.scalar_one_or_none()

            if project:
                try:
                    await add_credits(
                        user_id=UUID(str(project.user_id)),
                        amount=settings.GENERATION_COST,
                        transaction_type="generation_refund",
                        description=f"Refund for failed generation of {project.name}",
                        db=db,
                    )
                    await db.commit()

                    logger.info(
                        "Credits refunded for failed generation",
                        extra={
                            "project_id": project_id,
                            "user_id": str(project.user_id),
                            "amount": settings.GENERATION_COST,
                        },
                    )
                except Exception as refund_error:
                    # Log refund failure but don't mask original error
                    logger.error(
                        "Failed to refund credits",
                        extra={
                            "project_id": project_id,
                            "user_id": str(project.user_id),
                            "error": str(refund_error),
                        },
                    )
                    await db.rollback()

            # Re-raise original exception for Celery to mark task as failed
            raise

        except Exception as e:
            # For retryable or unexpected exceptions, just re-raise
            # Credit refund happens only on permanent failures
            logger.error(
                "Generation error",
                extra={
                    "project_id": project_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            await db.rollback()
            raise
