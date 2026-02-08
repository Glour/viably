"""FastAPI application entry point."""

import uuid
from contextlib import asynccontextmanager

import redis.asyncio as redis
import sentry_sdk
import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from sqlalchemy import text
from structlog.contextvars import bind_contextvars, clear_contextvars

from app.ai.routes import router as ai_router
from app.auth.routes import router as auth_router
from app.core.config import settings
from app.core.database import async_session_maker
from app.core.logging_config import setup_logging
from app.core.redis import close_redis, get_redis
from app.credits.cron import start_scheduler, stop_scheduler
from app.credits.routes import router as credits_router
from app.deploy.routes import router as deploy_router
from app.projects.routes import router as projects_router
from app.templates.routes import router as templates_router
from app.users.routes import router as users_router

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Configure structured logging first
    setup_logging()

    # Initialize Sentry (only if DSN is configured)
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            enable_tracing=True,
        )
        logger.info("sentry_initialized", environment=settings.ENVIRONMENT)

    # Startup
    start_scheduler()

    # Initialize rate limiter with Redis
    redis_connection = redis.from_url(
        settings.CELERY_BROKER_URL,
        encoding="utf8",
        decode_responses=True
    )
    await FastAPILimiter.init(redis_connection, prefix="ratelimit")

    yield

    # Shutdown
    await FastAPILimiter.close()
    await close_redis()
    stop_scheduler()


app = FastAPI(
    title="Viably API",
    description="Backend API for Viably application",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)


# CORS middleware configuration
allowed_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# Request ID middleware for log correlation
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to all requests and responses for log correlation."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    clear_contextvars()
    bind_contextvars(request_id=request_id)
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response


# Include routers
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(credits_router, prefix="/api/credits", tags=["credits"])
app.include_router(deploy_router, prefix="/api", tags=["deployments"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(templates_router, prefix="/api/templates", tags=["templates"])
app.include_router(users_router, prefix="/api/users", tags=["users"])


@app.get("/health")
async def health_check() -> JSONResponse:
    """Health check endpoint with database and Redis connectivity checks."""
    checks: dict[str, str] = {}
    healthy = True

    # Database check
    try:
        async with async_session_maker() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception:
        checks["database"] = "error"
        healthy = False

    # Redis check
    try:
        redis_client = await get_redis()
        await redis_client.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "error"
        healthy = False

    status_code = 200 if healthy else 503
    return JSONResponse(
        content={"status": "healthy" if healthy else "unhealthy", **checks},
        status_code=status_code,
    )
