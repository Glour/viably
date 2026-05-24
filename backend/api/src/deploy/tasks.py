"""Celery tasks for asynchronous deployment processing.

This module provides Celery-based background tasks for processing
deployment requests asynchronously with real-time progress via Redis pub/sub.
"""

import asyncio
import logging
from uuid import UUID

import httpx

from api.celery_app import celery_app
from settings.config import settings
from core.pubsub import publish_deploy_error


logger = logging.getLogger(__name__)


async def _get_bot_username(token: str) -> str | None:
    """Call Telegram getMe to retrieve bot username from token."""
    if not token:
        return None
    try:
        import httpx as _httpx
        async with _httpx.AsyncClient(timeout=5) as _client:
            resp = await _client.get(f"https://api.telegram.org/bot{token}/getMe")
            if resp.status_code == 200:
                data = resp.json()
                return data.get("result", {}).get("username")
    except Exception as _e:
        logger.warning("Failed to get bot username: %s", _e)
    return None

def _get_deploy_suggestions(template_slug: str | None) -> list[str]:
    """Get deployment-specific suggestions based on template type."""
    base = [
        "Проверить бота в Telegram",
        "Настроить админ-панель",
    ]
    
    template_suggestions = {
        "booking-bot": [
            "Изменить список услуг",
            "Настроить рабочие часы",
            "Добавить фото к услугам",
        ],
        "shop-bot": [
            "Обновить каталог товаров", 
            "Добавить акции и скидки",
            "Настроить способы оплаты",
        ],
        "faq-bot": [
            "Добавить новые вопросы",
            "Настроить категории FAQ",
            "Добавить поиск по базе",
        ],
        "notification-bot": [
            "Создать первую рассылку",
            "Настроить приветственное сообщение",
            "Добавить категории подписок",
        ],
    }
    
    specific = template_suggestions.get(template_slug, [
        "Настроить приветственное сообщение",
        "Добавить новые команды",
    ])
    
    return (base + specific)[:5]


# =============================================================================

async def _check_bot_health(container_name: str, bot_token: str | None, timeout: int = 30) -> dict:
    """Check if deployed Telegram bot is healthy."""
    import subprocess
    
    result = {"healthy": False, "details": ""}
    
    # Wait for container to stabilize
    await asyncio.sleep(5)
    
    # Check 1: Container is running
    try:
        proc = subprocess.run(
            ["docker", "inspect", container_name, "--format", "{{.State.Status}}:{{.State.ExitCode}}:{{.RestartCount}}"],
            capture_output=True, text=True, timeout=10
        )
        if proc.returncode != 0:
            result["details"] = f"Container not found: {container_name}"
            return result
        
        status_parts = proc.stdout.strip().split(":")
        if len(status_parts) >= 3:
            status, exit_code, restarts = status_parts[0], status_parts[1], status_parts[2]
            if status != "running":
                # Get last logs for error details
                log_proc = subprocess.run(
                    ["docker", "logs", container_name, "--tail", "20"],
                    capture_output=True, text=True, timeout=10
                )
                result["details"] = f"Container not running (status={status}, exit={exit_code}). Logs: {log_proc.stdout[-500:]}{log_proc.stderr[-500:]}"
                return result
            if int(restarts) > 2:
                log_proc = subprocess.run(
                    ["docker", "logs", container_name, "--tail", "20"],
                    capture_output=True, text=True, timeout=10
                )
                result["details"] = f"Container crash-looping ({restarts} restarts). Logs: {log_proc.stdout[-500:]}{log_proc.stderr[-500:]}"
                return result
    except Exception as e:
        result["details"] = f"Container check failed: {str(e)}"
        return result
    
    # Check 2: Telegram API responds (if bot_token available)
    if bot_token:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"https://api.telegram.org/bot{bot_token}/getMe")
                data = resp.json()
                if data.get("ok"):
                    result["healthy"] = True
                    result["details"] = f"Bot @{data['result'].get('username', 'unknown')} is responding"
                else:
                    result["details"] = f"Telegram API error: {data.get('description', 'unknown')}"
        except Exception as e:
            result["details"] = f"Telegram API unreachable: {str(e)}"
    else:
        # No token available, just check container is stable
        await asyncio.sleep(10)
        try:
            proc2 = subprocess.run(
                ["docker", "inspect", container_name, "--format", "{{.State.Status}}:{{.RestartCount}}"],
                capture_output=True, text=True, timeout=10
            )
            if "running" in proc2.stdout and proc2.stdout.strip().endswith(":0"):
                result["healthy"] = True
                result["details"] = "Container stable (no restarts)"
            else:
                result["details"] = f"Container unstable: {proc2.stdout.strip()}"
        except Exception as e:
            result["details"] = f"Stability check failed: {str(e)}"
    
    return result


# =============================================================================
# Exception Classification
# =============================================================================

RETRYABLE_EXCEPTIONS = (
    httpx.TimeoutException,
    httpx.ConnectError,
    httpx.RemoteProtocolError,
)

PERMANENT_EXCEPTIONS = (
    httpx.HTTPStatusError,
    ValueError,
)


# =============================================================================
# Celery Tasks
# =============================================================================


@celery_app.task(
    name="process_deployment",
    bind=True,
    autoretry_for=RETRYABLE_EXCEPTIONS,
    retry_backoff=True,
    retry_backoff_max=600,
    max_retries=3,
    throws=PERMANENT_EXCEPTIONS,
)
def process_deployment(self, project_id: str, user_id: str, env_variables: dict) -> dict:
    """Process deployment asynchronously with streaming progress."""
    logger.info(
        "Starting async deployment",
        extra={
            "project_id": project_id,
            "user_id": user_id,
            "task_id": self.request.id,
            "retry_count": self.request.retries,
        },
    )

    try:
        result = asyncio.run(_process_deployment_async(project_id, user_id, env_variables))
        logger.info("Async deployment completed", extra={"project_id": project_id, "result": result})
        return result

    except PERMANENT_EXCEPTIONS as e:
        logger.error("Permanent deployment error", extra={"project_id": project_id, "error": str(e)})
        publish_deploy_error(user_id, project_id, str(e))
        raise

    except RETRYABLE_EXCEPTIONS as e:
        logger.warning("Retryable error, will retry", extra={"project_id": project_id, "error": str(e)})
        publish_deploy_error(
            user_id, project_id,
            f"Temporary error, retrying... (attempt {self.request.retries + 1}/{self.max_retries})",
        )
        raise

    except Exception as e:
        logger.error("Unexpected deployment error", extra={"project_id": project_id, "error": str(e)})
        publish_deploy_error(user_id, project_id, "Unexpected error during deployment")
        raise


# =============================================================================
# Pre-deploy Validation
# =============================================================================


def _ensure_bot_dependencies(files: dict[str, str]) -> dict[str, str]:
    """Ensure Python bot project has a dependency file for Docker build.

    If neither pyproject.toml nor requirements.txt exist, generate a
    requirements.txt from imports found in the code.
    """
    has_pyproject = "pyproject.toml" in files
    has_requirements = "requirements.txt" in files

    if has_pyproject or has_requirements:
        return files

    logger.warning("No dependency file found in generated code, auto-generating requirements.txt")

    # Scan all .py files for imports to detect needed packages
    known_packages = {
        "aiogram": "aiogram>=3.13",
        "dishka": "dishka>=1.3",
        "sqlalchemy": "sqlalchemy[asyncio]>=2.0",
        "asyncpg": "asyncpg>=0.29",
        "alembic": "alembic>=1.13",
        "pydantic": "pydantic>=2.5",
        "pydantic_settings": "pydantic-settings>=2.1",
        "aiohttp": "aiohttp>=3.9",
        "redis": "redis>=5.0",
        "celery": "celery>=5.3",
        "httpx": "httpx>=0.26",
        "aiofiles": "aiofiles>=23.0",
        "apscheduler": "apscheduler>=3.10",
        "aiosqlite": "aiosqlite>=0.19",
        "psycopg2": "psycopg2-binary>=2.9",
    }

    detected = set()
    for filepath, content in files.items():
        if not filepath.endswith(".py"):
            continue
        for pkg, req in known_packages.items():
            if f"import {pkg}" in content or f"from {pkg}" in content:
                detected.add(req)

    # Always include basics for bot projects
    if not detected:
        detected = {"aiogram>=3.13", "pydantic>=2.5", "pydantic-settings>=2.1"}

    requirements = "\n".join(sorted(detected)) + "\n"
    files = dict(files)  # copy to avoid mutating original
    files["requirements.txt"] = requirements
    logger.info("Auto-generated requirements.txt with %d packages: %s", len(detected), sorted(detected))
    return files


# =============================================================================
# Boilerplate Merge
# =============================================================================


def _post_merge_fixes(files: dict[str, str]) -> dict[str, str]:
    """Fix common AI generation mistakes after merge."""
    RESOLVE_CREATE = (
        "        # Resolve telegram_id to internal user_id\n"
        "        _user = await self.uow.users.get_by_telegram_id(user_id)\n"
        "        if _user:\n"
        "            user_id = _user.id\n"
        "        else:\n"
        "            _user = await self.uow.users.create(telegram_id=user_id, first_name=\'User\')\n"
        "            user_id = _user.id\n\n"
    )
    RESOLVE_SHORT = (
        "        # Resolve telegram_id to internal user_id\n"
        "        _user = await self.uow.users.get_by_telegram_id(user_id)\n"
        "        if _user:\n"
        "            user_id = _user.id\n\n"
    )


    import re as _re

    # Fix 1: di_container.py - AsyncSession -> AsyncIterable[AsyncSession] for generators
    di_file = "apps/bot/di_container.py"
    if di_file in files:
        di_content = files[di_file]
        if "yield session" in di_content and "AsyncIterable" not in di_content:
            di_content = di_content.replace(
                "from sqlalchemy.ext.asyncio import AsyncSession",
                "from collections.abc import AsyncIterable\nfrom sqlalchemy.ext.asyncio import AsyncSession",
            )
            di_content = _re.sub(
                r"(async def get_session\([^)]*\)\s*->\s*)AsyncSession(\s*:)",
                r"\1AsyncIterable[AsyncSession]\2",
                di_content,
            )
            files[di_file] = di_content
            logger.info("Fixed di_container.py: AsyncSession -> AsyncIterable[AsyncSession]")

    # Fix 2: Ensure psycopg2-binary in deps if alembic is used
    pyproject = "pyproject.toml"
    if pyproject in files:
        pt = files[pyproject]
        if "psycopg2" not in pt and "alembic" in pt:
            pt = pt.replace('alembic = ', 'psycopg2-binary = "^2.9"\nalembic = ')
            files[pyproject] = pt
            logger.info("Fixed pyproject.toml: added psycopg2-binary")

    # Fix 5: booking_service uses telegram_id from handlers but DB expects user.id
    bs_file = "apps/bot/services/booking_service.py"
    if bs_file in files:
        bs = files[bs_file]
        if "user_id: int" in bs and "get_by_telegram_id" not in bs:
            # Add resolution before "# Validate service exists" in create_booking
            marker1 = "        # Validate service exists"
            if marker1 in bs:
                bs = bs.replace(marker1, RESOLVE_CREATE + marker1, 1)

            # Add resolution before return in get_user_bookings
            marker2 = "        return await self.uow.bookings.get_upcoming(user_id)"
            if marker2 in bs:
                bs = bs.replace(marker2, RESOLVE_SHORT + marker2, 1)

            # Add resolution before booking lookup in cancel_booking
            marker3 = "        booking = await self.uow.bookings.get(booking_id)"
            if marker3 in bs:
                bs = bs.replace(marker3, RESOLVE_SHORT + marker3, 1)

            files[bs_file] = bs
            logger.info("Fixed booking_service.py: added telegram_id -> user_id resolution")

    # Fix 4: Replace full_name with first_name in user_service
    # Boilerplate User model has first_name/last_name, NOT full_name column
    us_file = "apps/bot/services/user_service.py"
    if us_file in files:
        us_content = files[us_file]
        if "full_name=" in us_content and "first_name=" not in us_content:
            us_content = us_content.replace("full_name=full_name", "first_name=full_name")
            us_content = us_content.replace("full_name: str", "full_name: str")  # keep param name
            files[us_file] = us_content
            logger.info("Fixed user_service.py: full_name -> first_name in create calls")

    # Fix 3: Remove back_populates from AI-generated models
    # AI generates back_populates="xxx" on User/Service, but boilerplate models
    # don't have these relationships, causing SQLAlchemy errors.
    _boilerplate_models = {"users.py", "base.py"}
    for filepath, file_content in list(files.items()):
        if not filepath.startswith("infrastructure/database/models/") or not filepath.endswith(".py"):
            continue
        fname = filepath.rsplit("/", 1)[-1]
        if fname in _boilerplate_models:
            continue
        # Remove back_populates from relationships
        if "back_populates=" in file_content:
            file_content = _re.sub(
                r',\s*back_populates\s*=\s*"[^"]*"',
                "",
                file_content,
            )
            files[filepath] = file_content
            logger.info("Removed back_populates from %s", filepath)

    return files


async def _merge_boilerplate(db, template_id, files: dict[str, str], force_category: str | None = None) -> dict[str, str]:
    """Merge boilerplate files with AI-generated files.

    Boilerplate serves as the base; AI-generated files override on top.
    This ensures infrastructure files (config, __init__.py, logging, etc.)
    are always present even if AI didn't include them in the response.
    """
    from sqlalchemy import select
    from infrastructure.database.models.templates import Template
    from api.src.ai.boilerplates.loader import BoilerplateLoader

    try:
        # Load raw boilerplate files
        from api.src.ai.boilerplates.loader import _TELEGRAM_BOT_FILES, _WEBAPP_FILES, _WEBSITE_FILES
        file_lists = {
            "telegram_bot": _TELEGRAM_BOT_FILES,
            "webapp": _WEBAPP_FILES,
            "website": _WEBSITE_FILES,
            "web": _WEBSITE_FILES,
            "web_app": _WEBAPP_FILES,
        }

        if force_category:
            category = force_category
        elif template_id:
            result = await db.execute(select(Template).where(Template.id == template_id))
            template = result.scalar_one_or_none()
            if not template:
                return files
            category = template.category
            if getattr(template, "slug", "") == "landing-page" and category in ("webapp", "web_app", ""):
                category = "website"
        else:
            return files

        loader = BoilerplateLoader(category)
        boilerplate_dir = loader._boilerplate_dir
        if not boilerplate_dir.exists():
            return files

        file_list = file_lists.get(category)
        if not file_list:
            return files

        merged = {}
        for rel_path in file_list:
            file_path = boilerplate_dir / rel_path
            if file_path.exists():
                try:
                    merged[rel_path] = file_path.read_text(encoding="utf-8")
                except Exception:
                    pass

        # Boilerplate infrastructure files take priority (AI often generates incomplete versions)
        # AI-generated files override boilerplate only for non-infrastructure files
        _PROTECTED_PREFIXES = (
            "pyproject.toml",
            "alembic.ini",
            "shared/",
            "infrastructure/database/core/",
            "infrastructure/database/models/base.py",
            "infrastructure/database/models/users.py",
            "infrastructure/database/repositories/user_repository.py",
            "infrastructure/database/repositories/base.py",
            "infrastructure/monitoring/",
            "infrastructure/services/",
            "infrastructure/migrations/env.py",
            "config/settings/",
            # Webapp build tooling — always use boilerplate versions
            # AI often generates these with wrong build commands or missing deps
            "package.json",
            "vite.config.ts",
            "tsconfig.json",
            "tsconfig.app.json",
            "tsconfig.node.json",
            "tailwind.config.js",
            "postcss.config.js",
        )
        for filepath, content_str in files.items():
            is_protected = any(filepath.startswith(p) or filepath == p for p in _PROTECTED_PREFIXES)
            if is_protected and filepath in merged:
                # Keep boilerplate version for protected infrastructure files
                logger.info("Keeping boilerplate version: %s", filepath)
                continue
            merged[filepath] = content_str
        added = len(merged) - len(files)
        if added > 0:
            logger.info(
                "Merged %d boilerplate files with %d AI-generated files (total: %d)",
                added, len(files), len(merged),
            )

        # Post-merge fixes for common AI mistakes
        merged = _post_merge_fixes(merged)

        return merged
    except Exception as e:
        logger.warning("Failed to merge boilerplate: %s", e)
        return files


# =============================================================================
# Async Implementation
# =============================================================================


def _create_fresh_session_maker():
    """Create a fresh async engine and session maker for Celery worker context."""
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, session_maker


# Keys worth persisting across deploys (bot token, DB credentials, etc.)
_PERSISTABLE_ENV_KEYS = {
    "TELEGRAM_BOT_TOKEN",
    "BOT_TOKEN",
    "BOT__TOKEN",
    "DATABASE_URL",
    "POSTGRES__DB_HOST",
    "POSTGRES__DB_PORT",
    "POSTGRES__DB_USER",
    "POSTGRES__DB_NAME",
}
# Keys that are ephemeral / per-deploy and should NOT be saved
_EPHEMERAL_ENV_KEYS = {"DEPLOY_TYPE", "SUBDOMAIN"}


def _env_vars_to_save(env_variables: dict) -> dict:
    """Extract env vars worth persisting (token, DB URL, etc.)."""
    return {
        k: v for k, v in env_variables.items()
        if k not in _EPHEMERAL_ENV_KEYS and v
    }


async def _restore_env_from_previous_deploy(
    db, project_id: str, env_variables: dict
) -> dict:
    """Merge env vars from the last successful deployment if caller omitted them.

    For example, if user clicks Re-deploy without re-entering the bot token,
    this function will pull the token from the previous deployment's platform_data.
    """
    from sqlalchemy import select
    from infrastructure.database.models.deploy import Deployment

    # Only restore if key env vars are missing
    has_token = bool(env_variables.get("TELEGRAM_BOT_TOKEN"))
    has_db_url = bool(env_variables.get("DATABASE_URL"))

    if has_token and has_db_url:
        return env_variables  # user provided everything

    try:
        result = await db.execute(
            select(Deployment)
            .where(
                Deployment.project_id == UUID(project_id),
                Deployment.status == "active",
            )
            .order_by(Deployment.deployed_at.desc())
            .limit(1)
        )
        prev_deploy = result.scalar_one_or_none()

        if not prev_deploy or not prev_deploy.platform_data:
            return env_variables

        saved_env = prev_deploy.platform_data.get("saved_env", {})
        if not saved_env:
            return env_variables

        merged = dict(env_variables)
        restored_keys = []
        for key in _PERSISTABLE_ENV_KEYS:
            if not merged.get(key) and saved_env.get(key):
                merged[key] = saved_env[key]
                restored_keys.append(key)

        if restored_keys:
            logger.info(
                "Restored env vars from previous deployment: %s",
                ", ".join(restored_keys),
            )

        return merged
    except Exception as e:
        logger.warning("Failed to restore env vars from previous deploy: %s", e)
        return env_variables


async def _process_deployment_async(project_id: str, user_id: str, env_variables: dict) -> dict:
    """Async deployment using DockerDeployClient or WebsiteDeployClient."""
    from sqlalchemy import select
    from datetime import datetime, timezone

    from core.pubsub import publish_deploy_progress, publish_deploy_complete
    from infrastructure.database.models.deploy import Deployment
    from infrastructure.services.docker_deploy import DockerDeployClient
    from infrastructure.services.website_deploy import WebsiteDeployClient
    from api.src.deploy.schemas import DeploymentStatus
    from infrastructure.database.models.projects import Project, ProjectStatus

    engine, session_maker = _create_fresh_session_maker()

    try:
        async with session_maker() as db:
            try:
                # Restore env variables from last successful deployment if not provided
                env_variables = await _restore_env_from_previous_deploy(
                    db, project_id, env_variables
                )

                # Step 1: Validate project (0-10%)
                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=1, step_name="Validating project", step_status="running",
                    progress=0, log="Checking project status...",
                )

                result = await db.execute(
                    select(Project).where(
                        Project.id == UUID(project_id),
                        Project.user_id == UUID(user_id),
                    )
                )
                project = result.scalar_one_or_none()

                if not project:
                    raise ValueError("Project not found")
                deployable_statuses = (
                    ProjectStatus.READY.value,
                    ProjectStatus.DEPLOYED.value,
                    ProjectStatus.ERROR.value,
                )
                if project.status not in deployable_statuses:
                    raise ValueError(f"Project must be in 'ready', 'deployed', or 'error' status to deploy")
                if not project.generated_code:
                    raise ValueError("No generated code to deploy")

                # Load template to get slug for suggestions
                template_slug = None
                if project.template_id:
                    from infrastructure.database.models.templates import Template
                    template_result = await db.execute(
                        select(Template).where(Template.id == project.template_id)
                    )
                    template = template_result.scalar_one_or_none()
                    if template:
                        template_slug = template.slug

                # Create deployment record
                deployment = Deployment(
                    project_id=UUID(project_id),
                    platform="docker",
                    status=DeploymentStatus.PENDING.value,
                )
                db.add(deployment)
                await db.commit()
                await db.refresh(deployment)

                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=1, step_name="Validating project", step_status="complete",
                    progress=10, log="Project validated successfully",
                )

                # Step 2: Preparing (10-30%)
                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=2, step_name="Preparing deployment", step_status="running",
                    progress=10, log="Preparing project files...",
                )

                project.status = ProjectStatus.DEPLOYING.value
                await db.commit()

                files = project.generated_code.get("files", {})
                runtime = project.generated_code.get("runtime", "python")
                entry_point = project.generated_code.get("entry_point", "main.py")

                # Auto-detect runtime from project files
                is_website = env_variables.get("DEPLOY_TYPE") == "website"
                file_extensions = {f.rsplit(".", 1)[-1].lower() for f in files if "." in f}
                web_extensions = {"html", "css", "js", "svg", "png", "jpg", "ico", "json"}

                # Detect React/Vite webapp: package.json + vite.config.ts + .tsx files
                has_package_json = "package.json" in files
                has_vite_config = "vite.config.ts" in files or "vite.config.js" in files
                has_tsx_files = any(f.endswith(".tsx") or f.endswith(".jsx") for f in files)
                if has_package_json and (has_vite_config or has_tsx_files):
                    runtime = "webapp"
                    is_website = True  # webapp → nginx static deploy (after vite build)
                elif has_tsx_files:
                    # React component(s) without full project scaffold — treat as webapp
                    runtime = "webapp"
                    is_website = True  # webapp → nginx static deploy (after vite build)
                elif file_extensions and file_extensions.issubset(web_extensions):
                    is_website = True
                    runtime = "static"

                # Merge boilerplate FIRST: base template files + AI-generated overrides
                # For webapp projects deployed via nginx, we MUST merge boilerplate so
                # package.json / vite.config.ts / index.html are present for npm build.
                should_merge = (not is_website or runtime == "webapp") and (project.template_id or runtime == "webapp")
                if should_merge:
                    # Normalize AI-generated fallback filenames before merge:
                    # "file.tsx" -> "src/pages/Home.tsx" (AI default when no filename comment)
                    if runtime == "webapp":
                        normalized = {}
                        for fname, fcontent in files.items():
                            if fname in ("file.tsx", "file.jsx", "file.ts"):
                                logger.info("Remapping %s -> src/pages/Home.tsx", fname)
                                normalized["src/pages/Home.tsx"] = fcontent
                            else:
                                normalized[fname] = fcontent
                        files = normalized
                    # For allow_empty web projects, use the saved category hint when available.
                    force_cat = None
                    if runtime == "webapp" and not project.template_id:
                        project_config = project.config if isinstance(project.config, dict) else {}
                        force_cat = project_config.get("category") or "webapp"
                    files = await _merge_boilerplate(db, project.template_id, files, force_category=force_cat)

                # Pre-deploy validation AFTER merge: scan all files for dependencies
                if not is_website and runtime in ("python", "python3", ""):
                    files = _ensure_bot_dependencies(files)

                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=2, step_name="Preparing deployment", step_status="complete",
                    progress=30, log=f"Prepared {len(files)} files for deployment",
                )

                deployment.status = DeploymentStatus.BUILDING.value
                await db.commit()

                if is_website:
                    # Website: deploy via nginx
                    publish_deploy_progress(
                        user_id=user_id, project_id=project_id,
                        step=3, step_name="Deploying to hosting", step_status="running",
                        progress=30, log="Publishing site files...",
                    )
                    subdomain = env_variables.get("SUBDOMAIN") or project_id[:8]
                    website_client = WebsiteDeployClient()
                    deploy_result = await website_client.deploy(
                        project_id=project_id,
                        files=files,
                        subdomain=subdomain,
                    )
                    if deploy_result.get("status") == "failed":
                        raise RuntimeError(deploy_result.get("error", "Website deployment failed"))

                    url = deploy_result.get("url", f"https://{subdomain}.viably.dev")
                    deployment.external_id = deploy_result.get("subdomain", subdomain)
                    deployment.platform = "website"
                    deployment.platform_data = {
                        "subdomain": subdomain,
                        "fqdn": deploy_result.get("fqdn", ""),
                        "saved_env": _env_vars_to_save(env_variables),
                    }
                    bot_token = None
                    bot_username = None
                    bot_url = None
                else:
                    # Bot: deploy via Docker
                    docker_client = DockerDeployClient()

                    # Auto-provision database for bots that need it
                    if (
                        not env_variables.get("DATABASE_URL")
                        and docker_client._project_needs_database(files)
                    ):
                        try:
                            logger.info(
                                "auto_provisioning_database",
                                extra={"project_id": project_id},
                            )
                            publish_deploy_progress(
                                user_id=user_id, project_id=project_id,
                                step=3, step_name="Provisioning database", step_status="running",
                                progress=30, log="Creating database for bot...",
                            )
                            db_info = await docker_client.provision_database(project_id)
                            env_variables["DATABASE_URL"] = db_info["database_url"]
                            env_variables["POSTGRES__DB_HOST"] = db_info["db_host"]
                            env_variables["POSTGRES__DB_PORT"] = str(db_info["db_port"])
                            env_variables["POSTGRES__DB_USER"] = db_info["db_user"]
                            env_variables["POSTGRES__DB_NAME"] = db_info["db_name"]
                            logger.info(
                                "database_provisioned",
                                extra={"db_name": db_info["db_name"]},
                            )
                        except Exception as db_error:
                            logger.error(
                                "database_provisioning_failed",
                                extra={"error": str(db_error)},
                            )

                    publish_deploy_progress(
                        user_id=user_id, project_id=project_id,
                        step=3, step_name="Building Docker image", step_status="running",
                        progress=35, log="Building Docker container...",
                    )
                    # Validate Python syntax before Docker build
                    syntax_errors = []
                    for filepath, content_str in files.items():
                        if filepath.endswith(".py"):
                            try:
                                compile(content_str, filepath, "exec")
                            except SyntaxError as e:
                                syntax_errors.append(f"{filepath}:{e.lineno}: {e.msg}")
                    
                    if syntax_errors:
                        error_msg = "Python syntax errors found:\n" + "\n".join(syntax_errors[:5])
                        logger.error("syntax_validation_failed", extra={"errors": syntax_errors})
                        publish_deploy_progress(
                            user_id=user_id, project_id=project_id,
                            step=3, step_name="Code validation", step_status="error",
                            progress=25, log=error_msg,
                        )
                        raise RuntimeError(f"Syntax errors in generated code: {error_msg}")


                    deploy_result = await docker_client.deploy(
                        project_id=project_id,
                        files=files,
                        runtime=runtime,
                        entry_point=entry_point,
                        env_vars=env_variables,
                    )
                    if deploy_result.get("status") == "failed":
                        raise RuntimeError(deploy_result.get("error", "Docker deployment failed"))

                    deployment.platform_data = {
                        "container_id": deploy_result.get("container_id", ""),
                        "container_name": deploy_result.get("container_name", ""),
                        "port": deploy_result.get("port"),
                        "image": deploy_result.get("image", ""),
                        "saved_env": _env_vars_to_save(env_variables),
                    }
                    # Get bot username from Telegram API
                    bot_token = env_variables.get("TELEGRAM_BOT_TOKEN", "")
                    bot_username = await _get_bot_username(bot_token) if bot_token else None
                    bot_url = f"https://t.me/{bot_username}" if bot_username else None
                    # For bots, url is the t.me link (or internal docker ref)
                    url = bot_url or f"docker://{deploy_result.get('container_name', '')}"

                    # Post-deploy health check for Telegram bots
                    bot_token = env_variables.get("TELEGRAM_BOT_TOKEN") or env_variables.get("BOT__TOKEN")
                    container_name = deploy_result.get("container_name", f"viably-deploy-{project_id[:8]}")
                    
                    try:
                        health = await _check_bot_health(
                            container_name=container_name,
                            bot_token=bot_token,
                        )
                        
                        if health["healthy"]:
                            publish_deploy_progress(
                                user_id=user_id, project_id=project_id,
                                step=5, step_name="Health check", step_status="completed",
                                progress=85, log=f"✅ {health['details']}",
                            )
                        else:
                            publish_deploy_progress(
                                user_id=user_id, project_id=project_id,
                                step=5, step_name="Health check", step_status="warning",
                                progress=85, log=f"⚠️ {health['details']}",
                            )
                    except Exception as health_error:
                        logger.warning("Health check failed", extra={"error": str(health_error)})
                        publish_deploy_progress(
                            user_id=user_id, project_id=project_id,
                            step=5, step_name="Health check", step_status="warning",
                            progress=85, log=f"⚠️ Health check error: {str(health_error)}",
                        )



                await db.commit()

                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=4, step_name="Starting service", step_status="complete",
                    progress=70, log="Service deployed successfully",
                )

                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=5, step_name="Service running", step_status="complete",
                    progress=90, log="Service is live",
                )

                # Step 6: Finalize (90-100%)
                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=6, step_name="Finalizing", step_status="running",
                    progress=90, log="Finalizing deployment...",
                )

                deployment.url = url
                deployment.status = DeploymentStatus.ACTIVE.value
                deployment.deployed_at = datetime.now(timezone.utc)

                project.status = ProjectStatus.DEPLOYED.value
                project.deployed_url = url
                project.deployed_at = datetime.now(timezone.utc)

                await db.commit()
                await db.refresh(deployment)

                publish_deploy_progress(
                    user_id=user_id, project_id=project_id,
                    step=6, step_name="Finalizing", step_status="complete",
                    progress=100, log="Deployment finalized",
                )

                publish_deploy_complete(
                    user_id=user_id, project_id=project_id,
                    deployment_info={
                        "id": str(deployment.id),
                        "url": url,
                        "status": DeploymentStatus.ACTIVE.value,
                        "deployed_at": deployment.deployed_at.isoformat(),
                        "platform": deployment.platform,
                        "container_name": (deployment.platform_data or {}).get("container_name", ""),
                        "botUsername": bot_username,
                        "botUrl": bot_url,
                        "suggestions": _get_deploy_suggestions(template_slug),
                    },
                )
                # Send success email
                try:
                    from api.celery_tasks.email_tasks import send_template_email_task
                    from infrastructure.database.models.auth import User

                    user_result = await db.execute(
                        select(User).where(User.id == project.user_id)
                    )
                    user = user_result.scalar_one_or_none()

                    if user:
                        base_url = settings.CORS_ORIGINS.split(',')[0]
                        is_bot = bool(bot_token)
                        deploy_type_label = "Bot" if is_bot else "Site"
                        send_template_email_task.delay(
                            template_name="deploy-success",
                            email_type="deploy_success",
                            recipient=user.email,
                            subject=f"Your {deploy_type_label} '{project.name}' is live! 🚀",
                            template_props={
                                "userName": user.full_name or user.email.split("@")[0],
                                "projectName": project.name,
                                "deploymentUrl": url,
                                "platform": "docker",
                                "deployedAt": datetime.now(timezone.utc).isoformat(),
                                "projectUrl": f"{base_url}/projects/{project.id}",
                            },
                            user_id=str(user.id),
                        )
                except Exception as email_error:
                    logger.error("Failed to queue deployment email", extra={"error": str(email_error)})

                return {
                    "deployment_id": str(deployment.id),
                    "url": url,
                    "status": DeploymentStatus.ACTIVE.value,
                }

            except PERMANENT_EXCEPTIONS as e:
                logger.error("Permanent deployment error", extra={"project_id": project_id, "error": str(e)})
                if 'deployment' in locals():
                    deployment.status = DeploymentStatus.FAILED.value
                    deployment.error_message = str(e)
                if 'project' in locals():
                    project.status = ProjectStatus.ERROR.value
                    project.error_message = f"Deployment failed: {str(e)}"
                await db.commit()
                raise

            except Exception as e:
                logger.error("Deployment error", extra={"project_id": project_id, "error": str(e)})
                if 'deployment' in locals():
                    deployment.status = DeploymentStatus.FAILED.value
                    deployment.error_message = str(e)
                if 'project' in locals():
                    project.status = ProjectStatus.ERROR.value
                    project.error_message = f"Deployment failed: {str(e)}"
                await db.commit()
                raise
    finally:
        await engine.dispose()
