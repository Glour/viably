# Backend Module: Deploy

**Module:** `app/deploy`
**Status:** Not Started
**Priority:** P1 (Should have)
**Estimated Time:** 3-4 days
**Dependencies:** Projects, AI Generation

---

## 📋 Overview

Automates deployment to Railway (or other platforms), manages environment variables, and tracks deployment status.

**Responsibilities:**
- Create Railway projects
- Upload generated code
- Set environment variables
- Trigger and monitor deployments
- Health checks
- Stop/delete deployments

---

## 🔧 Dependencies

```python
# requirements.txt additions
httpx>=0.26.0  # For Railway GraphQL API
```

---

## 🗄️ Database Models

### Deployment Model

File: `app/deploy/models.py`

```python
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)

    # Platform
    platform = Column(String(50), default="railway")  # railway, render
    external_id = Column(String(255), nullable=True)  # Platform deployment ID

    # Status
    status = Column(String(20), default="pending")  # pending, building, deploying, active, failed, stopped

    # URLs
    url = Column(Text, nullable=True)  # Public bot URL
    build_url = Column(Text, nullable=True)  # Platform build logs URL
    admin_url = Column(Text, nullable=True)  # Platform admin panel

    # Logs
    logs = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    last_health_check = Column(DateTime(timezone=True), nullable=True)

    # Platform data
    platform_data = Column(JSONB, nullable=True)  # Platform-specific metadata

    # Relationships
    project = relationship("Project", back_populates="deployments")
```

---

## 📝 Pydantic Schemas

File: `app/deploy/schemas.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from enum import Enum


class DeploymentStatus(str, Enum):
    PENDING = "pending"
    BUILDING = "building"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    FAILED = "failed"
    STOPPED = "stopped"


class DeploymentPlatform(str, Enum):
    RAILWAY = "railway"
    RENDER = "render"


class DeploymentCreate(BaseModel):
    platform: DeploymentPlatform = DeploymentPlatform.RAILWAY
    env_variables: Dict[str, str] = Field(default_factory=dict)


class DeploymentResponse(BaseModel):
    id: UUID
    project_id: UUID
    platform: str
    status: DeploymentStatus
    url: Optional[str]
    build_url: Optional[str]
    admin_url: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    deployed_at: Optional[datetime]
    last_health_check: Optional[datetime]

    model_config = {"from_attributes": True}


class DeploymentLogsResponse(BaseModel):
    deployment_id: UUID
    logs: Optional[str]
    status: DeploymentStatus
```

---

## 🚂 Railway Integration

File: `app/deploy/railway.py`

```python
import httpx
from typing import Dict, Optional, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class RailwayClient:
    """Railway GraphQL API client."""

    def __init__(self):
        self.api_url = "https://backboard.railway.app/graphql/v2"
        self.token = settings.RAILWAY_API_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def _query(self, query: str, variables: Optional[Dict] = None) -> Dict:
        """Execute GraphQL query."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                json={"query": query, "variables": variables or {}},
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                raise Exception(f"Railway API error: {data['errors']}")

            return data["data"]

    async def create_project(self, name: str) -> Dict[str, Any]:
        """Create a new Railway project."""
        query = """
        mutation($name: String!) {
            projectCreate(input: { name: $name }) {
                id
                name
            }
        }
        """

        result = await self._query(query, {"name": name})
        return result["projectCreate"]

    async def create_service(
        self,
        project_id: str,
        name: str
    ) -> Dict[str, Any]:
        """Create a service in Railway project."""
        query = """
        mutation($projectId: String!, $name: String!) {
            serviceCreate(input: { projectId: $projectId, name: $name }) {
                id
                name
            }
        }
        """

        result = await self._query(query, {
            "projectId": project_id,
            "name": name
        })
        return result["serviceCreate"]

    async def set_env_variables(
        self,
        project_id: str,
        service_id: str,
        env_vars: Dict[str, str]
    ) -> bool:
        """Set environment variables for a service."""
        query = """
        mutation($projectId: String!, $serviceId: String!, $variables: Json!) {
            variableCollectionUpsert(input: {
                projectId: $projectId,
                serviceId: $serviceId,
                variables: $variables
            })
        }
        """

        await self._query(query, {
            "projectId": project_id,
            "serviceId": service_id,
            "variables": env_vars
        })
        return True

    async def deploy_from_source(
        self,
        project_id: str,
        service_id: str,
        source_code: Dict[str, str]
    ) -> Dict[str, Any]:
        """Deploy service from source code."""
        # Railway typically deploys from GitHub
        # For direct source, we'd need to use their CLI or create a temp repo
        # This is a simplified version

        query = """
        mutation($serviceId: String!) {
            deploymentCreate(input: { serviceId: $serviceId }) {
                id
                status
            }
        }
        """

        result = await self._query(query, {"serviceId": service_id})
        return result["deploymentCreate"]

    async def get_deployment_status(self, deployment_id: str) -> Dict[str, Any]:
        """Get deployment status."""
        query = """
        query($id: String!) {
            deployment(id: $id) {
                id
                status
                url
                createdAt
            }
        }
        """

        result = await self._query(query, {"id": deployment_id})
        return result["deployment"]

    async def get_service_domain(self, service_id: str) -> Optional[str]:
        """Get public domain for a service."""
        query = """
        query($serviceId: String!) {
            service(id: $serviceId) {
                serviceDomains {
                    domain
                }
            }
        }
        """

        result = await self._query(query, {"serviceId": service_id})
        domains = result["service"]["serviceDomains"]
        return domains[0]["domain"] if domains else None

    async def delete_project(self, project_id: str) -> bool:
        """Delete Railway project."""
        query = """
        mutation($id: String!) {
            projectDelete(id: $id)
        }
        """

        await self._query(query, {"id": project_id})
        return True

    async def get_deployment_logs(self, deployment_id: str) -> str:
        """Get deployment logs."""
        query = """
        query($deploymentId: String!) {
            deploymentLogs(deploymentId: $deploymentId) {
                message
                timestamp
            }
        }
        """

        result = await self._query(query, {"deploymentId": deployment_id})
        logs = result.get("deploymentLogs", [])
        return "\n".join(f"[{l['timestamp']}] {l['message']}" for l in logs)


# Singleton instance
railway_client = RailwayClient()
```

---

## 🔄 Deployment Service

File: `app/deploy/service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime
import logging
import asyncio

from app.deploy.models import Deployment
from app.deploy.schemas import DeploymentStatus, DeploymentCreate
from app.deploy.railway import railway_client
from app.projects.models import Project
from app.projects.schemas import ProjectStatus

logger = logging.getLogger(__name__)


class DeploymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def deploy_project(
        self,
        project_id: UUID,
        user_id: UUID,
        data: DeploymentCreate
    ) -> Deployment:
        """
        Complete deployment workflow.

        Steps:
        1. Validate project (must be ready, owned by user)
        2. Create Railway project
        3. Create service
        4. Set environment variables
        5. Deploy code
        6. Poll status
        7. Update deployment record
        """
        # Get project
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.user_id == user_id
            )
        )
        project = result.scalar_one_or_none()

        if not project:
            raise ValueError("Project not found")

        if project.status != ProjectStatus.READY:
            raise ValueError("Project must be in 'ready' status to deploy")

        if not project.generated_code:
            raise ValueError("No generated code to deploy")

        # Create deployment record
        deployment = Deployment(
            project_id=project_id,
            platform=data.platform,
            status=DeploymentStatus.PENDING
        )
        self.db.add(deployment)
        await self.db.commit()
        await self.db.refresh(deployment)

        try:
            # Update project status
            project.status = ProjectStatus.DEPLOYING
            await self.db.commit()

            # Create Railway project
            railway_project = await railway_client.create_project(
                name=f"viably-{project.name[:20]}-{str(project_id)[:8]}"
            )

            deployment.platform_data = {"railway_project_id": railway_project["id"]}
            await self.db.commit()

            # Create service
            service = await railway_client.create_service(
                project_id=railway_project["id"],
                name="bot"
            )

            deployment.platform_data["railway_service_id"] = service["id"]
            deployment.status = DeploymentStatus.BUILDING
            await self.db.commit()

            # Set environment variables
            await railway_client.set_env_variables(
                project_id=railway_project["id"],
                service_id=service["id"],
                env_vars=data.env_variables
            )

            # Deploy code
            deploy_result = await railway_client.deploy_from_source(
                project_id=railway_project["id"],
                service_id=service["id"],
                source_code=project.generated_code.get("files", {})
            )

            deployment.external_id = deploy_result["id"]
            deployment.status = DeploymentStatus.DEPLOYING
            await self.db.commit()

            # Poll status (simplified - in production use background task)
            url = await self._poll_deployment_status(
                deployment.id,
                deploy_result["id"],
                service["id"]
            )

            # Update final status
            deployment.url = url
            deployment.status = DeploymentStatus.ACTIVE
            deployment.deployed_at = datetime.utcnow()

            project.status = ProjectStatus.DEPLOYED
            project.deployed_url = url
            project.deployed_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(deployment)

            return deployment

        except Exception as e:
            logger.error(f"Deployment failed: {e}")

            deployment.status = DeploymentStatus.FAILED
            deployment.error_message = str(e)
            project.status = ProjectStatus.ERROR
            project.error_message = f"Deployment failed: {e}"

            await self.db.commit()
            raise

    async def _poll_deployment_status(
        self,
        deployment_id: UUID,
        railway_deployment_id: str,
        service_id: str,
        timeout: int = 300,
        interval: int = 10
    ) -> str:
        """Poll Railway for deployment status."""
        elapsed = 0

        while elapsed < timeout:
            status = await railway_client.get_deployment_status(railway_deployment_id)

            if status["status"] == "SUCCESS":
                # Get URL
                url = await railway_client.get_service_domain(service_id)
                return f"https://{url}" if url else status.get("url")

            if status["status"] == "FAILED":
                raise Exception("Deployment failed on Railway")

            await asyncio.sleep(interval)
            elapsed += interval

        raise Exception("Deployment timed out")

    async def get_deployment(
        self,
        deployment_id: UUID,
        user_id: UUID
    ) -> Deployment:
        """Get deployment by ID (with ownership check)."""
        result = await self.db.execute(
            select(Deployment)
            .join(Project)
            .where(
                Deployment.id == deployment_id,
                Project.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def get_deployment_logs(
        self,
        deployment_id: UUID,
        user_id: UUID
    ) -> str:
        """Get deployment logs."""
        deployment = await self.get_deployment(deployment_id, user_id)

        if not deployment or not deployment.external_id:
            return ""

        return await railway_client.get_deployment_logs(deployment.external_id)

    async def stop_deployment(
        self,
        deployment_id: UUID,
        user_id: UUID
    ) -> bool:
        """Stop/delete deployment."""
        deployment = await self.get_deployment(deployment_id, user_id)

        if not deployment:
            return False

        try:
            if deployment.platform_data and "railway_project_id" in deployment.platform_data:
                await railway_client.delete_project(
                    deployment.platform_data["railway_project_id"]
                )

            deployment.status = DeploymentStatus.STOPPED
            await self.db.commit()

            return True

        except Exception as e:
            logger.error(f"Failed to stop deployment: {e}")
            raise

    async def check_health(self, deployment_id: UUID) -> bool:
        """Check deployment health."""
        result = await self.db.execute(
            select(Deployment).where(Deployment.id == deployment_id)
        )
        deployment = result.scalar_one_or_none()

        if not deployment or not deployment.url:
            return False

        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(deployment.url, timeout=10.0)
                healthy = response.status_code < 500

                deployment.last_health_check = datetime.utcnow()
                await self.db.commit()

                return healthy

        except Exception:
            return False
```

---

## 🌐 API Endpoints

File: `app/deploy/routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.deploy.service import DeploymentService
from app.deploy.schemas import (
    DeploymentCreate,
    DeploymentResponse,
    DeploymentLogsResponse
)

router = APIRouter(prefix="/deployments", tags=["deployments"])


@router.post("/projects/{project_id}/deploy", response_model=DeploymentResponse)
async def deploy_project(
    project_id: UUID,
    data: DeploymentCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deploy a project to Railway."""
    service = DeploymentService(db)

    try:
        deployment = await service.deploy_project(
            project_id, current_user.id, data
        )
        return deployment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{deployment_id}", response_model=DeploymentResponse)
async def get_deployment(
    deployment_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get deployment status."""
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found"
        )

    return deployment


@router.get("/{deployment_id}/logs", response_model=DeploymentLogsResponse)
async def get_deployment_logs(
    deployment_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get deployment logs."""
    service = DeploymentService(db)
    deployment = await service.get_deployment(deployment_id, current_user.id)

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found"
        )

    logs = await service.get_deployment_logs(deployment_id, current_user.id)

    return DeploymentLogsResponse(
        deployment_id=deployment_id,
        logs=logs,
        status=deployment.status
    )


@router.delete("/{deployment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def stop_deployment(
    deployment_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Stop and delete deployment."""
    service = DeploymentService(db)
    stopped = await service.stop_deployment(deployment_id, current_user.id)

    if not stopped:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found"
        )
```

---

## 🧪 Tests

File: `tests/test_deploy.py`

```python
import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.deploy.service import DeploymentService
from app.deploy.schemas import DeploymentCreate, DeploymentPlatform


@pytest.mark.asyncio
async def test_deploy_project_success(
    client,
    auth_headers,
    ready_project
):
    """Test successful deployment."""
    with patch("app.deploy.railway.railway_client") as mock_railway:
        mock_railway.create_project = AsyncMock(return_value={"id": "rp-123"})
        mock_railway.create_service = AsyncMock(return_value={"id": "rs-123"})
        mock_railway.set_env_variables = AsyncMock(return_value=True)
        mock_railway.deploy_from_source = AsyncMock(return_value={"id": "rd-123", "status": "SUCCESS"})
        mock_railway.get_deployment_status = AsyncMock(return_value={"status": "SUCCESS", "url": "https://bot.up.railway.app"})
        mock_railway.get_service_domain = AsyncMock(return_value="bot.up.railway.app")

        response = await client.post(
            f"/api/deployments/projects/{ready_project.id}/deploy",
            json={
                "platform": "railway",
                "env_variables": {"BOT_TOKEN": "123:ABC"}
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "active"
        assert data["url"] is not None


@pytest.mark.asyncio
async def test_deploy_requires_ready_status(
    client,
    auth_headers,
    draft_project
):
    """Test that deployment requires ready status."""
    response = await client.post(
        f"/api/deployments/projects/{draft_project.id}/deploy",
        json={"platform": "railway", "env_variables": {}},
        headers=auth_headers
    )

    assert response.status_code == 400
    assert "ready" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_deployment_status(
    client,
    auth_headers,
    deployment
):
    """Test getting deployment status."""
    response = await client.get(
        f"/api/deployments/{deployment.id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(deployment.id)


@pytest.mark.asyncio
async def test_get_deployment_logs(
    client,
    auth_headers,
    active_deployment
):
    """Test getting deployment logs."""
    with patch("app.deploy.railway.railway_client.get_deployment_logs") as mock_logs:
        mock_logs.return_value = "[2024-01-01] Bot started"

        response = await client.get(
            f"/api/deployments/{active_deployment.id}/logs",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "Bot started" in data["logs"]


@pytest.mark.asyncio
async def test_stop_deployment(
    client,
    auth_headers,
    active_deployment
):
    """Test stopping deployment."""
    with patch("app.deploy.railway.railway_client.delete_project") as mock_delete:
        mock_delete.return_value = True

        response = await client.delete(
            f"/api/deployments/{active_deployment.id}",
            headers=auth_headers
        )

        assert response.status_code == 204


@pytest.mark.asyncio
async def test_health_check(db_session, active_deployment):
    """Test deployment health check."""
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value.status_code = 200

        service = DeploymentService(db_session)
        healthy = await service.check_health(active_deployment.id)

        assert healthy is True


@pytest.mark.asyncio
async def test_deployment_error_handling(
    client,
    auth_headers,
    ready_project
):
    """Test error handling during deployment."""
    with patch("app.deploy.railway.railway_client.create_project") as mock_create:
        mock_create.side_effect = Exception("Railway API error")

        response = await client.post(
            f"/api/deployments/projects/{ready_project.id}/deploy",
            json={"platform": "railway", "env_variables": {}},
            headers=auth_headers
        )

        # Should handle error gracefully
        assert response.status_code in [400, 500]
```

---

## 📊 Success Criteria

- [ ] Railway API integration works
- [ ] Project creation on Railway works
- [ ] Environment variables are set correctly
- [ ] Deployment succeeds and returns URL
- [ ] Status polling is accurate
- [ ] URLs returned correctly
- [ ] Can stop/delete deployment
- [ ] Health checks work
- [ ] Error handling is robust

---

## 💡 Implementation Tips

- Use webhooks from Railway if available (reduces polling)
- Poll every 10s max to avoid rate limits
- Store platform_data for debugging
- Implement health checks (ping every 5min via background task)
- Auto-cleanup failed deployments after 24h
- Consider cost implications (Railway free tier limits)

---

## 🔒 Security Considerations

- Never expose Railway API token
- Validate BOT_TOKEN format before deployment
- Don't store sensitive env variables in logs
- Use HTTPS for all Railway communications
- Consider isolating deployments per user

---

## 📊 Deploy Flow Summary

```
1. User clicks "Deploy"
2. Modal: Enter BOT_TOKEN and other env vars
3. POST /api/deployments/projects/{id}/deploy
   {
     "platform": "railway",
     "env_variables": {
       "BOT_TOKEN": "123456:ABC..."
     }
   }
4. Backend:
   - Creates Railway project
   - Creates service
   - Sets env vars
   - Uploads code
   - Triggers deploy
   - Polls status
5. Returns deployment URL
6. User gets live bot!
```

---

**Last Updated:** February 5, 2026
