"""Boilerplate loader for template-based generation.

Loads pre-built project files as AI context so the model can modify
an existing architecture instead of generating code from scratch.
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Directory containing embedded boilerplate files
_BOILERPLATES_DIR = Path(__file__).parent

# Files to include per category, relative to boilerplate root
_TELEGRAM_BOT_FILES: list[str] = [
    "pyproject.toml",
    "Dockerfile",
    "alembic.ini",
    "config/__init__.py",
    "config/settings/__init__.py",
    "config/settings/base.py",
    "config/settings/bot.py",
    "config/settings/database.py",
    "infrastructure/__init__.py",
    "infrastructure/database/__init__.py",
    "infrastructure/database/core/__init__.py",
    "infrastructure/database/core/session.py",
    "infrastructure/database/models/__init__.py",
    "infrastructure/database/models/base.py",
    "infrastructure/database/models/users.py",
    "infrastructure/database/repositories/__init__.py",
    "infrastructure/database/repositories/base.py",
    "infrastructure/database/repositories/user_repository.py",
    "infrastructure/database/uow.py",
    "infrastructure/monitoring/__init__.py",
    "infrastructure/monitoring/logging.py",
    "shared/__init__.py",
    "shared/enums/__init__.py",
    "shared/dto/__init__.py",
    "shared/dto/user.py",
    "shared/exceptions/__init__.py",
    "shared/exceptions/base.py",
    "apps/__init__.py",
    "apps/bot/__init__.py",
    "apps/bot/main.py",
    "apps/bot/di_container.py",
    "apps/bot/handlers/__init__.py",
    "apps/bot/handlers/errors.py",
    "apps/bot/handlers/user/__init__.py",
    "apps/bot/handlers/user/start.py",
    "apps/bot/services/__init__.py",
    "apps/bot/services/user_service.py",
    "apps/bot/keyboards/__init__.py",
    "apps/bot/keyboards/common.py",
    "apps/bot/filters/__init__.py",
    "apps/bot/filters/admin.py",
    "apps/bot/middlewares/__init__.py",
    "apps/bot/middlewares/logging_middleware.py",
    "apps/bot/states/__init__.py",
    "infrastructure/services/__init__.py",
    "infrastructure/services/schema_validator.py",
    "infrastructure/services/create_tables_helper.py",
    "infrastructure/services/seed_data.py",
    "infrastructure/migrations/env.py",
]

_WEBAPP_FILES: list[str] = [
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "index.html",
    "src/index.css",
    "src/main.tsx",
    "src/App.tsx",
    "src/lib/utils.ts",
    "src/pages/Home.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/avatar.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/separator.tsx",
    "src/components/ui/tooltip.tsx",
    "src/components/ui/hero-background.tsx",
]

_WEBSITE_FILES: list[str] = [
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "index.html",
    "src/index.css",
    "src/main.tsx",
    "src/App.tsx",
    "src/lib/utils.ts",
    "src/content/site.ts",
    "src/pages/Home.tsx",
    "src/components/landing/Header.tsx",
    "src/components/landing/Hero.tsx",
    "src/components/landing/Features.tsx",
    "src/components/landing/Metrics.tsx",
    "src/components/landing/CTA.tsx",
    "src/components/landing/Footer.tsx",
    "src/components/ui/button.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/hero-background.tsx",
]


class BoilerplateLoader:
    """Loads boilerplate project files for AI context."""

    def __init__(self, category: str) -> None:
        self.category = category
        if category in ("webapp", "web_app"):
            self._boilerplate_dir = _BOILERPLATES_DIR / "webapp"
        elif category in ("website", "web"):
            self._boilerplate_dir = _BOILERPLATES_DIR / "website"
        else:
            self._boilerplate_dir = _BOILERPLATES_DIR / category

    def load(self) -> str | None:
        """Load all boilerplate files as a formatted string for AI context.

        Returns:
            Formatted string with all files, or None if category not supported.
        """
        if self.category == "telegram_bot":
            return self._load_files(_TELEGRAM_BOT_FILES)
        if self.category in ("webapp", "web_app"):
            return self._load_files(_WEBAPP_FILES)
        if self.category in ("website", "web"):
            return self._load_files(_WEBSITE_FILES)
        return None

    def _load_files(self, file_list: list[str]) -> str | None:
        """Load files from the boilerplate directory.

        Args:
            file_list: List of relative file paths to load.

        Returns:
            Formatted context string or None if directory doesn't exist.
        """
        if not self._boilerplate_dir.exists():
            logger.warning("Boilerplate directory not found: %s", self._boilerplate_dir)
            return None

        parts = [
            "## Existing Project Files (Boilerplate)\n\n"
            "Below is the complete project that you must use as a base. "
            "Modify, extend, and add files as needed to fulfill the user's request. "
            "Keep the existing architecture intact.\n\n"
            "**CRITICAL RULES:**\n"
            "1. Output ONLY files that you CREATE NEW or MODIFY. "
            "Unchanged boilerplate files are automatically included by the system — "
            "do NOT repeat them in your response.\n"
            "2. This is a customization task, not a greenfield rebuild. "
            "Prefer the SMALLEST possible set of changed files that fulfills the request.\n"
            "3. If a page/section/component already exists in the boilerplate, MODIFY IT instead of rebuilding the whole project.\n"
            "4. If you need to CHANGE a boilerplate file (e.g. add imports to __init__.py, "
            "register new routers in main.py), output the COMPLETE modified file.\n"
            "5. When adding new models/repositories/services, follow the registration checklist: "
            "update models/__init__.py, repositories/__init__.py, uow.py, di_container.py, and "
            "register routers in main.py.\n"
            "6. Every directory containing .py files MUST have an __init__.py file.\n"
            "7. Use `config.settings.base.get_settings()` for configuration — never hardcode values.\n"
            "8. **EVERY file you import MUST exist.** If you write `import X from './components/Y'`, "
            "you MUST include the file `components/Y.tsx` in your output. "
            "Never import a component you did not create or that is not in the boilerplate.\n"
            "9. Before finishing, verify: for each import statement in every file you output, "
            "confirm the imported file either exists in the boilerplate above OR is in your output.\n"
            "10. Do NOT send a full project dump when only a few files changed. The system will merge your changed files into this boilerplate automatically.\n"
            "11. If the boilerplate contains default branding or generic marketing copy, replace that visible content in the existing content-bearing files so the final project matches the user's request.\n"
        ]

        loaded = 0
        for rel_path in file_list:
            file_path = self._boilerplate_dir / rel_path
            if not file_path.exists():
                logger.debug("Boilerplate file not found: %s", file_path)
                continue

            try:
                content = file_path.read_text(encoding="utf-8")
                ext = file_path.suffix.lstrip(".")
                lang = _ext_to_lang(ext)
                parts.append(f"```{lang}\n# filename: {rel_path}\n{content}\n```\n")
                loaded += 1
            except Exception as e:
                logger.warning("Failed to read boilerplate file %s: %s", file_path, e)

        if loaded == 0:
            return None

        logger.info("Loaded %d boilerplate files for category=%s", loaded, self.category)
        return "\n".join(parts)


def _ext_to_lang(ext: str) -> str:
    """Map file extension to code block language."""
    return {
        "py": "python",
        "toml": "toml",
        "ini": "ini",
        "yml": "yaml",
        "yaml": "yaml",
        "json": "json",
        "md": "markdown",
        "txt": "text",
        "cfg": "ini",
        "ts": "typescript",
        "tsx": "tsx",
        "js": "javascript",
        "jsx": "jsx",
        "css": "css",
        "html": "html",
    }.get(ext, "text")
