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
