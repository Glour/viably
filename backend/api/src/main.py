"""FastAPI application entry point."""

import uuid
from contextlib import asynccontextmanager

import redis.asyncio as redis
import sentry_sdk
import structlog
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from sqlalchemy import text
from structlog.contextvars import bind_contextvars, clear_contextvars

from api.src.auth.routes import router as auth_router
from api.src.auth.oauth import router as oauth_router
from api.src.conversations.routes import router as conversations_router
from settings.config import settings
from infrastructure.database.setup import async_session_maker
from settings.logging_config import setup_logging
from core.redis import close_redis, get_redis
from api.src.credits.cron import start_scheduler, stop_scheduler
from api.src.credits.routes import router as credits_router
from api.src.payments.routes import router as payments_router
# STRIPE DISABLED: from api.src.payments.stripe_routes import router as stripe_router
from api.src.payments.crypto_routes import router as crypto_router
from api.src.emails.routes import router as emails_router
from api.src.projects.routes import router as projects_router
from api.src.templates.routes import router as templates_router
from api.src.users.routes import router as users_router
from api.src.ws.conversation_ws import router as conversation_ws_router
from api.src.ws.routes import router as ws_router
from api.src.deploy.routes import router as deploy_router
from api.src.github.routes import router as github_router
from api.src.support.router import router as support_router
from api.src.admin.routes import router as admin_router

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

    # Startup: reset any stuck deploying projects (from previous crash/restart)
    try:
        from infrastructure.database.setup import async_session_maker
        from sqlalchemy import text
        async with async_session_maker() as db:
            result = await db.execute(text(
                "UPDATE projects SET status = 'error' WHERE status = 'deploying' "                "RETURNING id"
            ))
            stuck = result.fetchall()
            if stuck:
                await db.execute(text(
                    "UPDATE deployments SET status = 'failed', error_message = 'Server restarted during deployment' "                    "WHERE project_id = ANY(:ids) AND status IN ('pending', 'building')"                ), {"ids": [str(r[0]) for r in stuck]})
                await db.commit()
                logger.info("startup_cleanup", stuck_deployments=len(stuck))
    except Exception as startup_err:
        logger.warning("startup_cleanup_failed", error=str(startup_err))

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
    docs_url="/api-docs" if settings.DEBUG else None,
    redoc_url="/api-redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    # RateLimiter moved to individual routes (breaks WebSocket)
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
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        logger.error("middleware_exception", error=str(e), path=request.url.path)
        raise


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    try:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response
    except Exception as e:
        logger.error("security_middleware_exception", error=str(e), path=request.url.path)
        raise


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and log them."""
    logger.error("unhandled_exception", error=str(exc), path=str(request.url), type=type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(oauth_router, prefix="/api/auth", tags=["oauth"])
app.include_router(conversations_router, prefix="/api/conversations", tags=["conversations"])
app.include_router(credits_router, prefix="/api/credits", tags=["credits"])
app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
# STRIPE DISABLED: app.include_router(stripe_router, prefix="/api", tags=["stripe"])
app.include_router(crypto_router, prefix="/api/crypto", tags=["crypto"])
app.include_router(emails_router, prefix="/api/emails", tags=["emails"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(templates_router, prefix="/api/templates", tags=["templates"])  # BEFORE deploy wildcard routes!
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(deploy_router, prefix="/api", tags=["deployments"])
app.include_router(github_router, prefix="/api", tags=["github"])
app.include_router(support_router)  # Support API with prefix in router definition
app.include_router(admin_router)  # Admin API (OAuth pool + audit logs)
app.include_router(conversation_ws_router)  # WebSocket conversations — MUST be before generic ws
app.include_router(ws_router)  # WebSocket per-user channel for deploy/generation progress


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
    except Exception as e:
        logger.error("health_check_db_error", error=str(e))
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
