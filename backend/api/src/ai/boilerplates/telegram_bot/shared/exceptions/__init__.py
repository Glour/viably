"""Application exceptions."""
from shared.exceptions.base import AppException, NotFoundError, ValidationError

# Optional exceptions — may not be present in AI-generated code
try:
    from shared.exceptions.base import AlreadyExistsError
except ImportError:
    class AlreadyExistsError(AppException):
        pass

try:
    from shared.exceptions.base import PermissionDeniedError
except ImportError:
    class PermissionDeniedError(AppException):
        pass

try:
    from shared.exceptions.base import ExternalServiceError
except ImportError:
    class ExternalServiceError(AppException):
        pass

try:
    from shared.exceptions.base import DatabaseError
except ImportError:
    class DatabaseError(AppException):
        pass


__all__ = [
    "AppException",
    "ValidationError",
    "NotFoundError",
    "AlreadyExistsError",
    "PermissionDeniedError",
    "ExternalServiceError",
    "DatabaseError",
]
