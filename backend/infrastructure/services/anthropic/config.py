"""Configuration for Anthropic API models and limits."""

from typing import Final

# Model configurations
DEFAULT_MODEL: Final[str] = "claude-sonnet-4-6"
DEFAULT_MAX_TOKENS: Final[int] = 64000

# Model aliases for easier switching
MODELS: Final[dict[str, str]] = {
    "sonnet": "claude-sonnet-4-6",
    "opus": "claude-opus-4-6",
    "haiku": "claude-haiku-4-5-20251001",
}

# Token limits per model (for validation)
MODEL_LIMITS: Final[dict[str, int]] = {
    "claude-sonnet-4-6": 64000,
    "claude-opus-4-6": 32000,
    "claude-haiku-4-5-20251001": 64000,
    # Legacy models
    "claude-sonnet-4-20250514": 16384,
    "claude-opus-4-20250514": 8192,
    "claude-3-5-haiku-20241022": 8192,
}


def get_model_name(model_alias: str | None = None) -> str:
    """Get full model name from alias or return default.

    Args:
        model_alias: Model alias (sonnet, opus, haiku) or full name

    Returns:
        Full model name
    """
    if model_alias is None:
        return DEFAULT_MODEL

    # If it's an alias, resolve it
    if model_alias in MODELS:
        return MODELS[model_alias]

    # Otherwise return as-is (assume it's a full model name)
    return model_alias


def get_max_tokens(model: str, requested_tokens: int | None = None) -> int:
    """Get max tokens for a model, respecting limits.

    Args:
        model: Model name
        requested_tokens: Requested token count

    Returns:
        Safe token count (capped at model limit)
    """
    if requested_tokens is None:
        return DEFAULT_MAX_TOKENS

    model_limit = MODEL_LIMITS.get(model, DEFAULT_MAX_TOKENS)
    return min(requested_tokens, model_limit)
