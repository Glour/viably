"""Enhanced health check endpoint for production monitoring."""

import datetime
import os
import platform
import shutil
import time
from typing import Dict

import httpx
import psutil
import structlog
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from redis.asyncio import Redis
from sqlalchemy import text

from app.core.config import settings
from app.core.database import async_session_maker
from app.core.redis import get_redis

logger = structlog.get_logger(__name__)

# Store application start time
START_TIME = time.time()

router = APIRouter()


async def check_database() -> Dict[str, str]:
    """Check PostgreSQL database connectivity."""
    try:
        async with async_session_maker() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
        return {"status": "ok", "message": "Connected"}
    except Exception as e:
        logger.error("database_health_check_failed", error=str(e))
        return {"status": "error", "message": str(e)[:100]}


async def check_redis() -> Dict[str, str]:
    """Check Redis connectivity."""
    try:
        redis_client: Redis = await get_redis()
        await redis_client.ping()
        return {"status": "ok", "message": "Connected"}
    except Exception as e:
        logger.error("redis_health_check_failed", error=str(e))
        return {"status": "error", "message": str(e)[:100]}


def check_disk_space() -> Dict[str, str]:
    """Check disk space availability (must be > 10% free)."""
    try:
        disk = shutil.disk_usage("/")
        free_percent = (disk.free / disk.total) * 100
        
        if free_percent < 10:
            return {
                "status": "warning",
                "message": f"Low disk space: {free_percent:.1f}% free"
            }
        
        return {
            "status": "ok",
            "message": f"{free_percent:.1f}% free ({disk.free // (1024**3)} GB)"
        }
    except Exception as e:
        logger.error("disk_health_check_failed", error=str(e))
        return {"status": "error", "message": str(e)[:100]}


def check_memory() -> Dict[str, str]:
    """Check memory usage (must be < 90%)."""
    try:
        memory = psutil.virtual_memory()
        used_percent = memory.percent
        
        if used_percent > 90:
            return {
                "status": "warning",
                "message": f"High memory usage: {used_percent:.1f}%"
            }
        
        return {
            "status": "ok",
            "message": f"{used_percent:.1f}% used ({memory.used // (1024**3)} GB / {memory.total // (1024**3)} GB)"
        }
    except Exception as e:
        logger.error("memory_health_check_failed", error=str(e))
        return {"status": "error", "message": str(e)[:100]}


async def check_github_api() -> Dict[str, str]:
    """Check GitHub API availability."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://api.github.com")
            
            if response.status_code == 200:
                return {"status": "ok", "message": f"Status {response.status_code}"}
            else:
                return {
                    "status": "warning",
                    "message": f"Unexpected status: {response.status_code}"
                }
    except Exception as e:
        logger.error("github_api_health_check_failed", error=str(e))
        return {"status": "error", "message": str(e)[:100]}


async def check_anthropic_api() -> Dict[str, str]:
    """Check Anthropic API availability (simple connectivity check)."""
    try:
        # Just check if we can reach the API endpoint
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Anthropic API returns 401 for unauthorized requests, which is expected
            response = await client.get(
                "https://api.anthropic.com/v1/messages",
                headers={"anthropic-version": "2023-06-01"}
            )
            
            # 401 or 400 means API is reachable
            if response.status_code in [400, 401, 403]:
                return {"status": "ok", "message": "API reachable"}
            else:
                return {
                    "status": "warning",
                    "message": f"Unexpected status: {response.status_code}"
                }
    except Exception as e:
        logger.error("anthropic_api_health_check_failed", error=str(e))
        return {"status": "error", "message": str(e)[:100]}


@router.get("/health")
@router.get("/api/health")
async def health_check() -> JSONResponse:
    """
    Comprehensive health check endpoint.
    
    Returns:
        - status: overall health (healthy/degraded/unhealthy)
        - timestamp: current UTC time
        - version: application version
        - uptime: seconds since startup
        - checks: individual component statuses
    """
    # Run all health checks
    db_check = await check_database()
    redis_check = await check_redis()
    disk_check = check_disk_space()
    memory_check = check_memory()
    github_check = await check_github_api()
    anthropic_check = await check_anthropic_api()
    
    checks = {
        "database": db_check,
        "redis": redis_check,
        "disk": disk_check,
        "memory": memory_check,
        "github_api": github_check,
        "anthropic_api": anthropic_check,
    }
    
    # Determine overall status
    error_count = sum(1 for c in checks.values() if c["status"] == "error")
    warning_count = sum(1 for c in checks.values() if c["status"] == "warning")
    
    if error_count > 0:
        overall_status = "unhealthy"
        status_code = 503
    elif warning_count > 0:
        overall_status = "degraded"
        status_code = 200
    else:
        overall_status = "healthy"
        status_code = 200
    
    # Calculate uptime
    uptime_seconds = int(time.time() - START_TIME)
    
    response_data = {
        "status": overall_status,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0-beta",
        "environment": settings.ENVIRONMENT,
        "uptime": uptime_seconds,
        "uptime_human": str(datetime.timedelta(seconds=uptime_seconds)),
        "hostname": platform.node(),
        "checks": checks,
    }
    
    # Log health check results
    logger.info(
        "health_check_completed",
        status=overall_status,
        errors=error_count,
        warnings=warning_count,
    )
    
    return JSONResponse(content=response_data, status_code=status_code)
