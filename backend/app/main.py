"""FastAPI application entry point."""

from fastapi import FastAPI

from app.auth.routes import router as auth_router

app = FastAPI(
    title="Viably API",
    description="Backend API for Viably application",
    version="0.1.0",
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
