"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/viably"

    # JWT Settings
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Password Settings
    MIN_PASSWORD_LENGTH: int = 8

    # App Settings
    DEBUG: bool = False
    APP_NAME: str = "Viably"

    # AI Generation
    ANTHROPIC_API_KEY: str = ""
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    GENERATION_COST: int = 10
    GENERATION_MAX_TOKENS: int = 8192
    GENERATION_MODEL: str = "claude-sonnet-4-20250514"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
