"""Railway GraphQL API client."""

import logging
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class RailwayClient:
    """Railway GraphQL API client."""

    def __init__(self) -> None:
        self.api_url = "https://backboard.railway.app/graphql/v2"
        self.token = settings.RAILWAY_API_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    async def _query(
        self, query: str, variables: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """Execute GraphQL query."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                json={"query": query, "variables": variables or {}},
                headers=self.headers,
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                error_msg = str(data["errors"])
                logger.error(f"Railway API error: {error_msg}")
                raise Exception(f"Railway API error: {error_msg}")

            return data["data"]

    async def create_project(self, name: str) -> dict[str, Any]:
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
        self, project_id: str, name: str
    ) -> dict[str, Any]:
        """Create a service in Railway project."""
        query = """
        mutation($projectId: String!, $name: String!) {
            serviceCreate(input: { projectId: $projectId, name: $name }) {
                id
                name
            }
        }
        """
        result = await self._query(
            query, {"projectId": project_id, "name": name}
        )
        return result["serviceCreate"]

    async def set_env_variables(
        self,
        project_id: str,
        service_id: str,
        env_vars: dict[str, str],
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
        await self._query(
            query,
            {
                "projectId": project_id,
                "serviceId": service_id,
                "variables": env_vars,
            },
        )
        return True

    async def deploy_from_source(
        self,
        project_id: str,
        service_id: str,
        source_code: dict[str, str],
    ) -> dict[str, Any]:
        """Deploy service from source code.

        Note: Railway typically deploys from GitHub.
        For direct source, we'd need to use their CLI or create a temp repo.
        This is a simplified version.
        """
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

    async def get_deployment_status(
        self, deployment_id: str
    ) -> dict[str, Any]:
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
        return "\n".join(
            f"[{log['timestamp']}] {log['message']}" for log in logs
        )


# Singleton instance
railway_client = RailwayClient()
