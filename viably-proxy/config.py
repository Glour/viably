from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    REDIS_URL: str = "redis://redis:6379/2"
    ANTHROPIC_API_BASE: str = "https://api.anthropic.com"
    PRODUCT_KEY: str = ""
    ADMIN_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
