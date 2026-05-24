"""Budget and limits for agent loop execution."""

from dataclasses import dataclass

from settings.config import settings


@dataclass
class AgentBudget:
    """Limits for a single agent loop run."""

    max_iterations: int = 10
    max_total_tokens: int = 200_000
    timeout_seconds: int = 300

    @classmethod
    def from_settings(cls) -> "AgentBudget":
        return cls(
            max_iterations=settings.AGENT_MAX_ITERATIONS,
            max_total_tokens=settings.AGENT_MAX_TOKENS,
            timeout_seconds=settings.AGENT_TIMEOUT_SECONDS,
        )
