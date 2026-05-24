"""Mock Resend client for testing."""

from typing import Any, Optional
from uuid import uuid4


class MockResendClient:
    """Mock Resend client that simulates email sending."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: str = "Viably <noreply@viably.dev>",
        mock_mode: bool = True,
    ):
        """Initialize mock client."""
        self.from_email = from_email
        self.mock_mode = True  # Always mock in tests
        self.sent_emails = []
        self.call_count = 0

    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send mock email."""
        self.call_count += 1
        email_id = str(uuid4())

        email_record = {
            "id": email_id,
            "from": from_email or self.from_email,
            "to": to,
            "subject": subject,
            "html": html,
            "created_at": "2025-01-01T00:00:00Z",
        }

        self.sent_emails.append(email_record)
        return email_record

    async def send_template_email(
        self,
        to: str,
        subject: str,
        html: str,
        template_variables: dict[str, Any],
        from_email: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send mock template email."""
        email_record = await self.send_email(
            to=to,
            subject=subject,
            html=html,
            from_email=from_email,
        )
        email_record["template_variables"] = template_variables
        return email_record

    def get_sent_emails(self) -> list[dict[str, Any]]:
        """Get list of all sent emails."""
        return self.sent_emails

    def get_sent_to(self, recipient: str) -> list[dict[str, Any]]:
        """Get emails sent to specific recipient."""
        return [e for e in self.sent_emails if e["to"] == recipient]

    def clear_sent_emails(self) -> None:
        """Clear sent emails list."""
        self.sent_emails = []
        self.call_count = 0


def get_mock_resend_client() -> MockResendClient:
    """Factory for mock Resend client."""
    return MockResendClient()
