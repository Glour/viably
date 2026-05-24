"""Docker-based deployment service for self-hosted bot deployments."""

import asyncio
import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

try:
    from infrastructure.services.self_heal import self_healing_watch
    _SELF_HEAL_AVAILABLE = True
except ImportError:
    _SELF_HEAL_AVAILABLE = False

# PostgreSQL container used by viably platform (from docker-compose.yml)
VIABLY_POSTGRES_CONTAINER = "viably-postgres"
VIABLY_POSTGRES_USER = os.environ.get("POSTGRES_USER", "postgres")
VIABLY_POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")
VIABLY_POSTGRES_HOST = "viably-postgres"  # Docker network hostname

# Base directory for deployed projects
DEPLOY_BASE_DIR = Path("/opt/viably-deploys")
# Port range for deployed containers
PORT_RANGE_START = 10000
PORT_RANGE_END = 11000


class DockerDeployClient:
    """Client for managing Docker-based deployments."""

    def __init__(self) -> None:
        self.deploy_dir = DEPLOY_BASE_DIR
        self.deploy_dir.mkdir(parents=True, exist_ok=True)

    async def _run_command(self, cmd: list[str], cwd: Optional[str] = None, timeout: int = 300) -> tuple[int, str, str]:
        """Run a shell command asynchronously."""
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            return proc.returncode or 0, stdout.decode(), stderr.decode()
        except asyncio.TimeoutError:
            proc.kill()
            return 1, "", "Command timed out"

    def _get_project_dir(self, project_id: str) -> Path:
        """Get deployment directory for a project."""
        return self.deploy_dir / project_id

    def _detect_entry_point(self, files: dict[str, str]) -> str:
        """Detect the Python entry point from project files.

        Checks for common entry points in order of priority.
        Returns a shell command string for CMD.
        Prepends alembic upgrade head if the project uses Alembic.
        """
        # Priority order for entry point detection
        candidates = [
            "apps/bot/main.py",
            "app/main.py",
            "bot/main.py",
            "src/main.py",
            "main.py",
            "bot.py",
            "app.py",
            "run.py",
        ]
        entry_cmd = None
        for candidate in candidates:
            if candidate in files:
                # Convert path to module notation for nested paths
                if "/" in candidate:
                    module = candidate.replace("/", ".").removesuffix(".py")
                    entry_cmd = f"python -m {module}"
                else:
                    entry_cmd = f"python {candidate}"
                break
        if entry_cmd is None:
            # Fallback: find any main.py
            for filepath in files:
                if filepath.endswith("main.py"):
                    module = filepath.replace("/", ".").removesuffix(".py")
                    entry_cmd = f"python -m {module}"
                    break
        if entry_cmd is None:
            entry_cmd = "python main.py"

        # Prepend schema setup: schema_validator creates tables via create_all(),
        # then alembic upgrade head applies any migrations (if versions exist)
        has_db = any(
            "infrastructure/database/models" in f and f.endswith(".py") and f != "infrastructure/database/models/base.py"
            for f in files
        )
        if has_db:
            schema_setup = "python3 infrastructure/services/schema_validator.py 2>&1 || true && python3 infrastructure/services/seed_data.py 2>&1 || true"
            has_alembic_versions = any(
                "migrations/versions/" in f and f.endswith(".py") for f in files
            )
            if has_alembic_versions:
                schema_setup += " && alembic upgrade head 2>&1 || true"
            entry_cmd = f"{schema_setup} && {entry_cmd}"

        return entry_cmd

    def _generate_webapp_dockerfile(self) -> str:
        """Generate Dockerfile for React/Vite webapp with multi-stage build."""
        return """FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts 2>/dev/null || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/
RUN printf 'server {\\n  listen 8080;\\n  root /usr/share/nginx/html;\\n  index index.html;\\n  location / {\\n    try_files $uri $uri/ /index.html;\\n  }\\n}\\n' > /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
"""

    def _generate_dockerfile(self, runtime: str, entry_cmd: str = "python main.py") -> str:
        """Generate Dockerfile based on runtime."""
        if runtime in ("webapp", "website"):
            return self._generate_webapp_dockerfile()
        if runtime in ("static", "html"):
            return """FROM nginx:alpine
COPY . /usr/share/nginx/html/
EXPOSE 8080
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
"""
        if runtime in ("python", "python3", ""):
            return f"""FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir poetry
COPY . /tmp/src/
RUN if [ -f /tmp/src/pyproject.toml ]; then cp /tmp/src/pyproject.toml ./ && (cp /tmp/src/poetry.lock ./ 2>/dev/null || true) && poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main --no-root; fi
RUN if [ -f /tmp/src/requirements.txt ] && [ ! -f /tmp/src/pyproject.toml ]; then pip install --no-cache-dir -r /tmp/src/requirements.txt; fi

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
ENV PYTHONPATH=/app
CMD ["sh", "-c", "{entry_cmd}"]
"""
        elif runtime in ("node", "nodejs"):
            return """FROM node:20-alpine
WORKDIR /app
COPY . .
RUN if [ -f package.json ]; then npm install --production; fi
CMD ["node", "index.js"]
"""
        else:
            return f"""FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir poetry
COPY . /tmp/src/
RUN if [ -f /tmp/src/pyproject.toml ]; then cp /tmp/src/pyproject.toml ./ && (cp /tmp/src/poetry.lock ./ 2>/dev/null || true) && poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main --no-root; fi
RUN if [ -f /tmp/src/requirements.txt ] && [ ! -f /tmp/src/pyproject.toml ]; then pip install --no-cache-dir -r /tmp/src/requirements.txt; fi

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
ENV PYTHONPATH=/app
CMD ["sh", "-c", "{entry_cmd}"]
"""

    @staticmethod
    def _ensure_init_files(project_dir: Path, files: dict[str, str]) -> None:
        """Create __init__.py in all directories that contain .py files.

        AI-generated code often forgets __init__.py, which makes Python unable
        to import modules from nested packages.
        """
        dirs_with_py = set()
        for filepath in files:
            if filepath.endswith(".py"):
                parts = Path(filepath).parts
                # Collect all parent directories (e.g. apps/bot/handlers/user/start.py
                # -> apps, apps/bot, apps/bot/handlers, apps/bot/handlers/user)
                for i in range(1, len(parts)):
                    dirs_with_py.add(Path(*parts[:i]))

        created = 0
        for pkg_dir in sorted(dirs_with_py):
            init_path = project_dir / pkg_dir / "__init__.py"
            if not init_path.exists():
                init_path.write_text("")
                created += 1

        if created:
            logger.info("Auto-created %d __init__.py files for Python packages", created)

    @staticmethod
    def _map_docker_error(stderr: str) -> str:
        """Map Docker build errors to user-friendly messages."""
        error_mappings = [
            ("ModuleNotFoundError", "Ошибка импорта: не найден модуль. Проверьте зависимости в pyproject.toml"),
            ("SyntaxError", "Синтаксическая ошибка в Python коде"),
            ("No space left on device", "Недостаточно места на диске сервера"),
            ("network", "Ошибка сети при загрузке зависимостей"),
            ("Could not find a version", "Не найдена версия пакета. Проверьте зависимости"),
            ("permission denied", "Ошибка доступа к файлам"),
            ("COPY failed", "Ошибка копирования файлов в контейнер"),
            ("returned a non-zero code", "Ошибка сборки проекта"),
        ]

        for pattern, message in error_mappings:
            if pattern.lower() in stderr.lower():
                return f"{message}\n\nДетали: {stderr[:500]}"

        return f"Ошибка сборки Docker-образа\n\nДетали: {stderr[:500]}"

    @staticmethod
    def _project_needs_database(files: dict[str, str]) -> bool:
        """Check if the project uses a database (SQLAlchemy/asyncpg imports)."""
        db_indicators = [
            "infrastructure/database/",
            "from sqlalchemy",
            "import sqlalchemy",
            "create_async_engine",
            "AsyncSession",
            "DATABASE_URL",
        ]
        for filepath, content in files.items():
            if not filepath.endswith(".py"):
                continue
            # Check path-based indicators
            for indicator in db_indicators[:1]:
                if indicator in filepath:
                    return True
            # Check content-based indicators
            for indicator in db_indicators[1:]:
                if indicator in content:
                    return True
        return False

    async def provision_database(self, project_id: str) -> dict:
        """Create a dedicated database for a bot in the viably-postgres container.

        Creates a DB named `bot_<project_id[:8]>` and returns connection info.
        Uses the shared viably-postgres container accessible on the Docker network.
        """
        db_name = f"bot_{project_id[:8].replace('-', '')}"
        db_user = VIABLY_POSTGRES_USER
        db_password = VIABLY_POSTGRES_PASSWORD

        # Create database if it doesn't exist (idempotent)
        create_db_sql = (
            f"SELECT 'CREATE DATABASE {db_name}' "
            f"WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '{db_name}');"
        )
        # Use psql inside the postgres container to create the database
        code, stdout, stderr = await self._run_command([
            "docker", "exec", VIABLY_POSTGRES_CONTAINER,
            "psql", "-U", db_user, "-tc",
            f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'",
        ], timeout=15)

        db_exists = stdout.strip() == "1"

        if not db_exists:
            code, stdout, stderr = await self._run_command([
                "docker", "exec", VIABLY_POSTGRES_CONTAINER,
                "psql", "-U", db_user, "-c",
                f"CREATE DATABASE {db_name};",
            ], timeout=15)

            if code != 0:
                logger.error(
                    "Failed to create database %s: %s", db_name, stderr[:500]
                )
                raise RuntimeError(f"Failed to create database: {stderr[:200]}")

            logger.info("Created database %s for project %s", db_name, project_id)
        else:
            logger.info("Database %s already exists for project %s", db_name, project_id)

        # Build connection URL using Docker network hostname
        database_url = (
            f"postgresql://{db_user}:{db_password}"
            f"@{VIABLY_POSTGRES_HOST}:5432/{db_name}"
        )

        return {
            "database_url": database_url,
            "db_name": db_name,
            "db_host": VIABLY_POSTGRES_HOST,
            "db_port": 5432,
            "db_user": db_user,
        }

    async def drop_database(self, project_id: str) -> bool:
        """Drop the bot's database when deployment is removed."""
        db_name = f"bot_{project_id[:8].replace('-', '')}"

        # Terminate active connections first
        await self._run_command([
            "docker", "exec", VIABLY_POSTGRES_CONTAINER,
            "psql", "-U", VIABLY_POSTGRES_USER, "-c",
            f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid();",
        ], timeout=10)

        code, _, stderr = await self._run_command([
            "docker", "exec", VIABLY_POSTGRES_CONTAINER,
            "psql", "-U", VIABLY_POSTGRES_USER, "-c",
            f"DROP DATABASE IF EXISTS {db_name};",
        ], timeout=15)

        if code != 0:
            logger.warning("Failed to drop database %s: %s", db_name, stderr[:200])
            return False

        logger.info("Dropped database %s", db_name)
        return True

    async def _find_free_port(self) -> int:
        """Find a free port in the deployment range."""
        # Get list of used ports
        code, stdout, _ = await self._run_command([
            "docker", "ps", "--format", "{{.Ports}}",
            "--filter", "name=viably-deploy-"
        ])
        used_ports = set()
        if stdout:
            for line in stdout.strip().split("\n"):
                # Parse port mappings like "0.0.0.0:10001->8080/tcp"
                if "->" in line:
                    try:
                        port = int(line.split(":")[1].split("->")[0])
                        used_ports.add(port)
                    except (IndexError, ValueError):
                        pass

        for port in range(PORT_RANGE_START, PORT_RANGE_END):
            if port not in used_ports:
                return port

        raise RuntimeError("No free ports available for deployment")

    async def _build_image(
        self,
        project_dir,
        image_name: str,
        files: dict,
    ):
        """Write files to project_dir and rebuild Docker image."""
        for filepath, file_content in files.items():
            fp = project_dir / filepath
            fp.parent.mkdir(parents=True, exist_ok=True)
            fp.write_text(file_content)
        self._ensure_init_files(project_dir, files)
        return await self._run_command(
            ["docker", "build", "--no-cache", "-t", image_name, "."],
            cwd=str(project_dir),
            timeout=240,
        )


    async def deploy(
        self,
        project_id: str,
        files: dict[str, str],
        runtime: str = "python",
        entry_point: str = "main.py",
        env_vars: Optional[dict[str, str]] = None,
    ) -> dict:
        """Deploy a project as a Docker container.
        
        Args:
            project_id: Unique project identifier
            files: Dict of filename -> content
            runtime: Runtime type (python, node)
            entry_point: Entry point file
            env_vars: Environment variables
            
        Returns:
            Dict with deployment info (container_id, port, url)
        """
        container_name = f"viably-deploy-{project_id[:8]}"
        project_dir = self._get_project_dir(project_id)
        
        # Clean up existing deployment
        await self.stop(project_id)
        
        # Create project directory and write files
        if project_dir.exists():
            shutil.rmtree(project_dir)
        project_dir.mkdir(parents=True)
        
        for filepath, content in files.items():
            file_path = project_dir / filepath
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content)

        # Auto-create __init__.py in all Python package directories
        if runtime in ("python", "python3", ""):
            self._ensure_init_files(project_dir, files)

        # Detect entry point and generate Dockerfile
        entry_cmd = self._detect_entry_point(files)
        logger.info("Detected entry point: %s", entry_cmd)
        dockerfile_content = self._generate_dockerfile(runtime, entry_cmd)
        (project_dir / "Dockerfile").write_text(dockerfile_content)
        
        # Find free port
        port = await self._find_free_port()
        
        # Build Docker image
        image_name = f"viably-bot-{project_id[:8]}"
        code, stdout, stderr = await self._run_command(
            ["docker", "build", "-t", image_name, "."],
            cwd=str(project_dir),
            timeout=180,
        )
        
        if code != 0:
            logger.error("Docker build failed: %s", stderr[:2000])
            return {
                "status": "failed",
                "error": self._map_docker_error(stderr),
                "logs": stdout + "\n" + stderr,
            }
        
        # Prepare env vars for docker run
        env_args = []
        if env_vars is None:
            env_vars = {}
        # Add token aliases for compatibility with generated bot code
        if "TELEGRAM_BOT_TOKEN" in env_vars:
            token = env_vars["TELEGRAM_BOT_TOKEN"]
            if "BOT_TOKEN" not in env_vars:
                env_vars["BOT_TOKEN"] = token
            # pydantic-settings with env_prefix="BOT__" expects BOT__TOKEN
            if "BOT__TOKEN" not in env_vars:
                env_vars["BOT__TOKEN"] = token
        # DATABASE_URL is provided by the user (e.g. Supabase connection string)
        for key, value in env_vars.items():
            env_args.extend(["-e", f"{key}={value}"])
        
        # Run container (connect to viably-network so bots can reach postgres/redis)
        run_cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "--restart", "unless-stopped",
            "--network", "viably-network",
            "--memory", "256m",
            "--cpus", "0.25",
            "-p", f"{port}:8080",
            *env_args,
            image_name,
        ]
        
        code, stdout, stderr = await self._run_command(run_cmd)
        
        if code != 0:
            logger.error("Docker run failed: %s", stderr[:2000])
            return {
                "status": "failed",
                "error": f"Ошибка запуска контейнера\n\nДетали: {stderr[:500]}",
                "logs": stderr,
            }
        
        container_id = stdout.strip()[:12]

        # ── Self-healing: watch container and auto-fix errors ─────────────────────
        if _SELF_HEAL_AVAILABLE and files:
            try:
                async def _build_healed(fixed_files):
                    return await self._build_image(project_dir, image_name, fixed_files)

                async def _run_healed():
                    return await self._run_command(run_cmd)

                healthy, fixed_files = await self_healing_watch(
                    container_name=container_name,
                    image_name=image_name,
                    files=files,
                    run_cmd_fn=self._run_command,
                    build_fn=_build_healed,
                    run_fn=_run_healed,
                )
                if not healthy:
                    logger.warning("[self-heal] container still unhealthy after max attempts")
                elif id(fixed_files) != id(files):
                    logger.info("[self-heal] files were auto-fixed and container is now healthy")
                    return {
                        "status": "active",
                        "container_id": container_id,
                        "container_name": container_name,
                        "port": port,
                        "image": image_name,
                        "files_fixed": True,
                        "fixed_files": fixed_files,
                    }
            except Exception as heal_err:
                logger.error("[self-heal] error during health watch: %s", heal_err)

        return {
            "status": "active",
            "container_id": container_id,
            "container_name": container_name,
            "port": port,
            "image": image_name,
        }
    async def stop(self, project_id: str) -> bool:
        """Stop and remove a deployed container."""
        container_name = f"viably-deploy-{project_id[:8]}"
        
        # Stop container
        await self._run_command(["docker", "stop", container_name], timeout=30)
        # Remove container
        await self._run_command(["docker", "rm", "-f", container_name], timeout=15)
        # Remove image
        image_name = f"viably-bot-{project_id[:8]}"
        await self._run_command(["docker", "rmi", "-f", image_name], timeout=15)
        
        return True

    async def get_status(self, project_id: str) -> dict:
        """Get deployment status."""
        container_name = f"viably-deploy-{project_id[:8]}"
        
        code, stdout, _ = await self._run_command([
            "docker", "inspect",
            "--format", "{{.State.Status}}:{{.State.StartedAt}}",
            container_name,
        ])
        
        if code != 0:
            return {"status": "not_found"}
        
        parts = stdout.strip().split(":", 1)
        return {
            "status": parts[0] if parts else "unknown",
            "started_at": parts[1] if len(parts) > 1 else None,
        }

    async def get_logs(self, project_id: str, tail: int = 100) -> str:
        """Get container logs."""
        container_name = f"viably-deploy-{project_id[:8]}"
        
        code, stdout, stderr = await self._run_command([
            "docker", "logs", "--tail", str(tail), container_name,
        ])
        
        return stdout + stderr if code == 0 else f"Error fetching logs: {stderr}"

    async def list_deployments(self) -> list[dict]:
        """List all active deployments."""
        code, stdout, _ = await self._run_command([
            "docker", "ps",
            "--filter", "name=viably-deploy-",
            "--format", "{{.Names}}\t{{.Status}}\t{{.Ports}}",
        ])
        
        if code != 0 or not stdout.strip():
            return []
        
        deployments = []
        for line in stdout.strip().split("\n"):
            parts = line.split("\t")
            if len(parts) >= 2:
                deployments.append({
                    "name": parts[0],
                    "status": parts[1],
                    "ports": parts[2] if len(parts) > 2 else "",
                })
        return deployments
