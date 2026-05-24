"""Resend API client for email sending."""

from infrastructure.services.resend.client import ResendClient, get_resend_client

__all__ = [
    "ResendClient",
    "get_resend_client",
]
