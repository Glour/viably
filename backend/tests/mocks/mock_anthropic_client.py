"""Mock Anthropic client for testing."""

from collections.abc import AsyncGenerator
from typing import Optional


class MockAnthropicClient:
    """Mock Anthropic client that returns predictable responses."""

    def __init__(
        self,
        api_key: str = "mock-api-key",
        default_model: str | None = None,
        default_max_tokens: int | None = None,
    ):
        """Initialize mock client."""
        self.api_key = api_key
        self.default_model = default_model or "claude-sonnet-4-6"
        self.default_max_tokens = default_max_tokens or 8192
        self.call_count = 0
        self.last_prompt = None
        self.last_system_prompt = None

    async def generate_code(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Generate mock code response."""
        self.call_count += 1
        self.last_prompt = prompt
        self.last_system_prompt = system_prompt

        return f"""# Generated code (mock)
def hello_world():
    print("Hello from mock AI!")
    return "Mock response to: {prompt[:50]}"
"""

    async def generate_code_streaming(
        self,
        prompt: str,
        system_prompt: str,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """Generate mock streaming response."""
        self.call_count += 1
        self.last_prompt = prompt
        self.last_system_prompt = system_prompt

        chunks = [
            "# Generated ",
            "code (mock)\n",
            "def hello",
            "_world():\n",
            '    print("Hello ',
            'from mock AI!")\n',
            f'    return "Mock response to: {prompt[:30]}"',
        ]

        for chunk in chunks:
            yield chunk


def get_mock_anthropic_client() -> MockAnthropicClient:
    """Factory for mock Anthropic client."""
    return MockAnthropicClient()
