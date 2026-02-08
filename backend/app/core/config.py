"""Application configuration."""

import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    # SECURITY: No default - must be provided via DATABASE_URL environment variable
    DATABASE_URL: str

    # JWT Settings
    # SECURITY: No default - must be provided via JWT_SECRET_KEY environment variable
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes (security best practice)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # 7 days (reduced from 30)

    # Password Settings
    MIN_PASSWORD_LENGTH: int = 8

    # App Settings
    DEBUG: bool = False
    APP_NAME: str = "Viably"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"  # Comma-separated list
    SQL_ECHO: bool = False  # Separate from DEBUG - never enable in production

    # AI Generation
    ANTHROPIC_API_KEY: str = ""
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    GENERATION_COST: int = 10
    GENERATION_MAX_TOKENS: int = 8192
    GENERATION_MODEL: str = "claude-sonnet-4-20250514"

    # Deployment (Railway)
    RAILWAY_API_TOKEN: str = ""
    DEPLOYMENT_TIMEOUT_SECONDS: int = 300  # 5 minutes
    DEPLOYMENT_POLL_INTERVAL_SECONDS: int = 10
    HEALTH_CHECK_TIMEOUT_SECONDS: float = 10.0  # Health check HTTP request timeout

    # Observability
    SENTRY_DSN: str = ""
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # "json" for production, "console" for development

    @model_validator(mode="after")
    def warn_localhost_cors_in_production(self):
        """Warn when CORS_ORIGINS contains only localhost values in production mode."""
        if not self.DEBUG:
            origins = [o.strip() for o in self.CORS_ORIGINS.split(",")]
            if all("localhost" in o or "127.0.0.1" in o for o in origins):
                logger.warning(
                    "CORS_ORIGINS contains only localhost values in production mode. "
                    "This will block legitimate frontend requests. "
                    "Set CORS_ORIGINS environment variable to include production domains."
                )
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
