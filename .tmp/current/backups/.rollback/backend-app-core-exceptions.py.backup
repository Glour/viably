"""Core exception helpers for common HTTP errors."""

from uuid import UUID

from fastapi import HTTPException, status


def not_found(resource: str, resource_id: UUID | str | None = None) -> HTTPException:
    """Generate 404 HTTPException for resource not found.

    Args:
        resource: Resource type (e.g., "User", "Project", "Template")
        resource_id: Optional resource identifier for logging

    Returns:
        HTTPException with 404 status

    Example:
        >>> raise not_found("User", user_id)
        HTTPException: 404 User not found (ID: ...)
    """
    detail = f"{resource} not found"
    if resource_id:
        detail += f" (ID: {resource_id})"
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=detail,
    )


def insufficient_credits(required: int, available: int) -> HTTPException:
    """Generate 422 HTTPException for insufficient credits.

    Args:
        required: Credits required for operation
        available: Credits currently available

    Returns:
        HTTPException with 422 status

    Example:
        >>> raise insufficient_credits(50, 10)
        HTTPException: 422 Insufficient credits. Required: 50, Available: 10
    """
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=f"Insufficient credits. Required: {required}, Available: {available}",
    )


def unauthorized(detail: str = "Invalid credentials") -> HTTPException:
    """Generate 401 HTTPException for authentication failure.

    Args:
        detail: Custom error message (default: "Invalid credentials")

    Returns:
        HTTPException with 401 status and WWW-Authenticate header

    Example:
        >>> raise unauthorized("Token expired")
        HTTPException: 401 Token expired
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def bad_request(detail: str) -> HTTPException:
    """Generate 400 HTTPException for bad request.

    Args:
        detail: Error message describing the bad request

    Returns:
        HTTPException with 400 status

    Example:
        >>> raise bad_request("Invalid configuration format")
        HTTPException: 400 Invalid configuration format
    """
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail,
    )
