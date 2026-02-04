"""FastAPI application entry point."""

from fastapi import FastAPI

from app.auth.routes import router as auth_router
from app.templates.routes import router as templates_router
from app.users.routes import router as users_router

app = FastAPI(
    title="Viably API",
    description="Backend API for Viably application",
    version="0.1.0",
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(templates_router, prefix="/api/templates", tags=["templates"])
app.include_router(users_router, prefix="/api/users", tags=["users"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
