"""Deployment service with business logic."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import validate_deployment_url
from app.deploy.models import Deployment
from app.deploy.railway import get_railway_client
from app.deploy.schemas import DeploymentCreate, DeploymentStatus
from app.projects.models import Project, ProjectStatus

logger = logging.getLogger(__name__)


class DeploymentService:
    """Service for managing deployments."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def deploy_project(
        self,
        project_id: UUID,
        user_id: UUID,
        data: DeploymentCreate,
    ) -> Deployment:
        """
        Deploy a project to Railway.

        Steps:
        1. Validate project (must be ready, owned by user)
        2. Create Railway project
        3. Create service
        4. Set environment variables
        5. Deploy code
        6. Poll status
        7. Update deployment record
        """
        # Get project with ownership check
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user_id,
            )
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError("Project not found")

        if project.status != ProjectStatus.READY.value:
            raise ValueError("Project must be in 'ready' status to deploy")

        if not project.generated_code:
            raise ValueError("No generated code to deploy")

        # Create deployment record
        deployment = Deployment(
            project_id=project_id,
            platform=data.platform.value,
            status=DeploymentStatus.PENDING.value,
        )
        self.db.add(deployment)
        await self.db.commit()
        await self.db.refresh(deployment)

        try:
            # Update project status
            project.status = ProjectStatus.DEPLOYING.value
            await self.db.commit()

            # Create Railway project
            project_name = f"viably-{project.name[:20]}-{str(project_id)[:8]}"
            railway = get_railway_client()
            railway_project = await railway.create_project(name=project_name)

            deployment.platform_data = {
                "railway_project_id": railway_project["id"]
            }
            await self.db.commit()

            # Create service
            service = await railway.create_service(
                project_id=railway_project["id"],
                name="bot",
            )

            deployment.platform_data["railway_service_id"] = service["id"]
            deployment.status = DeploymentStatus.BUILDING.value
            await self.db.commit()

            # Set environment variables
            await railway.set_env_variables(
                project_id=railway_project["id"],
                service_id=service["id"],
                env_vars=data.env_variables,
            )

            # Deploy code
            deploy_result = await railway.deploy_from_source(
                project_id=railway_project["id"],
                service_id=service["id"],
                source_code=project.generated_code.get("files", {}),
            )

            deployment.external_id = deploy_result["id"]
            deployment.status = DeploymentStatus.DEPLOYING.value
            await self.db.commit()

            # Poll status
            url = await self._poll_deployment_status(
                deployment_id=deployment.id,
                railway_deployment_id=deploy_result["id"],
                service_id=service["id"],
            )

            # Update final status
            deployment.url = url
            deployment.status = DeploymentStatus.ACTIVE.value
            deployment.deployed_at = datetime.now(timezone.utc)

            project.status = ProjectStatus.DEPLOYED.value
            project.deployed_url = url
            project.deployed_at = datetime.now(timezone.utc)

            await self.db.commit()
            await self.db.refresh(deployment)

            return deployment

        except Exception as e:
            logger.error("Deployment failed: %s", e)

            deployment.status = DeploymentStatus.FAILED.value
            deployment.error_message = "Deployment failed"
            project.status = ProjectStatus.ERROR.value
            project.error_message = "Deployment failed"

            await self.db.commit()
            raise

    async def _poll_deployment_status(
        self,
        deployment_id: UUID,
        railway_deployment_id: str,
        service_id: str,
    ) -> str:
        """Poll Railway for deployment status until complete or timeout."""
        railway = get_railway_client()
        timeout = settings.DEPLOYMENT_TIMEOUT_SECONDS
        interval = settings.DEPLOYMENT_POLL_INTERVAL_SECONDS
        elapsed = 0

        while elapsed < timeout:
            status = await railway.get_deployment_status(
                railway_deployment_id
            )

            if status["status"] == "SUCCESS":
                # Get URL
                url = await railway.get_service_domain(service_id)
                return f"https://{url}" if url else status.get("url", "")

            if status["status"] == "FAILED":
                raise Exception("Deployment failed on Railway")

            await asyncio.sleep(interval)
            elapsed += interval

        raise Exception("Deployment timed out")

    async def get_deployment(
        self,
        deployment_id: UUID,
        user_id: UUID,
    ) -> Optional[Deployment]:
        """Get deployment by ID with ownership check."""
        result = await self.db.execute(
            select(Deployment)
            .join(Project)
            .where(
                Deployment.id == deployment_id,
                Project.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_deployment_logs(
        self,
        deployment_id: UUID,
        user_id: UUID,
    ) -> str:
        """Get deployment logs from Railway."""
        deployment = await self.get_deployment(deployment_id, user_id)

        if not deployment or not deployment.external_id:
            return ""

        return await get_railway_client().get_deployment_logs(deployment.external_id)

    async def stop_deployment(
        self,
        deployment_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Stop and delete deployment."""
        deployment = await self.get_deployment(deployment_id, user_id)

        if not deployment:
            return False

        try:
            if (
                deployment.platform_data
                and "railway_project_id" in deployment.platform_data
            ):
                await get_railway_client().delete_project(
                    deployment.platform_data["railway_project_id"]
                )

            deployment.status = DeploymentStatus.STOPPED.value
            await self.db.commit()

            return True

        except Exception as e:
            logger.error("Failed to stop deployment: %s", e)
            raise

    async def check_health(self, deployment_id: UUID) -> bool:
        """Check deployment health by making HTTP request to URL."""
        result = await self.db.execute(
            select(Deployment).where(Deployment.id == deployment_id)
        )
        deployment = result.scalar_one_or_none()

        if not deployment or not deployment.url:
            return False

        # Validate URL to prevent SSRF attacks
        if not validate_deployment_url(deployment.url):
            logger.warning(
                "Invalid deployment URL detected for %s: %s",
                deployment_id,
                deployment.url,
            )
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    deployment.url,
                    timeout=settings.HEALTH_CHECK_TIMEOUT_SECONDS
                )
                healthy = response.status_code < 500

                deployment.last_health_check = datetime.now(timezone.utc)
                await self.db.commit()

                return healthy

        except Exception as e:
            logger.warning("Health check failed for deployment %s: %s", deployment_id, e)
            return False
