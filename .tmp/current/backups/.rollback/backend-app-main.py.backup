"""FastAPI application entry point."""

import uuid
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter

from app.ai.routes import router as ai_router
from app.auth.routes import router as auth_router
from app.core.config import settings
from app.core.redis import close_redis
from app.credits.cron import start_scheduler, stop_scheduler
from app.credits.routes import router as credits_router
from app.deploy.routes import router as deploy_router
from app.projects.routes import router as projects_router
from app.templates.routes import router as templates_router
from app.users.routes import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
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
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
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
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
