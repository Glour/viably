"""FastAPI routes for deploy module."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi_limiter.depends import RateLimiter
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.auth.deps import get_current_user
from infrastructure.database.models.auth import User
from infrastructure.database.setup import get_db
from api.src.deploy.schemas import (
    CustomDomainSet,
    CustomDomainVerifyResponse,
    DeploymentCreate,
    DeploymentLogsResponse,
    DeploymentResponse,
)
from api.src.deploy.service import DeploymentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="", tags=["deployments"])


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
    """Deploy a project."""
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


# ─── Custom Domain endpoints ───────────────────────────────────────────────


@router.get(
    "/projects/{project_id}/domain/verify",
    response_model=CustomDomainVerifyResponse,
    dependencies=[Depends(RateLimiter(times=10, minutes=1))],
)
async def verify_domain_dns(
    project_id: UUID,
    domain: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CustomDomainVerifyResponse:
    """Check that the user's domain has a CNAME record pointing to their viably.dev subdomain."""
    service = DeploymentService(db)
    result = await service.verify_custom_domain_dns(project_id, current_user.id, domain)
    return CustomDomainVerifyResponse(**result)


@router.post(
    "/projects/{project_id}/domain",
    response_model=DeploymentResponse,
    dependencies=[Depends(RateLimiter(times=5, minutes=5))],
)
async def set_custom_domain(
    project_id: UUID,
    data: CustomDomainSet,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Attach a custom domain to the active website deployment of this project."""
    service = DeploymentService(db)
    try:
        deployment = await service.set_custom_domain(project_id, current_user.id, data.domain)
        return deployment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.exception("Failed to set custom domain: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to attach custom domain. Please try again.",
        )


@router.delete(
    "/projects/{project_id}/domain",
    response_model=DeploymentResponse,
    dependencies=[Depends(RateLimiter(times=5, minutes=5))],
)
async def remove_custom_domain(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeploymentResponse:
    """Remove the custom domain from this project's deployment."""
    service = DeploymentService(db)
    try:
        deployment = await service.remove_custom_domain(project_id, current_user.id)
        return deployment
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.exception("Failed to remove custom domain: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove custom domain.",
        )
