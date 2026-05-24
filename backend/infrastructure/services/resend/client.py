"""Resend API client for email sending."""

import logging
from typing import Any, Optional

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from infrastructure.services.common.exceptions import ExternalServiceError

logger = logging.getLogger(__name__)

# Import resend conditionally
try:
    import resend

    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("resend library not installed. Email sending will fail.")


class ResendClient:
    """Client for Resend email API with retry logic.

    Handles email sending with HTML content and template variables.
    Supports mock mode for development without API key.

    Example:
        client = ResendClient(
            api_key=settings.RESEND_API_KEY,
            from_email="noreply@viably.dev",
            mock_mode=settings.ENVIRONMENT == "development"
        )
        response = await client.send_email(
            to="user@example.com",
            subject="Welcome!",
            html="<h1>Hello</h1>"
        )
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: str = "Viably <noreply@viably.dev>",
        mock_mode: bool = False,
    ):
        """Initialize Resend client.

        Args:
            api_key: Resend API key (None for mock mode)
            from_email: Default sender email address
            mock_mode: If True, emails are logged but not sent
        """
        self.from_email = from_email
        self.mock_mode = mock_mode or not api_key

        if not self.mock_mode:
            if not RESEND_AVAILABLE:
                raise RuntimeError("resend library is not installed")
            resend.api_key = api_key
            logger.info("Resend client initialized in real mode")
        else:
            logger.info("Resend client initialized in mock mode")

    @retry(
        retry=retry_if_exception_type(Exception),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send email via Resend API with retry logic.

        Args:
            to: Recipient email address
            subject: Email subject line
            html: HTML content
            from_email: Sender email (overrides default)

        Returns:
            Response dict with id and other metadata

        Raises:
            ExternalServiceError: If email sending fails after retries
        """
        sender = from_email or self.from_email

        if self.mock_mode:
            logger.info(
                "Mock email sent",
                extra={
                    "to": to,
                    "subject": subject,
                    "from": sender,
                    "html_length": len(html),
                },
            )
            return {
                "id": "mock-email-id",
                "from": sender,
                "to": to,
                "created_at": None,
            }

        try:
            logger.info(
                "Sending email via Resend",
                extra={
                    "to": to,
                    "subject": subject,
                    "from": sender,
                    "html_length": len(html),
                },
            )

            # Send via Resend (synchronous call)
            response = resend.Emails.send(
                {
                    "from": sender,
                    "to": to,
                    "subject": subject,
                    "html": html,
                }
            )

            logger.info(
                "Email sent successfully",
                extra={
                    "to": to,
                    "response": response,
                },
            )

            return response

        except Exception as e:
            logger.error(
                "Email sending failed",
                extra={
                    "to": to,
                    "subject": subject,
                    "error": str(e),
                    "error_type": type(e).__name__,
                },
            )
            raise ExternalServiceError(
                "Resend",
                f"Email sending failed: {str(e)}",
            ) from e

    async def send_template_email(
        self,
        to: str,
        subject: str,
        html: str,
        template_variables: dict[str, Any],
        from_email: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send email with template variables tracking.

        This is a convenience wrapper around send_email that logs
        template variables for debugging purposes.

        Args:
            to: Recipient email address
            subject: Email subject line
            html: Rendered HTML content
            template_variables: Template variables used
            from_email: Sender email (overrides default)

        Returns:
            Response dict from send_email
        """
        logger.debug(
            "Sending template email",
            extra={
                "to": to,
                "subject": subject,
                "template_variables": template_variables,
            },
        )

        return await self.send_email(
            to=to,
            subject=subject,
            html=html,
            from_email=from_email,
        )


def get_resend_client(
    api_key: Optional[str] = None,
    from_email: str = "Viably <noreply@viably.dev>",
    mock_mode: bool = False,
) -> ResendClient:
    """Factory function for dependency injection.

    Args:
        api_key: Resend API key
        from_email: Default sender email
        mock_mode: If True, use mock mode

    Returns:
        Configured ResendClient instance

    Example:
        # In FastAPI dependency
        def get_client() -> ResendClient:
            return get_resend_client(
                api_key=settings.RESEND_API_KEY,
                mock_mode=settings.ENVIRONMENT == "development"
            )
    """
    return ResendClient(
        api_key=api_key,
        from_email=from_email,
        mock_mode=mock_mode,
    )
