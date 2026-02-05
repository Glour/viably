"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.ai.routes import router as ai_router
from app.auth.routes import router as auth_router
from app.credits.cron import start_scheduler, stop_scheduler
from app.credits.routes import router as credits_router
from app.projects.routes import router as projects_router
from app.templates.routes import router as templates_router
from app.users.routes import router as users_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager."""
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="Viably API",
    description="Backend API for Viably application",
    version="0.1.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(credits_router, prefix="/api/credits", tags=["credits"])
app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
app.include_router(templates_router, prefix="/api/templates", tags=["templates"])
app.include_router(users_router, prefix="/api/users", tags=["users"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
