"""Deploy node lifecycle — manage Hetzner Docker servers for Viably project deployments."""

import asyncio
import logging
import os
import socket
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

MAX_DEPLOYS_PER_NODE = int(os.getenv("MAX_DEPLOYS_PER_NODE", "20"))
SSH_KEY = "/run/secrets/worker_ssh_key"
SSH_OPTS = ["-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15", "-i", SSH_KEY]

# Cloud-init: minimal bootstrap
CLOUD_INIT = """#!/bin/bash
apt-get update -qq
apt-get install -y curl rsync
mkdir -p /opt/viably-deploys
"""


class DeployNodeService:
    """Manages a pool of Hetzner servers for Viably Docker deployments."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._hetzner = None

    def _get_hetzner(self):
        if self._hetzner is None:
            from infrastructure.services.hetzner_service import HetznerService
            from settings.config import settings
            self._hetzner = HetznerService(settings.HETZNER_API_TOKEN)
        return self._hetzner

    # ─── Node selection ──────────────────────────────────────────────────────

    async def get_available_node(self) -> dict | None:
        """Return a ready node with free capacity."""
        result = await self.db.execute(text("""
            SELECT id, ip, name, deploy_count, max_deploys
            FROM deploy_nodes
            WHERE status = 'ready' AND deploy_count < max_deploys
            ORDER BY deploy_count DESC
            LIMIT 1
        """))
        row = result.fetchone()
        return dict(row._mapping) if row else None

    async def get_or_create_node(self) -> dict:
        """Return available node or create new one."""
        node = await self.get_available_node()
        if node:
            return node
        logger.info("[deploy-node] No capacity — provisioning new Hetzner server")
        return await self.provision_new_node()

    # ─── Provisioning ────────────────────────────────────────────────────────

    async def provision_new_node(self) -> dict:
        hetzner = self._get_hetzner()
        result = await self.db.execute(text("SELECT COUNT(*) FROM deploy_nodes"))
        n = result.scalar() + 1
        name = f"viably-deploy-{n:02d}"
        logger.info(f"[deploy-node] Provisioning {name}...")

        ssh_pub_key = Path(SSH_KEY + ".pub").read_text().strip()
        ssh_key_id = await hetzner.ensure_ssh_key("viably-backend", ssh_pub_key)

        result = await self.db.execute(text("""
            INSERT INTO deploy_nodes (name, status, max_deploys)
            VALUES (:name, 'provisioning', :max)
            RETURNING id
        """), {"name": name, "max": MAX_DEPLOYS_PER_NODE})
        node_id = result.scalar()
        await self.db.commit()

        try:
            server = await hetzner.create_server(name, ssh_key_id, CLOUD_INIT)
            hetzner_id, ip = server["id"], server["ip"]

            await self.db.execute(text("""
                UPDATE deploy_nodes SET hetzner_server_id = :hid, ip = :ip WHERE id = :id
            """), {"hid": hetzner_id, "ip": ip, "id": node_id})
            await self.db.commit()

            await hetzner.wait_for_running(hetzner_id, timeout=180)
            await self._wait_for_ssh(ip)
            await self._setup_node(ip)

            await self.db.execute(text("""
                UPDATE deploy_nodes SET status = 'ready', updated_at = now() WHERE id = :id
            """), {"id": node_id})
            await self.db.commit()

            logger.info(f"[deploy-node] {name} ({ip}) → READY ✓")
            return {"id": node_id, "ip": ip, "name": name}

        except Exception as e:
            logger.error(f"[deploy-node] Failed: {e}")
            await self.db.execute(text(
                "UPDATE deploy_nodes SET status = 'dead' WHERE id = :id"
            ), {"id": node_id})
            await self.db.commit()
            raise

    # ─── Count tracking ──────────────────────────────────────────────────────

    async def increment(self, node_ip: str):
        await self.db.execute(text("""
            UPDATE deploy_nodes
            SET deploy_count = deploy_count + 1,
                status = CASE WHEN deploy_count + 1 >= max_deploys THEN 'full' ELSE 'ready' END,
                updated_at = now()
            WHERE ip = :ip
        """), {"ip": node_ip})
        await self.db.commit()

    async def decrement(self, node_ip: str):
        await self.db.execute(text("""
            UPDATE deploy_nodes
            SET deploy_count = GREATEST(deploy_count - 1, 0),
                status = CASE WHEN status = 'full' AND deploy_count - 1 < max_deploys THEN 'ready' ELSE status END,
                updated_at = now()
            WHERE ip = :ip
        """), {"ip": node_ip})
        await self.db.commit()

    # ─── SSH helpers ─────────────────────────────────────────────────────────

    async def _wait_for_ssh(self, ip: str, timeout: int = 120):
        for _ in range(timeout // 5):
            try:
                s = socket.create_connection((ip, 22), timeout=5)
                s.close()
                await asyncio.sleep(8)
                return
            except OSError:
                await asyncio.sleep(5)
        raise TimeoutError(f"SSH not available on {ip}")

    def _ssh(self, ip: str, cmd: str) -> list:
        return ["ssh", *SSH_OPTS, f"root@{ip}", cmd]

    async def _run(self, args: list, timeout: int = 600) -> tuple:
        proc = await asyncio.create_subprocess_exec(
            *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        try:
            out, err = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            proc.kill()
            return -1, "", "timeout"
        return proc.returncode, out.decode(), err.decode()

    async def _setup_node(self, ip: str):
        """Install Docker on the worker node."""
        setup = (
            "export DEBIAN_FRONTEND=noninteractive && "
            "while ! flock -n /var/lib/dpkg/lock-frontend true 2>/dev/null; do sleep 3; done && "
            "sleep 5 && "
            "apt-get update -qq && "
            "apt-get install -y docker.io rsync && "
            "systemctl enable docker && systemctl start docker && "
            "mkdir -p /opt/viably-deploys && "
            "echo SETUP_OK"
        )
        rc, out, err = await self._run(self._ssh(ip, setup), timeout=600)
        if rc != 0 or "SETUP_OK" not in out:
            raise RuntimeError(f"Docker setup failed on {ip}: {err[-400:]}")
        logger.info(f"[deploy-node] Docker installed on {ip}")

    # ─── Remote Docker helpers (used by RemoteDockerDeployClient) ────────────

    async def sync_project_files(self, ip: str, project_dir: str):
        """Rsync project build directory to worker node."""
        rc, _, err = await self._run([
            "rsync", "-az", "--delete",
            "-e", f"ssh {' '.join(SSH_OPTS)}",
            f"{project_dir}/",
            f"root@{ip}:{project_dir}/",
        ])
        if rc != 0:
            raise RuntimeError(f"rsync failed: {err[-300:]}")

    async def run_remote(self, ip: str, cmd: list, timeout: int = 300) -> tuple:
        """Run a command on remote node via SSH."""
        cmd_str = " ".join(f'"{c}"' if " " in c else c for c in cmd)
        return await self._run(self._ssh(ip, cmd_str), timeout=timeout)
