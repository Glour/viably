"""Common utilities for external service clients."""

from infrastructure.services.common.base_client import BaseExternalClient
from infrastructure.services.common.exceptions import (
    ExternalServiceAuthError,
    ExternalServiceError,
    ExternalServiceNotFoundError,
    ExternalServiceRateLimitError,
    ExternalServiceTimeout,
)

__all__ = [
    "BaseExternalClient",
    "ExternalServiceError",
    "ExternalServiceTimeout",
    "ExternalServiceRateLimitError",
    "ExternalServiceAuthError",
    "ExternalServiceNotFoundError",
]
