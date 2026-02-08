"""FastAPI routes for deploy module."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_user
from app.auth.models import User
from app.core.database import get_db
from app.deploy.schemas import (
    DeploymentCreate,
    DeploymentLogsResponse,
    DeploymentResponse,
)
from app.deploy.service import DeploymentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.post(
    "/projects/{project_id}/deploy",
    response_model=DeploymentResponse,
    dependencies=[Depends(RateLimiter(times=3, minutes=1))],
)
async def deploy_project(
    project_id: UUID,
    data: DeploymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Deploy a project to Railway."""
    service = DeploymentService(db)

    try:
        deployment = await service.deploy_project(
            project_id, current_user.id, data
        )
        return deployment
    except ValueError as e:
        logger.error("Deployment validation error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid deployment configuration. Please check your settings.",
        )
    except Exception as e:
        logger.exception("Deployment failed for project %s: %s", project_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Deployment failed. Please try again or contact support.",
        )


@router.get(
    "/{deployment_id}",
    response_model=DeploymentResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_deployment(
    deployment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Get deployment status."""
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    return deployment


@router.get(
    "/{deployment_id}/logs",
    response_model=DeploymentLogsResponse,
    dependencies=[Depends(RateLimiter(times=30, minutes=1))],
)
async def get_deployment_logs(
    deployment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentLogsResponse:
    """Get deployment logs."""
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    logs = await service.get_deployment_logs(deployment_id, current_user.id)

    return DeploymentLogsResponse(
        deployment_id=deployment_id,
        logs=logs,
        status=deployment.status,
    )


@router.delete(
    "/{deployment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def stop_deployment(
    deployment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Stop and delete deployment."""
    service = DeploymentService(db)
    stopped = await service.stop_deployment(deployment_id, current_user.id)

    if not stopped:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )
