"""Validation helper functions."""

import jsonschema
from fastapi import HTTPException, status


def validate_config_against_schema(config: dict | None, schema: dict) -> None:
    """Validate configuration against JSON schema.

    Args:
        config: User-provided configuration.
        schema: JSON Schema format validation schema.

    Raises:
        HTTPException 400: If config doesn't match schema.

    Example:
        >>> schema = {"type": "object", "properties": {"name": {"type": "string"}}}
        >>> validate_config_against_schema({"name": "test"}, schema)
        >>> # No exception raised
        >>> validate_config_against_schema({"name": 123}, schema)
        Traceback (most recent call last):
            ...
        HTTPException: 400: Config validation failed: ...
    """
    if config is None:
        config = {}

    try:
        jsonschema.validate(instance=config, schema=schema)
    except jsonschema.ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Config validation failed: {e.message}",
        )
