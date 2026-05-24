"""
Self-healing deploy: after container starts, watches logs for errors
and auto-fixes them. Up to MAX_HEAL_ATTEMPTS iterations.
"""
import asyncio
import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)

MAX_HEAL_ATTEMPTS = 3
WATCH_SECONDS = 15  # wait after start before reading logs


# ── Known error patterns → fixers ────────────────────────────────────────────

async def _check_container_alive(container_name: str) -> bool:
    proc = await asyncio.create_subprocess_exec(
        "docker", "inspect", "-f", "{{.State.Running}}", container_name,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    out, _ = await proc.communicate()
    return out.strip() == b"true"


async def _get_logs(container_name: str, tail: int = 60) -> str:
    proc = await asyncio.create_subprocess_exec(
        "docker", "logs", "--tail", str(tail), container_name,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    return (out + err).decode("utf-8", errors="replace")


def _detect_errors(logs: str) -> list[dict]:
    """Return list of detected errors with type and details."""
    errors = []

    # ModuleNotFoundError
    for m in re.finditer(r"ModuleNotFoundError: No module named '([^']+)'", logs):
        errors.append({"type": "missing_module", "module": m.group(1)})

    # TypeError: dishka AsyncSession / AsyncIterable
    if "Unsupported return type `sqlalchemy.ext.asyncio.session.AsyncSession`" in logs:
        errors.append({"type": "dishka_async_session"})

    # ImportError
    for m in re.finditer(r"ImportError: cannot import name '([^']+)' from '([^']+)'", logs):
        errors.append({"type": "import_error", "name": m.group(1), "module": m.group(2)})

    # SyntaxError
    for m in re.finditer(r'SyntaxError: (.+?)(?:\n|$)', logs):
        errors.append({"type": "syntax_error", "detail": m.group(1)})

    return errors


def _apply_fixes(files: Dict[str, str], errors: list[dict]) -> tuple[Dict[str, str], list[str]]:
    """Apply auto-fixes to files dict. Returns (fixed_files, fix_descriptions)."""
    fixes = []

    for err in errors:
        if err["type"] == "missing_module":
            module_path = err["module"].replace(".", "/") + ".py"
            # Only create simple stub modules we know the shape of
            if err["module"] == "shared.enums" or module_path not in files:
                stub = _generate_module_stub(err["module"], files)
                if stub:
                    files[module_path] = stub
                    fixes.append(f"created stub: {module_path}")

        elif err["type"] == "dishka_async_session":
            key = "apps/bot/di_container.py"
            if key in files:
                di = files[key]
                if "from collections.abc import AsyncIterable" not in di:
                    di = di.replace(
                        "from dishka import Provider, Scope, provide",
                        "from collections.abc import AsyncIterable\nfrom dishka import Provider, Scope, provide",
                    )
                di = di.replace(
                    "async def get_session(self, settings: AppSettings) -> AsyncSession:",
                    "async def get_session(self, settings: AppSettings) -> AsyncIterable[AsyncSession]:",
                )
                files[key] = di
                fixes.append("fixed di_container.py: AsyncIterable return type")

        elif err["type"] == "import_error":
            fixes.append(f"import_error in {err['module']}: {err['name']} — skipped (needs manual fix)")

    return files, fixes


def _generate_module_stub(module_name: str, existing_files: Dict[str, str]) -> Optional[str]:
    """Generate a best-effort stub for a missing module."""
    known_stubs = {
        "shared.enums": '''"""Shared enumerations."""
from enum import Enum


class Language(str, Enum):
    RU = "ru"
    EN = "en"


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    BLOCKED = "blocked"
    INACTIVE = "inactive"
''',
        "shared.constants": '''"""Shared constants."""
''',
        "shared.utils": '''"""Shared utilities."""
''',
        "core.exceptions": '''"""Core exceptions."""

class AppException(Exception):
    pass

class NotFoundException(AppException):
    pass

class ValidationException(AppException):
    pass
''',
    }
    if module_name in known_stubs:
        return known_stubs[module_name]

    # Generic empty module stub
    return f'"""{module_name} — auto-generated stub."""\n'


# ── Main self-heal loop ───────────────────────────────────────────────────────

async def self_healing_watch(
    container_name: str,
    image_name: str,
    files: Dict[str, str],
    run_cmd_fn,          # callable: async (cmd) -> (code, stdout, stderr)
    build_fn,            # callable: async (files) -> (code, stdout, stderr)
    run_fn,              # callable: async () -> (code, stdout, stderr)
    progress_fn=None,    # optional: async (step, msg) -> None
) -> tuple[bool, Dict[str, str]]:
    """
    Watch container after deploy. Auto-fix errors and restart.
    Returns (success: bool, possibly_fixed_files: dict)
    """
    for attempt in range(1, MAX_HEAL_ATTEMPTS + 1):
        # Wait for container to produce logs
        logger.info("[self-heal] attempt %d/%d — watching %s for %ds",
                    attempt, MAX_HEAL_ATTEMPTS, container_name, WATCH_SECONDS)
        await asyncio.sleep(WATCH_SECONDS)

        alive = await _check_container_alive(container_name)
        logs = await _get_logs(container_name, tail=80)
        errors = _detect_errors(logs)

        if alive and not errors:
            logger.info("[self-heal] container healthy ✓")
            return True, files

        if not alive:
            logger.warning("[self-heal] container not running, logs:\n%s", logs[-800:])

        if not errors:
            # Container is alive but no detectable errors — assume healthy
            if alive:
                return True, files
            errors = [{"type": "unknown", "log": logs[-200:]}]

        logger.warning("[self-heal] detected errors: %s", errors)

        if progress_fn:
            await progress_fn(f"🔧 Авто-фикс (попытка {attempt}): {[e['type'] for e in errors]}")

        files, fix_descs = _apply_fixes(files, errors)
        logger.info("[self-heal] fixes applied: %s", fix_descs)

        if not fix_descs:
            logger.error("[self-heal] no fixes available for errors: %s", errors)
            return False, files

        # Rebuild image with fixed files
        logger.info("[self-heal] rebuilding image...")
        if progress_fn:
            await progress_fn(f"🔨 Пересборка образа после фикса...")

        code, _, stderr = await build_fn(files)
        if code != 0:
            logger.error("[self-heal] rebuild failed: %s", stderr[:500])
            return False, files

        # Remove old container and restart
        await run_cmd_fn(["docker", "rm", "-f", container_name])
        code, stdout, stderr = await run_fn()
        if code != 0:
            logger.error("[self-heal] restart failed: %s", stderr[:500])
            return False, files

        logger.info("[self-heal] restarted successfully after fix")

    logger.error("[self-heal] exceeded max attempts (%d)", MAX_HEAL_ATTEMPTS)
    return False, files
