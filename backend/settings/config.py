"""Application configuration."""

import logging

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # allow unknown env vars
    )

    # Database
    # SECURITY: No default - must be provided via DATABASE_URL environment variable
    DATABASE_URL: str

    # JWT Settings
    # SECURITY: No default - must be provided via JWT_SECRET_KEY environment variable
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 60 minutes
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
    # Pool of Anthropic API keys for rotation (comma-separated in .env)
    # e.g. ANTHROPIC_API_KEY_POOL=key1,key2,key3
    # If empty, falls back to ANTHROPIC_API_KEY
    ANTHROPIC_API_KEY_POOL: list[str] = []
    # OAuth token pool (JSON array in .env)
    # e.g. ANTHROPIC_OAUTH_TOKEN_POOL=["sk-ant-oat01-...", "sk-ant-oat01-..."]
    ANTHROPIC_OAUTH_TOKEN_POOL: list[str] = []
    GROQ_API_KEY: str = ""
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    GENERATION_COST: int = 10
    CONVERSATION_COST: int = 1
    # Dynamic credit pricing
    MIN_CREDIT_COST: int = 1
    MAX_CREDIT_COST: int = 100  # safety cap
    GENERATION_MAX_TOKENS: int = 64000
    GENERATION_MODEL: str = "claude-sonnet-4-6"
    USE_GENERATION_V2: bool = True
    USE_AGENT_LOOP: bool = False
    AGENT_MAX_ITERATIONS: int = 50
    AGENT_MAX_TOKENS: int = 500_000
    AGENT_TIMEOUT_SECONDS: int = 600

    # Email (Resend)
    RESEND_API_KEY: str = ""

    # YooKassa payments
    YOOKASSA_SHOP_ID: str = ""
    YOOKASSA_SECRET_KEY: str = ""
    # Stripe payments
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # NowPayments crypto
    NOWPAYMENTS_API_KEY: str = ""
    NOWPAYMENTS_IPN_SECRET: str = ""


    DEPLOYMENT_TIMEOUT_SECONDS: int = 300  # 5 minutes
    DEPLOYMENT_POLL_INTERVAL_SECONDS: int = 10
    HEALTH_CHECK_TIMEOUT_SECONDS: float = 10.0  # Health check HTTP request timeout

    # Website deployment
    DEPLOY_DOMAIN: str = "viably.dev"  # Base domain for deployed sites
    DEPLOY_SSL_ENABLED: bool = True  # Set to False on dev servers without DNS/certbot

    # Observability
    SENTRY_DSN: str = ""
    ENVIRONMENT: str = "development"

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    
    # Telegram Support Bot (optional - used by support router)
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_ADMIN_ID: str = ""
    OAUTH_REDIRECT_BASE: str = "https://viably.dev"
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # "json" for production, "console" for development

    # AI Gateway (OAT token proxy)
    ai_gateway_url: str = ""
    ai_gateway_key: str = ""

    # Hetzner worker nodes
    HETZNER_API_TOKEN: str = ""
    MAX_DEPLOYS_PER_NODE: int = 20

    @model_validator(mode="after")
    def validate_cors_origins(self):
        """Validate CORS_ORIGINS configuration based on environment."""
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",")]
        all_localhost = all("localhost" in o or "127.0.0.1" in o for o in origins)

        if self.ENVIRONMENT == "production" and all_localhost:
            raise ValueError(
                "CORS_ORIGINS contains only localhost values in production. "
                "Set CORS_ORIGINS to include production domains (e.g., https://viably.dev)."
            )

        if not self.DEBUG and all_localhost:
            logger.warning(
                "CORS_ORIGINS contains only localhost values in non-debug mode. "
                "Set CORS_ORIGINS environment variable to include production domains."
            )
        return self


settings = Settings()
