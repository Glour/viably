"""Celery tasks for asynchronous email sending.

This module provides Celery-based background tasks for processing
email sending requests asynchronously. Emails are queued and sent
in the background, preventing API blocking.

Usage:
    celery -A app.celery_tasks.email_tasks worker --loglevel=info

Features:
    - Automatic retry with exponential backoff for transient errors
    - Email log tracking in database
    - Periodic retry task for failed emails
    - Structured logging with task context
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from celery import Celery

from app.core.config import settings

logger = logging.getLogger(__name__)

# =============================================================================
# Celery App Configuration
# =============================================================================

celery_app = Celery(
    "email_worker",
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

# Celery Beat Schedule for Periodic Tasks
# Run with: celery -A app.celery_tasks.email_tasks beat --loglevel=info
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    # Check for low credits daily at 10 AM UTC
    'check-low-credits-daily': {
        'task': 'check_low_credits',
        'schedule': crontab(hour=10, minute=0),
        'options': {'expires': 3600},  # Task expires after 1 hour if not executed
    },
    # Retry failed emails every hour
    'retry-failed-emails-hourly': {
        'task': 'retry_failed_emails',
        'schedule': crontab(minute=0),  # Every hour at :00
        'options': {'expires': 1800},  # Task expires after 30 minutes
    },
}

# =============================================================================
# Celery Tasks
# =============================================================================


@celery_app.task(
    name="send_template_email_async",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_template_email_task(
    self,
    template_name: str,
    email_type: str,
    recipient: str,
    subject: str,
    template_props: dict[str, Any],
    user_id: str,  # UUID as string for Celery serialization
) -> dict:
    """Celery task to render and send email using React Email template.

    Args:
        template_name: React Email template name (e.g., 'welcome').
        email_type: Type of email (welcome, generation_complete, etc.).
        recipient: Recipient email address.
        subject: Email subject line.
        template_props: Props for React Email template.
        user_id: User UUID as string.

    Returns:
        dict with send result.

    Raises:
        Exception: If email rendering or sending fails after all retries.
    """
    logger.info(
        "Starting async template email send",
        extra={
            "template": template_name,
            "email_type": email_type,
            "recipient": recipient,
            "user_id": user_id,
            "task_id": self.request.id,
            "retry_count": self.request.retries,
        },
    )

    try:
        result = asyncio.run(
            _send_template_email_async(
                template_name=template_name,
                email_type=email_type,
                recipient=recipient,
                subject=subject,
                template_props=template_props,
                user_id=user_id,
            )
        )

        logger.info(
            "Template email sent successfully",
            extra={
                "template": template_name,
                "email_type": email_type,
                "recipient": recipient,
                "user_id": user_id,
                "task_id": self.request.id,
                "email_log_id": str(result["email_log_id"]),
            },
        )

        return {"status": "sent", "recipient": recipient}

    except Exception as e:
        logger.error(
            "Template email sending failed",
            extra={
                "template": template_name,
                "email_type": email_type,
                "recipient": recipient,
                "user_id": user_id,
                "task_id": self.request.id,
                "retry_count": self.request.retries,
                "max_retries": self.max_retries,
                "error": str(e),
                "error_type": type(e).__name__,
            },
            exc_info=True,
        )

        raise self.retry(exc=e, countdown=60 * (2**self.request.retries))


@celery_app.task(
    name="send_email_async",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
)
def send_email_task(
    self,
    email_type: str,
    recipient: str,
    subject: str,
    html_content: str,
    template_variables: dict[str, Any],
    user_id: str,  # UUID as string for Celery serialization
) -> dict:
    """Celery task to send email asynchronously.

    This task handles email sending in the background, allowing the API
    to return immediately. Failed emails are automatically retried with
    exponential backoff.

    Args:
        email_type: Type of email (welcome, generation_complete, etc.).
        recipient: Recipient email address.
        subject: Email subject line.
        html_content: Rendered HTML content.
        template_variables: Variables used in template.
        user_id: User UUID as string.

    Returns:
        dict with send result:
            - status: "sent" if successful
            - recipient: recipient email address

    Raises:
        Exception: If email sending fails after all retries.

    Retry Behavior:
        - Maximum 3 retries with exponential backoff
        - Initial delay: 60 seconds
        - Exponential multiplier: 2x (60s -> 120s -> 240s)
    """
    logger.info(
        "Starting async email send",
        extra={
            "email_type": email_type,
            "recipient": recipient,
            "user_id": user_id,
            "task_id": self.request.id,
            "retry_count": self.request.retries,
        },
    )

    try:
        # Run async code in sync Celery context using asyncio.run()
        # This is the preferred pattern for Celery tasks (vs event loop management)
        result = asyncio.run(
            _send_email_async(
                email_type=email_type,
                recipient=recipient,
                subject=subject,
                html_content=html_content,
                template_variables=template_variables,
                user_id=user_id,
            )
        )

        logger.info(
            "Email sent successfully",
            extra={
                "email_type": email_type,
                "recipient": recipient,
                "user_id": user_id,
                "task_id": self.request.id,
                "email_log_id": str(result["email_log_id"]),
            },
        )

        return {"status": "sent", "recipient": recipient}

    except Exception as e:
        # Log error and retry with exponential backoff
        logger.error(
            "Email sending failed",
            extra={
                "email_type": email_type,
                "recipient": recipient,
                "user_id": user_id,
                "task_id": self.request.id,
                "retry_count": self.request.retries,
                "max_retries": self.max_retries,
                "error": str(e),
                "error_type": type(e).__name__,
            },
            exc_info=True,
        )

        # Retry with exponential backoff: 60s -> 120s -> 240s
        raise self.retry(exc=e, countdown=60 * (2**self.request.retries))


@celery_app.task(name="check_low_credits")
def check_low_credits_task() -> dict:
    """Periodic task to check users with low credits and send warnings.

    This task runs daily (configured in Celery Beat) to identify users
    with credits below the threshold (20) and send them a warning email.

    Returns:
        dict with check result:
            - users_checked: number of users checked
            - warnings_sent: number of warnings sent

    Configuration:
        Add to Celery Beat schedule:
        ```python
        celery_app.conf.beat_schedule = {
            'check-low-credits-daily': {
                'task': 'check_low_credits',
                'schedule': crontab(hour=10, minute=0),  # 10 AM UTC daily
            },
        }
        ```
    """
    logger.info("Starting low credits check task")

    try:
        result = asyncio.run(_check_low_credits_async())

        logger.info(
            "Low credits check completed",
            extra={
                "users_checked": result["users_checked"],
                "warnings_sent": result["warnings_sent"],
            },
        )

        return result

    except Exception as e:
        logger.error(
            "Low credits check task failed",
            extra={"error": str(e), "error_type": type(e).__name__},
            exc_info=True,
        )
        raise


@celery_app.task(name="retry_failed_emails")
def retry_failed_emails_task() -> dict:
    """Periodic task to retry failed emails.

    This task runs periodically (configured in Celery Beat) to find
    failed emails from the last 24 hours and attempt to re-send them.

    Returns:
        dict with retry result:
            - retried: number of emails retried
            - failed: number of emails that failed retry

    Configuration:
        Add to Celery Beat schedule:
        ```python
        celery_app.conf.beat_schedule = {
            'retry-failed-emails': {
                'task': 'retry_failed_emails',
                'schedule': 3600.0,  # Run every hour
            },
        }
        ```
    """
    logger.info("Starting periodic failed email retry task")

    try:
        # Run async code in sync Celery context
        result = asyncio.run(_retry_failed_emails_async())

        logger.info(
            "Failed email retry task completed",
            extra={
                "retried_count": result["retried"],
                "failed_count": result["failed"],
            },
        )

        return result

    except Exception as e:
        logger.error(
            "Failed email retry task failed",
            extra={"error": str(e), "error_type": type(e).__name__},
            exc_info=True,
        )
        raise


# =============================================================================
# Async Implementation
# =============================================================================


async def _send_template_email_async(
    template_name: str,
    email_type: str,
    recipient: str,
    subject: str,
    template_props: dict[str, Any],
    user_id: str,
) -> dict:
    """Async implementation of template email sending.

    Args:
        template_name: React Email template name.
        email_type: Type of email.
        recipient: Recipient email address.
        subject: Email subject line.
        template_props: Template props.
        user_id: User UUID as string.

    Returns:
        dict with email_log_id.

    Raises:
        Any exception from EmailService.send_template_email().
    """
    from app.core.database import async_session_maker
    from app.emails.service import EmailService

    async with async_session_maker() as db:
        service = EmailService(db)
        email_log_id = await service.send_template_email(
            template_name=template_name,
            email_type=email_type,
            recipient=recipient,
            subject=subject,
            template_props=template_props,
            user_id=UUID(user_id),
        )

        await db.commit()

        return {"email_log_id": email_log_id}


async def _send_email_async(
    email_type: str,
    recipient: str,
    subject: str,
    html_content: str,
    template_variables: dict[str, Any],
    user_id: str,
) -> dict:
    """Async implementation of email sending.

    This function is called from the sync Celery task and handles
    the actual async database and email operations.

    Args:
        email_type: Type of email.
        recipient: Recipient email address.
        subject: Email subject line.
        html_content: HTML content.
        template_variables: Template variables.
        user_id: User UUID as string.

    Returns:
        dict with email_log_id.

    Raises:
        Any exception from EmailService.send_email().
    """
    # Import here to avoid circular imports and ensure fresh imports
    from app.core.database import async_session_maker
    from app.emails.service import EmailService

    async with async_session_maker() as db:
        service = EmailService(db)
        email_log_id = await service.send_email(
            email_type=email_type,
            recipient=recipient,
            subject=subject,
            html_content=html_content,
            template_variables=template_variables,
            user_id=UUID(user_id),
        )

        # Commit is handled by EmailService, but ensure it's done
        await db.commit()

        return {"email_log_id": email_log_id}


async def _retry_failed_emails_async() -> dict:
    """Async implementation of failed email retry.

    This function is called from the periodic Celery task and handles
    the database queries and retry logic.

    Returns:
        dict with retry statistics:
            - retried: number of emails successfully retried
            - failed: number of emails that failed retry
    """
    # Import here to avoid circular imports
    from sqlalchemy import select

    from app.core.database import async_session_maker
    from app.emails.models import EmailLog
    from app.emails.service import EmailService

    async with async_session_maker() as db:
        # Get failed emails from last 24 hours
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)

        result = await db.execute(
            select(EmailLog)
            .where(EmailLog.status == "failed", EmailLog.created_at > cutoff_time)
            .limit(100)  # Process max 100 emails per run
        )
        failed_logs = result.scalars().all()

        logger.info(
            "Found failed emails to retry",
            extra={"count": len(failed_logs)},
        )

        service = EmailService(db)
        retry_count = 0
        failed_count = 0

        for log in failed_logs:
            try:
                # Retry the failed email
                success = await service.retry_failed_email(log.id)

                if success:
                    # Re-send the email by creating a new task
                    # This prevents infinite loops while still retrying
                    send_email_task.delay(
                        email_type=log.email_type,
                        recipient=log.recipient_email,
                        subject=log.subject,
                        html_content="",  # Will be re-rendered
                        template_variables=log.template_variables or {},
                        user_id=str(log.user_id),
                    )
                    retry_count += 1

                    logger.info(
                        "Queued failed email for retry",
                        extra={
                            "email_log_id": str(log.id),
                            "email_type": log.email_type,
                            "recipient": log.recipient_email,
                        },
                    )
                else:
                    failed_count += 1

            except Exception as e:
                failed_count += 1
                logger.error(
                    "Failed to retry email",
                    extra={
                        "email_log_id": str(log.id),
                        "error": str(e),
                        "error_type": type(e).__name__,
                    },
                    exc_info=True,
                )

        return {"retried": retry_count, "failed": failed_count}


async def _check_low_credits_async() -> dict:
    """Async implementation of low credits check.

    Checks all active users for low credit balances and sends warning emails.
    Warning threshold: 20 credits.

    Returns:
        dict with check statistics:
            - users_checked: total active users checked
            - warnings_sent: number of warning emails sent
    """
    from sqlalchemy import select

    from app.auth.models import User
    from app.core.config import settings
    from app.core.database import async_session_maker

    LOW_CREDITS_THRESHOLD = 20

    async with async_session_maker() as db:
        # Get all active users with low credits
        result = await db.execute(
            select(User)
            .where(
                User.is_active == True,  # noqa: E712
                User.credits < LOW_CREDITS_THRESHOLD,
                User.credits > 0,  # Don't warn users with 0 credits (already notified)
            )
        )
        low_credit_users = result.scalars().all()

        logger.info(
            "Found users with low credits",
            extra={
                "count": len(low_credit_users),
                "threshold": LOW_CREDITS_THRESHOLD,
            },
        )

        warnings_sent = 0

        for user in low_credit_users:
            try:
                # Check if we already sent a warning recently
                # Query email logs to see if we sent low_credits email in last 7 days
                from datetime import timedelta

                cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)

                recent_warning_result = await db.execute(
                    select(EmailLog)
                    .where(
                        EmailLog.user_id == user.id,
                        EmailLog.email_type == "low_credits",
                        EmailLog.created_at > cutoff_date,
                        EmailLog.status == "sent",
                    )
                    .limit(1)
                )
                recent_warning = recent_warning_result.scalar_one_or_none()

                if recent_warning:
                    logger.debug(
                        "Skipping user - warning sent recently",
                        extra={
                            "user_id": str(user.id),
                            "last_warning": str(recent_warning.created_at),
                        },
                    )
                    continue

                # Send warning email
                base_url = settings.CORS_ORIGINS.split(',')[0]
                send_template_email_task.delay(
                    template_name="low-credits",
                    email_type="low_credits",
                    recipient=user.email,
                    subject="Low Credits Warning - Refill to Continue Creating",
                    template_props={
                        "userName": user.full_name or user.email.split("@")[0],
                        "currentCredits": user.credits,
                        "threshold": LOW_CREDITS_THRESHOLD,
                        "dashboardUrl": f"{base_url}/dashboard",
                        "buyCreditsUrl": f"{base_url}/credits/buy",
                    },
                    user_id=str(user.id),
                )

                warnings_sent += 1

                logger.info(
                    "Low credits warning queued",
                    extra={
                        "user_id": str(user.id),
                        "credits": user.credits,
                    },
                )

            except Exception as e:
                logger.error(
                    "Failed to send low credits warning",
                    extra={
                        "user_id": str(user.id),
                        "error": str(e),
                        "error_type": type(e).__name__,
                    },
                    exc_info=True,
                )

        return {
            "users_checked": len(low_credit_users),
            "warnings_sent": warnings_sent,
        }
