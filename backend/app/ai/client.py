"""Anthropic API client wrapper for AI code generation."""

import logging
from typing import Optional

from anthropic import AsyncAnthropic

from app.core.config import settings

logger = logging.getLogger(__name__)


class AnthropicClient:
    """Wrapper for Anthropic API calls.

    Provides a simplified interface for making async calls to Claude API
    with configurable model and token settings.
    """

    def __init__(self) -> None:
        """Initialize the Anthropic client with API key from settings."""
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.default_model = settings.GENERATION_MODEL

    async def generate_code(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Generate code using Claude API.

        Args:
            prompt: User prompt with requirements.
            system_prompt: System instructions for the model.
            model: Model to use (defaults to settings.GENERATION_MODEL).
            max_tokens: Max tokens (defaults to settings.GENERATION_MAX_TOKENS).

        Returns:
            Generated text content from Claude.

        Raises:
            anthropic.APIError: If API call fails.
        """
        model_name = model or self.default_model
        tokens = max_tokens or settings.GENERATION_MAX_TOKENS

        logger.info(
            "Generating code",
            extra={
                "model": model_name,
                "max_tokens": tokens,
                "prompt_length": len(prompt),
            },
        )

        response = await self.client.messages.create(
            model=model_name,
            max_tokens=tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )

        result = response.content[0].text

        logger.info(
            "Code generation complete",
            extra={
                "model": model_name,
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
                "response_length": len(result),
            },
        )

        return result


# Singleton instance for use across the application
anthropic_client = AnthropicClient()
