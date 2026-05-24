"""Unified Celery application for all async tasks.

This module provides a single Celery app instance that handles AI generation,
deployment, and email tasks. This prevents task registration issues that occur
when multiple Celery apps are used.

Usage:
    celery -A app.celery_app worker --loglevel=info

The worker will automatically discover and register all tasks from:
    - app.deploy.tasks (process_deployment)
    - app.celery_tasks.email_tasks (email tasks)
"""

from celery import Celery

from settings.config import settings

# =============================================================================
# Unified Celery App Configuration
# =============================================================================

celery_app = Celery(
    "viably",
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
    # Task discovery
    imports=[
        "api.src.deploy.tasks",  # Deployment tasks
        "api.celery_tasks.email_tasks",  # Email tasks
    ],
)

# Celery Beat Schedule for Periodic Tasks
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    # Check for low credits daily at 10 AM UTC
    "check-low-credits-daily": {
        "task": "check_low_credits",
        "schedule": crontab(hour=10, minute=0),
        "options": {"expires": 3600},  # Task expires after 1 hour if not executed
    },
    # Retry failed emails every hour
    "retry-failed-emails-hourly": {
        "task": "retry_failed_emails",
        "schedule": crontab(minute=0),  # Every hour at :00
        "options": {"expires": 1800},  # Task expires after 30 minutes
    },
}


# Register models for SQLAlchemy relationship resolution
# This must be done AFTER celery_app is created to avoid circular imports
def _register_models():
    """Import all models to populate SQLAlchemy relationship registry.

    This prevents "KeyError: 'User'" errors in Celery worker async context
    where relationships using string references can't be resolved.
    """
    # These imports are intentionally late to avoid circular dependencies
    from infrastructure.database.models.auth import User  # noqa: F401
    from infrastructure.database.models.credits import CreditTransaction  # noqa: F401
    from infrastructure.database.models.deploy import Deployment  # noqa: F401
    from infrastructure.database.models.emails import EmailLog  # noqa: F401
    from infrastructure.database.models.projects import Project  # noqa: F401
    from infrastructure.database.models.templates import Template  # noqa: F401


# Register models when module is imported
_register_models()
