"""Deployment service with Docker-based deployments."""

import asyncio
import socket
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.src.ai.core.validators import OutputValidator
from api.src.deploy.schemas import DeploymentCreate, DeploymentStatus
from infrastructure.database.models.auth import User
from infrastructure.database.models.deploy import Deployment
from infrastructure.database.models.projects import Project, ProjectStatus
from infrastructure.services.docker_deploy import DockerDeployClient
from infrastructure.services.website_deploy import DOMAIN as VIABLY_DOMAIN
from infrastructure.services.website_deploy import WebsiteDeployClient
from settings.config import settings
from settings.security import validate_deployment_url
from core.pubsub import publish_deploy_progress, publish_deploy_complete, publish_deploy_error

logger = structlog.get_logger(__name__)


class DeploymentService:
    """Service for managing deployments via Docker."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.docker = DockerDeployClient()
        self.website = WebsiteDeployClient()

    async def _restore_env_from_previous(
        self, project_id: UUID, env_vars: dict[str, str]
    ) -> dict[str, str]:
        """Merge env vars from last successful deploy when user omits them on redeploy."""
        from api.src.deploy.tasks import _PERSISTABLE_ENV_KEYS

        has_token = bool(env_vars.get("TELEGRAM_BOT_TOKEN"))
        has_db_url = bool(env_vars.get("DATABASE_URL"))
        if has_token and has_db_url:
            return env_vars

        try:
            result = await self.db.execute(
                select(Deployment)
                .where(
                    Deployment.project_id == project_id,
                    Deployment.status == "active",
                )
                .order_by(Deployment.deployed_at.desc())
                .limit(1)
            )
            prev = result.scalar_one_or_none()
            if not prev or not prev.platform_data:
                return env_vars

            saved = prev.platform_data.get("saved_env", {})
            if not saved:
                return env_vars

            merged = dict(env_vars)
            for key in _PERSISTABLE_ENV_KEYS:
                if not merged.get(key) and saved.get(key):
                    merged[key] = saved[key]
            return merged
        except Exception as e:
            logger.warning("Failed to restore env vars: %s", e)
            return env_vars

    async def deploy_project(
        self,
        project_id: UUID,
        user_id: UUID,
        data: DeploymentCreate,
    ) -> Deployment:
        """Deploy a project as a Docker container."""
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

        # Check deploy limits by user plan
        from infrastructure.database.repositories.deployment_repository import (
            DeploymentRepository,
        )
        from settings.constants import get_deploy_limit

        user_result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            deploy_limit = get_deploy_limit(user.plan)
            if deploy_limit is not None:  # None = unlimited
                deploy_repo = DeploymentRepository(self.db)
                active_count = await deploy_repo.count_active_by_user(user_id)
                if active_count >= deploy_limit:
                    raise ValueError(
                        f"Лимит деплоев достигнут ({active_count}/{deploy_limit}). "
                        f"Обновите план для увеличения лимита."
                    )

        deployable_statuses = (
            ProjectStatus.READY.value,
            ProjectStatus.DEPLOYED.value,
            ProjectStatus.ERROR.value,
        )
        if project.status not in deployable_statuses:
            raise ValueError(f"Project must be in 'ready', 'deployed', or 'error' status to deploy, got '{project.status}'")

        if not project.generated_code:
            raise ValueError("No generated code to deploy")

        # Create deployment record
        deployment = Deployment(
            project_id=project_id,
            platform="website" if (data.env_variables or {}).get("DEPLOY_TYPE") == "website" else "docker",
            status=DeploymentStatus.PENDING.value,
        )
        self.db.add(deployment)
        await self.db.commit()
        await self.db.refresh(deployment)

        try:
            # Update project status
            project.status = ProjectStatus.DEPLOYING.value
            await self.db.commit()

            # Update deployment status
            deployment.status = DeploymentStatus.BUILDING.value
            await self.db.commit()

            # WS progress: step 1 — Validation
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=1, step_name="Валидация проекта", step_status="running", progress=5,
            )

            # Extract code info
            generated = project.generated_code
            files = generated.get("files", {})
            runtime = generated.get("runtime", "python")
            entry_point = generated.get("entry_point", "main.py")

            # Auto-detect React/Vite webapp
            has_package_json = "package.json" in files
            has_vite_config = "vite.config.ts" in files or "vite.config.js" in files
            has_tsx_files = any(f.endswith(".tsx") for f in files)
            if has_package_json and (has_vite_config or has_tsx_files):
                runtime = "webapp"

            # Pre-deploy validation
            validator = OutputValidator()
            files_dict = {f: content for f, content in files.items()}
            fixed_files, validation_result = validator.validate_and_fix(files_dict)

            if not validation_result.passed and validation_result.errors:
                logger.warning(
                    "pre_deploy_validation_issues",
                    errors=len(validation_result.errors),
                    warnings=len(validation_result.warnings),
                    auto_fixed=validation_result.auto_fixed_count,
                )
                # Update project with fixed files
                project.generated_code["files"] = fixed_files

            if validation_result.auto_fixed_count > 0:
                logger.info(
                    "pre_deploy_auto_fixed",
                    count=validation_result.auto_fixed_count,
                )
                # Ensure fixed files are used for deployment
                files = project.generated_code.get("files", files)

            # WS progress: step 1 complete, step 2 start
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=1, step_name="Валидация проекта", step_status="complete", progress=15,
            )
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=2, step_name="Подготовка файлов", step_status="running", progress=20,
            )

            # Check if this is a website deployment
            env_vars = data.env_variables or {}
            # Restore token/DB URL from previous deploy if not provided
            env_vars = await self._restore_env_from_previous(project_id, env_vars)
            is_website = env_vars.get("DEPLOY_TYPE") == "website"

            # Auto-provision database for bots that need it
            if (
                not is_website
                and not env_vars.get("DATABASE_URL")
                and self.docker._project_needs_database(files)
            ):
                try:
                    logger.info(
                        "auto_provisioning_database",
                        project_id=str(project_id),
                    )
                    db_info = await self.docker.provision_database(
                        str(project_id)
                    )
                    env_vars["DATABASE_URL"] = db_info["database_url"]
                    # Also set individual POSTGRES__ vars for pydantic-settings
                    env_vars["POSTGRES__DB_HOST"] = db_info["db_host"]
                    env_vars["POSTGRES__DB_PORT"] = str(db_info["db_port"])
                    env_vars["POSTGRES__DB_USER"] = db_info["db_user"]
                    env_vars["POSTGRES__DB_NAME"] = db_info["db_name"]
                    logger.info(
                        "database_provisioned",
                        db_name=db_info["db_name"],
                    )
                except Exception as db_error:
                    logger.error(
                        "database_provisioning_failed",
                        error=str(db_error),
                    )
                    # Don't block deploy — bot may work without DB
                    # or user can redeploy with manual DATABASE_URL

            # WS progress: step 2 complete, step 3 start
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=2, step_name="Подготовка файлов", step_status="complete", progress=30,
            )
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=3, step_name="Сборка Docker-образа", step_status="running", progress=35,
            )

            if is_website:
                subdomain = env_vars.get("SUBDOMAIN", str(project_id)[:8])
                result = await self.website.deploy(
                    project_id=str(project_id),
                    files=files,
                    subdomain=subdomain,
                )
            else:
                # Deploy via Docker
                result = await self.docker.deploy(
                    project_id=str(project_id),
                    files=files,
                    runtime=runtime,
                    entry_point=entry_point,
                    env_vars=env_vars,
                )

            # WS progress: step 3 complete, step 4 start
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=3, step_name="Сборка Docker-образа", step_status="complete", progress=65,
            )
            publish_deploy_progress(
                str(user_id), str(project_id),
                step=4, step_name="Запуск контейнера", step_status="running", progress=70,
            )

            # Self-heal: persist fixed files
            if result.get("files_fixed") and result.get("fixed_files"):
                if project.generated_code:
                    project.generated_code["files"] = result["fixed_files"]
                    await self.db.commit()

            if result["status"] == "failed":
                deployment.status = DeploymentStatus.FAILED.value
                deployment.error_message = result.get("error", "Deployment failed")
                deployment.logs = result.get("logs", "")
                project.status = ProjectStatus.ERROR.value
                project.error_message = "Deployment failed"
                await self.db.commit()
                await self.db.refresh(deployment)
                return deployment

            # Success - use appropriate URL based on deployment type
            if is_website:
                deploy_url = result.get("url", "")
                deployment.external_id = result.get("subdomain", "")
            else:
                host_ip = settings.CORS_ORIGINS.split(",")[0].split("//")[1].split(":")[0]
                deploy_url = f"http://{host_ip}:{result['port']}"
                deployment.external_id = result.get("container_id", "")
            
            deployment.url = deploy_url
            deployment.status = DeploymentStatus.ACTIVE.value
            deployment.deployed_at = datetime.now(timezone.utc)
            from api.src.deploy.tasks import _env_vars_to_save
            deployment.platform_data = {
                "container_name": result.get("container_name"),
                "port": result.get("port"),
                "image": result.get("image"),
                "saved_env": _env_vars_to_save(env_vars),
            }

            project.status = ProjectStatus.DEPLOYED.value
            project.deployed_url = deploy_url
            project.deploy_platform = "docker"
            project.deployed_at = datetime.now(timezone.utc)

            await self.db.commit()
            await self.db.refresh(deployment)

            # Send deployment success email
            try:
                from api.celery_tasks.email_tasks import send_template_email_task

                user_result = await self.db.execute(
                    select(User).where(User.id == project.user_id)
                )
                user = user_result.scalar_one_or_none()

                if user:
                    base_url = settings.CORS_ORIGINS.split(",")[0]
                    send_template_email_task.delay(
                        template_name="deploy-success",
                        email_type="deploy_success",
                        recipient=user.email,
                        subject=f"Your bot '{project.name}' is live! 🚀",
                        template_props={
                            "userName": user.full_name or user.email.split("@")[0],
                            "projectName": project.name,
                            "deploymentUrl": deploy_url,
                            "platform": "website" if is_website else "docker",
                            "deployedAt": datetime.now(timezone.utc).isoformat(),
                            "projectUrl": f"{base_url}/projects/{project.id}",
                        },
                        user_id=str(user.id),
                    )
            except Exception as email_error:
                logger.error("Failed to queue deployment email: %s", email_error)

            # WS: send deploy_complete
            try:
                publish_deploy_progress(str(user_id), str(project_id), step=4, step_name="Запуск контейнера", step_status="complete", progress=85)
                publish_deploy_progress(str(user_id), str(project_id), step=5, step_name="Проверка работоспособности", step_status="complete", progress=95)
                publish_deploy_progress(str(user_id), str(project_id), step=6, step_name="Финализация", step_status="complete", progress=100)
                publish_deploy_complete(
                    str(user_id), str(project_id),
                    deployment_info={
                        "platform": deployment.platform,
                        "url": deploy_url,
                        "botUrl": deploy_url if not is_website else None,
                        "botUsername": result.get("bot_username"),
                        "status": "running",
                        "deployedAt": deployment.deployed_at.isoformat() if deployment.deployed_at else None,
                    },
                )
            except Exception as ws_err:
                logger.error("Failed to publish deploy_complete via WS: %s", ws_err)

            return deployment

        except Exception as e:
            try:
                publish_deploy_error(str(user_id), str(project_id), str(e))
            except Exception:
                pass
            logger.error("Deployment failed: %s", e)
            deployment.status = DeploymentStatus.FAILED.value
            deployment.error_message = str(e)[:500]
            project.status = ProjectStatus.ERROR.value
            project.error_message = "Deployment failed"
            await self.db.commit()
            raise

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
        """Get deployment logs from Docker."""
        deployment = await self.get_deployment(deployment_id, user_id)

        if not deployment:
            return ""

        if deployment.platform == "website":
            return "Website deployments do not have container logs."

        project_id = str(deployment.project_id)
        return await self.docker.get_logs(project_id)

    async def stop_deployment(
        self,
        deployment_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Stop and remove deployment."""
        deployment = await self.get_deployment(deployment_id, user_id)

        if not deployment:
            return False

        try:
            project_id = str(deployment.project_id)

            if deployment.platform == "website":
                # Website deployment: remove nginx config and site files
                subdomain = deployment.external_id or project_id[:8]
                await self.website.stop(project_id, subdomain=subdomain)
            else:
                # Docker deployment: stop container and clean up database
                await self.docker.stop(project_id)
                try:
                    await self.docker.drop_database(project_id)
                except Exception as db_err:
                    logger.warning(
                        "database_cleanup_failed",
                        project_id=project_id,
                        error=str(db_err),
                    )

            deployment.status = DeploymentStatus.STOPPED.value
            await self.db.commit()
            return True

        except Exception as e:
            logger.error("Failed to stop deployment: %s", e)
            raise

    async def verify_custom_domain_dns(
        self,
        project_id: UUID,
        user_id: UUID,
        domain: str,
    ) -> dict:
        """Check that domain has a CNAME pointing to the expected viably.dev subdomain."""
        # Find the active website deployment for this project
        result = await self.db.execute(
            select(Deployment)
            .join(Project)
            .where(
                Project.id == project_id,
                Project.user_id == user_id,
                Deployment.status == DeploymentStatus.ACTIVE.value,
            )
            .order_by(Deployment.created_at.desc())
        )
        deployment = result.scalars().first()

        if not deployment:
            return {
                "domain": domain,
                "verified": False,
                "cname_found": None,
                "expected_cname": f"<subdomain>.{VIABLY_DOMAIN}",
                "message": "No active deployment found for this project",
            }

        # Derive expected CNAME from deployment URL
        # e.g. https://mysite.viably.dev → mysite.viably.dev
        expected_cname = deployment.url.replace("https://", "").replace("http://", "") if deployment.url else f"<subdomain>.{VIABLY_DOMAIN}"

        # DNS CNAME lookup
        cname_found = None
        try:
            loop = asyncio.get_event_loop()
            answers = await loop.run_in_executor(
                None,
                lambda: socket.getaddrinfo(domain, None)
            )
            # Also try to resolve CNAME via low-level DNS
            import subprocess
            proc = await asyncio.create_subprocess_exec(
                "dig", "+short", "CNAME", domain,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=10)
            cname_raw = stdout.decode().strip().rstrip(".")
            if cname_raw:
                cname_found = cname_raw
        except Exception as e:
            logger.warning("DNS lookup failed for %s: %s", domain, e)

        verified = cname_found is not None and (
            cname_found == expected_cname
            or cname_found.endswith(f".{VIABLY_DOMAIN}")
        )

        return {
            "domain": domain,
            "verified": verified,
            "cname_found": cname_found,
            "expected_cname": expected_cname,
            "message": (
                "DNS verified successfully" if verified
                else f"CNAME not found or incorrect. Set CNAME {domain} → {expected_cname}"
            ),
        }

    async def set_custom_domain(
        self,
        project_id: UUID,
        user_id: UUID,
        domain: str,
    ) -> Deployment:
        """Attach a custom domain to the active website deployment."""
        result = await self.db.execute(
            select(Deployment)
            .join(Project)
            .where(
                Project.id == project_id,
                Project.user_id == user_id,
                Deployment.status == DeploymentStatus.ACTIVE.value,
            )
            .order_by(Deployment.created_at.desc())
        )
        deployment = result.scalars().first()

        if not deployment:
            raise ValueError("No active website deployment found")

        if deployment.platform not in ("website", "docker"):
            raise ValueError("Custom domains are only supported for website deployments")

        # Get subdomain from external_id or URL
        subdomain = deployment.external_id
        if not subdomain and deployment.url:
            # Extract from https://mysite.viably.dev
            subdomain = deployment.url.replace("https://", "").split(f".{VIABLY_DOMAIN}")[0]

        if not subdomain:
            raise ValueError("Cannot determine subdomain for this deployment")

        # Check if domain is already in use by another deployment
        existing = await self.db.execute(
            select(Deployment).where(Deployment.custom_domain == domain)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Domain '{domain}' is already in use by another project")

        # Update nginx config and request SSL certificate
        deploy_result = await self.website.set_custom_domain(subdomain, domain)

        deployment.custom_domain = domain
        await self.db.commit()
        await self.db.refresh(deployment)

        return deployment

    async def remove_custom_domain(
        self,
        project_id: UUID,
        user_id: UUID,
    ) -> Deployment:
        """Remove custom domain from the active website deployment."""
        result = await self.db.execute(
            select(Deployment)
            .join(Project)
            .where(
                Project.id == project_id,
                Project.user_id == user_id,
                Deployment.custom_domain.isnot(None),
            )
            .order_by(Deployment.created_at.desc())
        )
        deployment = result.scalars().first()

        if not deployment:
            raise ValueError("No deployment with custom domain found")

        subdomain = deployment.external_id
        if not subdomain and deployment.url:
            subdomain = deployment.url.replace("https://", "").split(f".{VIABLY_DOMAIN}")[0]

        if subdomain:
            await self.website.remove_custom_domain(subdomain)

        deployment.custom_domain = None
        await self.db.commit()
        await self.db.refresh(deployment)

        return deployment

    async def check_health(self, deployment_id: UUID) -> bool:
        """Check deployment health by making HTTP request."""
        result = await self.db.execute(
            select(Deployment).where(Deployment.id == deployment_id)
        )
        deployment = result.scalar_one_or_none()

        if not deployment or not deployment.url:
            return False

        if not validate_deployment_url(deployment.url):
            logger.warning("Invalid deployment URL: %s", deployment.url)
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    deployment.url,
                    timeout=settings.HEALTH_CHECK_TIMEOUT_SECONDS,
                )
                healthy = response.status_code < 500
                deployment.last_health_check = datetime.now(timezone.utc)
                await self.db.commit()
                return healthy
        except Exception as e:
            logger.warning("Health check failed: %s", e)
            return False
