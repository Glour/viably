"""Exceptions for external service clients."""


class ExternalServiceError(Exception):
    """Base exception for external service errors."""

    def __init__(self, service_name: str, message: str, status_code: int | None = None):
        self.service_name = service_name
        self.message = message
        self.status_code = status_code
        super().__init__(f"{service_name}: {message}")


class ExternalServiceTimeout(ExternalServiceError):
    """Raised when external service request times out."""

    pass


class ExternalServiceRateLimitError(ExternalServiceError):
    """Raised when external service rate limit is exceeded."""

    pass


class ExternalServiceAuthError(ExternalServiceError):
    """Raised when external service authentication fails."""

    pass


class ExternalServiceNotFoundError(ExternalServiceError):
    """Raised when external service resource not found."""

    pass
