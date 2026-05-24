"""Hetzner Cloud API — provision/manage Docker worker servers for Viably deployments."""

import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)
HETZNER_API = "https://api.hetzner.cloud/v1"


class HetznerService:
    def __init__(self, api_token: str):
        self.token = api_token
        self.headers = {"Authorization": f"Bearer {api_token}", "Content-Type": "application/json"}

    async def ensure_ssh_key(self, name: str, public_key: str) -> int:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(f"{HETZNER_API}/ssh_keys", headers=self.headers)
            for k in r.json().get("ssh_keys", []):
                if k["name"] == name:
                    return k["id"]
            r = await c.post(f"{HETZNER_API}/ssh_keys", headers=self.headers,
                             json={"name": name, "public_key": public_key})
            r.raise_for_status()
            return r.json()["ssh_key"]["id"]

    async def create_server(self, name: str, ssh_key_id: int, user_data: str = "") -> dict:
        """Create cax21 (4 vCPU, 8 GB ARM) server — good for multiple Docker containers."""
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(f"{HETZNER_API}/servers", headers=self.headers, json={
                "name": name, "server_type": "cax21", "image": "ubuntu-22.04",
                "ssh_keys": [ssh_key_id], "user_data": user_data,
                "labels": {"project": "viably", "type": "deploy-worker"},
            })
            r.raise_for_status()
            s = r.json()["server"]
            return {"id": s["id"], "name": s["name"], "ip": s["public_net"]["ipv4"]["ip"], "status": s["status"]}

    async def get_server(self, server_id: int) -> dict:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(f"{HETZNER_API}/servers/{server_id}", headers=self.headers)
            r.raise_for_status()
            s = r.json()["server"]
            return {"id": s["id"], "ip": s["public_net"]["ipv4"]["ip"], "status": s["status"]}

    async def list_servers(self) -> list:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(f"{HETZNER_API}/servers?label_selector=project=viably", headers=self.headers)
            r.raise_for_status()
            return r.json().get("servers", [])

    async def delete_server(self, server_id: int) -> bool:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.delete(f"{HETZNER_API}/servers/{server_id}", headers=self.headers)
            return r.status_code in (200, 204)

    async def wait_for_running(self, server_id: int, timeout: int = 180) -> str:
        for _ in range(timeout // 5):
            info = await self.get_server(server_id)
            if info["status"] == "running":
                return info["ip"]
            await asyncio.sleep(5)
        raise TimeoutError(f"Server {server_id} did not reach 'running' in {timeout}s")
