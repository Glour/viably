"""Business logic for emails module."""

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.emails.models import EmailLog

logger = logging.getLogger(__name__)

# Import resend conditionally to avoid breaking if not installed
try:
    import resend

    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("resend library not installed. Email sending will fail.")


class EmailService:
    """Service for sending emails and managing email logs."""

    def __init__(self, db: AsyncSession):
        """Initialize EmailService.

        Args:
            db: Database session.
        """
        self.db = db
        if RESEND_AVAILABLE and settings.RESEND_API_KEY:
            resend.api_key = settings.RESEND_API_KEY

    async def send_email(
        self,
        email_type: str,
        recipient: str,
        subject: str,
        html_content: str,
        template_variables: dict[str, Any],
        user_id: UUID,
    ) -> UUID:
        """Send email via Resend and log to database.

        Args:
            email_type: Type of email (welcome, generation_complete, etc.).
            recipient: Recipient email address.
            subject: Email subject line.
            html_content: HTML content of email.
            template_variables: Variables used in template.
            user_id: User UUID.

        Returns:
            UUID of created email log entry.

        Raises:
            Exception: If email sending fails.
        """
        # Create email log entry
        email_log = EmailLog(
            user_id=user_id,
            email_type=email_type,
            recipient_email=recipient,
            subject=subject,
            template_variables=template_variables,
            status="pending",
        )
        self.db.add(email_log)
        await self.db.flush()

        try:
            # Check if Resend is available
            if not RESEND_AVAILABLE:
                raise RuntimeError("resend library is not installed")

            if not settings.RESEND_API_KEY:
                raise RuntimeError("RESEND_API_KEY is not configured")

            # Send via Resend
            response = resend.Emails.send(
                {
                    "from": "Viably <noreply@viably.dev>",
                    "to": recipient,
                    "subject": subject,
                    "html": html_content,
                }
            )

            # Update log with success
            email_log.status = "sent"
            email_log.sent_at = datetime.now(timezone.utc)
            await self.db.commit()

            logger.info(
                "Email sent successfully",
                extra={
                    "email_log_id": str(email_log.id),
                    "user_id": str(user_id),
                    "email_type": email_type,
                    "recipient": recipient,
                    "resend_response": response,
                },
            )

            return email_log.id

        except Exception as e:
            # Update log with failure
            email_log.status = "failed"
            email_log.error_message = str(e)
            await self.db.commit()

            logger.error(
                "Failed to send email",
                extra={
                    "email_log_id": str(email_log.id),
                    "user_id": str(user_id),
                    "email_type": email_type,
                    "recipient": recipient,
                    "error": str(e),
                },
                exc_info=True,
            )

            raise

    async def get_email_logs(
        self, user_id: UUID, limit: int = 50
    ) -> list[EmailLog]:
        """Get email logs for a user.

        Args:
            user_id: User UUID.
            limit: Maximum number of logs to return.

        Returns:
            List of EmailLog objects, ordered by created_at descending.
        """
        result = await self.db.execute(
            select(EmailLog)
            .where(EmailLog.user_id == user_id)
            .order_by(EmailLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def retry_failed_email(self, email_log_id: UUID) -> bool:
        """Retry sending a failed email.

        Args:
            email_log_id: UUID of email log entry to retry.

        Returns:
            True if retry was initiated, False if log not found or not in failed status.
        """
        result = await self.db.execute(
            select(EmailLog).where(EmailLog.id == email_log_id)
        )
        email_log = result.scalar_one_or_none()

        if not email_log or email_log.status != "failed":
            logger.warning(
                "Cannot retry email",
                extra={
                    "email_log_id": str(email_log_id),
                    "found": email_log is not None,
                    "status": email_log.status if email_log else None,
                },
            )
            return False

        # Reset status and error message
        email_log.status = "pending"
        email_log.error_message = None
        await self.db.commit()

        logger.info(
            "Email retry initiated",
            extra={
                "email_log_id": str(email_log_id),
                "user_id": str(email_log.user_id),
                "email_type": email_log.email_type,
            },
        )

        # Note: Actual re-sending would be triggered by a Celery task
        # or external system that monitors pending emails.
        # This method only marks the email as pending for retry.

        return True
