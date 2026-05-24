"""Output validation for generated code files."""

import re
import sys

import structlog

from api.src.ai.models.validation import ValidationError, ValidationResult

logger = structlog.get_logger(__name__)


def _camel_to_snake(name: str) -> str:
    """Convert CamelCase to snake_case."""
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


# Placeholder patterns that should not appear in generated code
_PLACEHOLDER_PATTERNS = [
    (r"\{\{[^}]+\}\}", "PLACEHOLDER_TEMPLATE"),
    (r"\[Your [^\]]+\]", "PLACEHOLDER_YOUR"),
    (r"\[Ваш[^\]]*\]", "PLACEHOLDER_YOUR_RU"),
    (r"example\.com", "PLACEHOLDER_DOMAIN"),
    (r"Lorem ipsum", "PLACEHOLDER_LOREM"),
]

# Known third-party packages with their pyproject.toml dependency lines
KNOWN_PACKAGES: dict[str, str] = {
    "aiogram": '"aiogram" = "^3.13.1"',
    "dishka": '"dishka" = "^1.4.2"',
    "sqlalchemy": '"sqlalchemy" = {version = "^2.0.36", extras = ["asyncio"]}',
    "alembic": '"alembic" = "^1.14.0"',
    "asyncpg": '"asyncpg" = "^0.30.0"',
    "pydantic": '"pydantic" = "^2.10.3"',
    "pydantic_settings": '"pydantic-settings" = "^2.7.0"',
    "structlog": '"structlog" = "^24.4.0"',
    "aiohttp": '"aiohttp" = "^3.11.11"',
    "redis": '"redis" = "^5.2.1"',
    "apscheduler": '"apscheduler" = "^3.10.4"',
}

# Python standard library module names (3.12)
_STDLIB_MODULES: frozenset[str] = frozenset(sys.stdlib_module_names)


class OutputValidator:
    """Validate generated code files for common issues."""

    def validate(self, files: dict[str, str]) -> ValidationResult:
        """Validate all generated files.

        Args:
            files: Dict mapping filename to content.

        Returns:
            ValidationResult with errors and warnings.
        """
        errors: list[ValidationError] = []
        warnings: list[ValidationError] = []

        for path, content in files.items():
            file_errors, file_warnings = self._validate_file(path, content)
            errors.extend(file_errors)
            warnings.extend(file_warnings)

        # Telegram bot-specific validation
        if self._is_telegram_bot(files):
            logger.info("telegram_bot_detected", file_count=len(files))
            bot_errors, bot_warnings = self._validate_telegram_bot(files)
            errors.extend(bot_errors)
            warnings.extend(bot_warnings)

        # Dependency validation
        if "pyproject.toml" in files:
            dep_errors, dep_warnings = self._validate_dependencies(files)
            errors.extend(dep_errors)
            warnings.extend(dep_warnings)

        passed = len(errors) == 0
        return ValidationResult(
            passed=passed,
            errors=errors,
            warnings=warnings,
        )

    def validate_and_fix(
        self, files: dict[str, str]
    ) -> tuple[dict[str, str], ValidationResult]:
        """Validate and auto-fix where possible.

        Args:
            files: Dict mapping filename to content.

        Returns:
            Tuple of (fixed_files, validation_result).
        """
        fixed_files = dict(files)
        auto_fixed = 0

        for path, content in fixed_files.items():
            if path.endswith(".html"):
                new_content, fixes = self._auto_fix_html(content)
                if fixes > 0:
                    fixed_files[path] = new_content
                    auto_fixed += fixes

        # Auto-fix missing dependencies in pyproject.toml
        if "pyproject.toml" in fixed_files:
            new_toml, dep_fixes = self._auto_fix_dependencies(fixed_files)
            if dep_fixes > 0:
                fixed_files["pyproject.toml"] = new_toml
                auto_fixed += dep_fixes

        result = self.validate(fixed_files)
        result.auto_fixed_count = auto_fixed
        return fixed_files, result

    @classmethod
    def format_errors_as_prompt(cls, validation_result: ValidationResult) -> str:
        """Format validation errors/warnings as a prompt string for Claude.

        Args:
            validation_result: Result from validate().

        Returns:
            Formatted prompt string describing all issues found.
        """
        parts: list[str] = [
            "Found the following issues in the generated code:"
        ]

        if validation_result.errors:
            parts.append("\nErrors:")
            for i, err in enumerate(validation_result.errors, 1):
                line_info = f" (line {err.line})" if err.line else ""
                parts.append(
                    f"{i}. [{err.file_path}]{line_info}: {err.message}"
                )

        if validation_result.warnings:
            parts.append("\nWarnings:")
            for i, warn in enumerate(validation_result.warnings, 1):
                line_info = f" (line {warn.line})" if warn.line else ""
                parts.append(
                    f"{i}. [{warn.file_path}]{line_info}: {warn.message}"
                )

        parts.append(
            "\nPlease fix ALL these issues and return the "
            "COMPLETE corrected files."
        )
        return "\n".join(parts)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _is_telegram_bot(self, files: dict[str, str]) -> bool:
        """Detect if the project is a Telegram bot."""
        if any(p.startswith("apps/bot/") for p in files):
            return True
        return any(
            "import aiogram" in content or "from aiogram" in content
            for content in files.values()
            if content
        )

    def _validate_telegram_bot(
        self, files: dict[str, str]
    ) -> tuple[list[ValidationError], list[ValidationError]]:
        """Telegram-bot-specific validation checks."""
        errors: list[ValidationError] = []
        warnings: list[ValidationError] = []

        # Collect button texts from keyboard files
        button_texts: set[str] = set()
        for path, content in files.items():
            if not path.endswith(".py"):
                continue
            # builder.button(text="...") or KeyboardButton(text="...")
            button_matches = re.findall(
                r'(?:builder\.button|KeyboardButton)\(text=["\']'
                r'([^"\'\n]+)["\']',
                content,
            )
            button_texts.update(button_matches)

        # Collect handler text patterns
        handler_texts: set[str] = set()
        startswith_prefixes: list[str] = []
        for path, content in files.items():
            if not path.endswith(".py"):
                continue
            exact = re.findall(
                r'F\.text\s*==\s*["\']([^"\'\n]+)["\']', content
            )
            handler_texts.update(exact)
            sw = re.findall(
                r'F\.text\.startswith\(["\']([^"\'\n]+)["\']\)', content
            )
            startswith_prefixes.extend(sw)

        # Check missing handlers for buttons
        for btn in button_texts:
            if btn in handler_texts:
                continue
            if any(btn.startswith(prefix) for prefix in startswith_prefixes):
                continue
            errors.append(
                ValidationError(
                    file_path="keyboards/",
                    severity="error",
                    code="MISSING_BUTTON_HANDLER",
                    message=(
                        f'Button "{btn}" has no matching handler. '
                        "Add @router.message(F.text == "
                        f'"{btn}") handler.'
                    ),
                )
            )

        # Check all routers are registered in main.py
        main_py_content: str | None = None
        for path, content in files.items():
            if path.endswith("main.py") and (
                "register_routers" in content
                or "dp.include_router" in content
            ):
                main_py_content = content
                break

        if main_py_content is not None:
            handler_files = [
                p
                for p in files
                if "/handlers/" in p
                and p.endswith(".py")
                and not p.endswith("__init__.py")
            ]
            for hf in handler_files:
                # Extract module stem, e.g. "apps/bot/handlers/menu.py" -> "menu"
                stem = hf.rsplit("/", 1)[-1].removesuffix(".py")
                if stem.startswith("_"):
                    continue
                if stem not in main_py_content:
                    warnings.append(
                        ValidationError(
                            file_path=hf,
                            severity="warning",
                            code="UNREGISTERED_ROUTER",
                            message=(
                                f"Router '{stem}' may not be registered "
                                "in main.py. Check register_routers()."
                            ),
                        )
                    )

        # Check all model files are imported in models/__init__.py
        models_init_path: str | None = None
        models_init_content: str | None = None
        for path, content in files.items():
            if path.endswith("models/__init__.py"):
                models_init_path = path
                models_init_content = content
                break

        if models_init_content is not None:
            model_files = [
                p
                for p in files
                if "/models/" in p
                and p.endswith(".py")
                and not p.endswith("__init__.py")
                and not p.endswith("base.py")
            ]
            for mf in model_files:
                stem = mf.rsplit("/", 1)[-1].removesuffix(".py")
                if stem not in models_init_content:
                    errors.append(
                        ValidationError(
                            file_path=models_init_path or mf,
                            severity="error",
                            code="MODEL_NOT_IMPORTED",
                            message=(
                                f"Model file '{stem}.py' is not imported in "
                                "models/__init__.py. All models must be "
                                "imported for Alembic migrations to work."
                            ),
                        )
                    )

        # Check all repository files are registered in uow.py
        uow_content: str | None = None
        uow_path: str | None = None
        for path, content in files.items():
            if path.endswith("uow.py"):
                uow_content = content
                uow_path = path
                break

        if uow_content is not None:
            repo_files = [
                p
                for p in files
                if "/repositories/" in p
                and p.endswith(".py")
                and not p.endswith("__init__.py")
                and not p.endswith("base.py")
            ]
            for rf in repo_files:
                stem = rf.rsplit("/", 1)[-1].removesuffix(".py")
                if stem not in uow_content:
                    warnings.append(
                        ValidationError(
                            file_path=uow_path or rf,
                            severity="warning",
                            code="REPO_NOT_IN_UOW",
                            message=(
                                f"Repository '{stem}' may not be registered "
                                "in uow.py."
                            ),
                        )
                    )

        # STRICT: ReplyKeyboardMarkup is FORBIDDEN — only InlineKeyboard allowed
        for path, content in files.items():
            if not path.endswith(".py"):
                continue
            if "ReplyKeyboardMarkup" in content or (
                "KeyboardButton" in content
                and "InlineKeyboardButton" not in content
            ):
                errors.append(
                    ValidationError(
                        file_path=path,
                        severity="error",
                        code="REPLY_KEYBOARD_FORBIDDEN",
                        message=(
                            "ReplyKeyboardMarkup/KeyboardButton is FORBIDDEN. "
                            "Use ONLY InlineKeyboardMarkup via InlineKeyboardBuilder. "
                            "Replace all ReplyKeyboardMarkup with InlineKeyboardBuilder."
                        ),
                    )
                )

        # Check callback_data prefix collisions
        callback_prefixes = self._collect_callback_prefixes(files)
        seen_collisions: set[tuple[str, str]] = set()
        for prefix, locations in callback_prefixes.items():
            for other_prefix in callback_prefixes:
                if prefix == other_prefix:
                    continue
                pair = tuple(sorted((prefix, other_prefix)))
                if pair in seen_collisions:
                    continue
                if other_prefix.startswith(prefix):
                    seen_collisions.add(pair)
                    errors.append(
                        ValidationError(
                            file_path=locations[0],
                            severity="error",
                            code="CALLBACK_PREFIX_COLLISION",
                            message=(
                                f"Callback prefix '{prefix}' collides with '{other_prefix}' — "
                                f"F.data.startswith(\"{prefix}\") will also match '{other_prefix}*'. "
                                f"Use more specific prefixes (e.g. 'book_confirm_' instead of 'confirm_')."
                            ),
                        )
                    )

        # Check for unsafe callback_data parsing (int() without try/except)
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py"):
                continue
            # Find lines with int(callback.data.split(...)
            for i, line in enumerate(content.splitlines(), 1):
                if "int(" in line and ".split(" in line and "callback" in line:
                    # Check if this line is inside a try block
                    # Look backwards for a try: statement
                    lines_above = content.splitlines()[max(0, i - 10):i - 1]
                    has_try = any("try:" in la for la in lines_above)
                    if not has_try:
                        warnings.append(
                            ValidationError(
                                file_path=path,
                                severity="warning",
                                code="UNSAFE_CALLBACK_PARSE",
                                message=(
                                    f"Line {i}: int(callback.data.split(...)) without try/except. "
                                    f"If callback_data format is unexpected, this will crash with ValueError. "
                                    f"Wrap in try/except or validate format first."
                                ),
                                line=i,
                            )
                        )

        # Check for seed data file
        has_seed = any(
            "seed_data" in p or "_seed_impl" in p 
            for p in files
        )
        if not has_seed:
            warnings.append(ValidationError(
                file_path="infrastructure/services/",
                severity="warning",
                code="MISSING_SEED_DATA",
                message="No seed data file found. Bot will start with empty database. Create infrastructure/services/_seed_impl.py with run_seed(session) function.",
            ))

        # Check for telegram_id/user_id confusion in services
        # Services (except user_service) should NOT call get_by_telegram_id —
        # handlers should resolve telegram_id to internal user.id first
        for path, content in files.items():
            if "apps/bot/services/" not in path or not path.endswith(".py"):
                continue
            if "user_service" in path:
                continue  # user_service is allowed to resolve telegram_id
            if "get_by_telegram_id" in content:
                errors.append(ValidationError(
                    file_path=path,
                    severity="error",
                    code="DOUBLE_RESOLVE_TELEGRAM_ID",
                    message=(
                        "Service calls get_by_telegram_id() — this causes phantom user bugs! "
                        "Only user_service should resolve telegram_id. "
                        "Other services must accept internal user.id from handlers. "
                        "Remove get_by_telegram_id() and accept user_id as-is."
                    ),
                ))

        # Check for get_or_create called with .id instead of TelegramUser object
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py"):
                continue
            if re.search(r"get_or_create\s*\(\s*\w+\.from_user\.id\s*\)", content):
                errors.append(ValidationError(
                    file_path=path,
                    severity="error",
                    code="GET_OR_CREATE_WRONG_ARG",
                    message=(
                        "get_or_create() expects TelegramUser object, not int! "
                        "Use: user_service.get_or_create(callback.from_user) "
                        "NOT: user_service.get_or_create(callback.from_user.id)"
                    ),
                ))

        # Check that handlers only call known UserService methods
        _KNOWN_USER_SERVICE_METHODS = {
            "get_or_create", "register_or_update", "get_user",
            "get_user_by_telegram_id", "get_total_users",
        }
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py"):
                continue
            for m in re.finditer(r"user_service\.(\w+)\s*\(", content):
                method_name = m.group(1)
                if method_name.startswith("_"):
                    continue
                if method_name not in _KNOWN_USER_SERVICE_METHODS:
                    errors.append(ValidationError(
                        file_path=path,
                        severity="error",
                        code="USER_SERVICE_UNKNOWN_METHOD",
                        message=(
                            f"Handler calls user_service.{method_name}() which does not exist! "
                            f"Available methods: {', '.join(sorted(_KNOWN_USER_SERVICE_METHODS))}. "
                            f"If you need a new method, add it to UserService first."
                        ),
                    ))

        # Check for FromDishka[ClassName] where ClassName is not imported
        for path, content in files.items():
            if not path.endswith(".py"):
                continue
            dishka_refs = re.findall(r"FromDishka\[(\w+)\]", content)
            if not dishka_refs:
                continue
            # Collect all imported/defined names in the file
            imported = set()
            for m in re.finditer(r"from\s+\S+\s+import\s+(.+)", content):
                for name in m.group(1).split(","):
                    name = name.strip().split(" as ")[-1].strip()
                    if name:
                        imported.add(name)
            for m in re.finditer(r"^import\s+(\S+)", content, re.MULTILINE):
                imported.add(m.group(1).split(".")[-1])
            for m in re.finditer(r"^class\s+(\w+)", content, re.MULTILINE):
                imported.add(m.group(1))
            for ref in dishka_refs:
                if ref not in imported:
                    errors.append(ValidationError(
                        file_path=path,
                        severity="error",
                        code="MISSING_IMPORT_DISHKA",
                        message=(
                            f"FromDishka[{ref}] used but '{ref}' is not imported! "
                            f"Add: from apps.bot.services.{_camel_to_snake(ref)} import {ref}"
                        ),
                    ))

        # Check that /start handler sends inline keyboard (reply_markup)
        for path, content in files.items():
            if "start" not in path or "/handlers/" not in path or not path.endswith(".py"):
                continue
            if "cmd_start" in content or "CommandStart" in content:
                if "reply_markup" not in content:
                    errors.append(ValidationError(
                        file_path=path,
                        severity="error",
                        code="START_NO_KEYBOARD",
                        message=(
                            "/start handler does not send inline keyboard! "
                            "The start command MUST show a main menu with InlineKeyboardMarkup. "
                            "Add reply_markup=get_main_menu() to the message.answer() call."
                        ),
                    ))

        # Check for stub/empty handlers
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py") or path.endswith("__init__.py"):
                continue
            if "pass" in content and content.count("async def") == content.count("pass"):
                errors.append(ValidationError(
                    file_path=path,
                    severity="error",
                    code="STUB_HANDLER",
                    message=f"Handler file appears to contain only stub functions (pass). Implement actual logic.",
                ))

        # Check for error handler
        has_error_handler = any(
            "error" in p.lower() and "/handlers/" in p 
            for p in files
        )
        if not has_error_handler:
            warnings.append(ValidationError(
                file_path="apps/bot/handlers/",
                severity="warning",
                code="MISSING_ERROR_HANDLER",
                message="No error handler found. Add apps/bot/handlers/errors.py with @router.error() handler.",
            ))

        # Check for UX quality - messages should have emoji
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py"):
                continue
            # Find message.answer calls
            answer_calls = re.findall(r'\.answer\(\s*["\']([^"\']{10,})["\']', content)
            no_emoji_count = sum(1 for msg in answer_calls if not any(ord(c) > 0x2600 for c in msg))
            if no_emoji_count > 2:
                warnings.append(ValidationError(
                    file_path=path,
                    severity="warning",
                    code="POOR_UX_NO_EMOJI",
                    message=f"Found {no_emoji_count} user-facing messages without emoji. Add emoji for better UX.",
                ))

        # Check for empty state messages without keyboard (dead-end UX)
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py"):
                continue
            # Find blocks where "if not items/bookings/records" leads to answer without reply_markup
            # Pattern: empty state check → answer() without reply_markup
            lines = content.split("\n")
            for i, line in enumerate(lines):
                stripped = line.strip()
                if not re.match(r"if not \w+", stripped):
                    continue
                # Look ahead up to 10 lines for answer() call
                block = "\n".join(lines[i:i + 12])
                if ".answer(" in block or ".edit_text(" in block:
                    if "reply_markup" not in block:
                        errors.append(ValidationError(
                            file_path=path,
                            severity="error",
                            code="EMPTY_STATE_NO_KEYBOARD",
                            message=(
                                f"Empty state handler (line ~{i + 1}) sends message without keyboard! "
                                "User gets stuck with no way to navigate. "
                                "ALWAYS add reply_markup with at least a 'Back to menu' button in empty states."
                            ),
                        ))
                        break  # One error per file is enough

        # Check all services are registered in di_container
        di_content = files.get("apps/bot/di_container.py", "")
        if di_content:
            service_files = [
                p for p in files
                if "/services/" in p and p.endswith(".py")
                and not p.endswith("__init__.py")
                and "apps/bot/services/" in p
            ]
            for sf in service_files:
                service_name = sf.rsplit("/", 1)[-1].removesuffix(".py")
                # Convert snake_case to find class reference
                if service_name not in di_content:
                    errors.append(ValidationError(
                        file_path="apps/bot/di_container.py",
                        severity="error",
                        code="SERVICE_NOT_REGISTERED",
                        message=f"Service '{service_name}' may not be registered in di_container.py. Add @provide method in ServiceProvider.",
                    ))

            # Check DI dependency resolution: if a service __init__ requires Bot,
            # Bot must be provided in the DI container
            di_errors = self._validate_di_dependencies(files, di_content)
            errors.extend(di_errors)

        return errors, warnings

    def _validate_di_dependencies(
        self, files: dict[str, str], di_content: str
    ) -> list[ValidationError]:
        """Check that DI service dependencies can be resolved by the container."""
        errors: list[ValidationError] = []

        # Known types that must be explicitly provided in DI if used as service deps
        # Map: type name -> what to check in di_container.py
        _EXTERNAL_DI_TYPES = {
            "Bot": ("aiogram", "Bot"),
            "Dispatcher": ("aiogram", "Dispatcher"),
            "Redis": ("redis", "Redis"),
        }

        # Collect all service __init__ signatures
        for path, content in files.items():
            if "apps/bot/services/" not in path or not path.endswith(".py"):
                continue
            if path.endswith("__init__.py"):
                continue

            # Find __init__ method parameters
            init_match = re.search(
                r"def __init__\(self,\s*([^)]+)\)", content
            )
            if not init_match:
                continue

            params_str = init_match.group(1)
            # Extract type annotations: "uow: UnitOfWork, bot: Bot" -> ["UnitOfWork", "Bot"]
            param_types = re.findall(r":\s*(\w+)", params_str)

            for ptype in param_types:
                if ptype in _EXTERNAL_DI_TYPES:
                    module_name, type_name = _EXTERNAL_DI_TYPES[ptype]
                    # Check if this type is provided in DI container
                    # Look for: -> Bot, -> AsyncIterable[Bot], provide for Bot
                    if (
                        f"-> {type_name}" not in di_content
                        and f"-> AsyncIterable[{type_name}]" not in di_content
                        and f"provide({type_name})" not in di_content
                    ):
                        service_file = path.rsplit("/", 1)[-1]
                        errors.append(ValidationError(
                            file_path="apps/bot/di_container.py",
                            severity="error",
                            code="DI_MISSING_PROVIDER",
                            message=(
                                f"Service '{service_file}' requires '{type_name}' "
                                f"(from {module_name}) in __init__, but no @provide "
                                f"method returns '{type_name}' in di_container.py. "
                                f"Add a provider or remove the dependency."
                            ),
                        ))

        return errors

    @staticmethod
    def _collect_callback_prefixes(
        files: dict[str, str],
    ) -> dict[str, list[str]]:
        """Collect callback_data prefixes used with F.data.startswith() in handlers.

        Returns:
            Dict mapping prefix -> list of file paths where it's used.
        """
        prefixes: dict[str, list[str]] = {}
        for path, content in files.items():
            if "/handlers/" not in path or not path.endswith(".py"):
                continue
            # Match F.data.startswith("prefix") patterns
            matches = re.findall(
                r'F\.data\.startswith\(["\']([^"\']+)["\']\)', content
            )
            for prefix in matches:
                prefixes.setdefault(prefix, []).append(path)
        return prefixes

    def _validate_dependencies(
        self, files: dict[str, str]
    ) -> tuple[list[ValidationError], list[ValidationError]]:
        """Validate that all imported third-party packages are in pyproject.toml."""
        errors: list[ValidationError] = []
        warnings: list[ValidationError] = []

        pyproject_content = files.get("pyproject.toml", "")
        if not pyproject_content:
            return errors, warnings

        # Collect all imported top-level package names from .py files
        imported_packages: set[str] = set()
        for path, content in files.items():
            if not path.endswith(".py"):
                continue
            for line in content.splitlines():
                line_stripped = line.strip()
                match = re.match(
                    r"^(?:from|import)\s+([\w]+)", line_stripped
                )
                if match:
                    imported_packages.add(match.group(1))

        # Filter to third-party only
        # Detect local top-level packages from the file tree
        local_packages: set[str] = set()
        for path in files:
            if "/" in path:
                local_packages.add(path.split("/", 1)[0])

        third_party = set()
        for pkg in imported_packages:
            if pkg in _STDLIB_MODULES:
                continue
            if pkg in local_packages:
                continue
            third_party.add(pkg)

        # Check each third-party package against pyproject.toml
        deps_section = pyproject_content.lower()
        for pkg in sorted(third_party):
            # Normalize: pydantic_settings -> pydantic-settings in toml
            pkg_normalized = pkg.replace("_", "-").lower()
            if pkg_normalized not in deps_section and pkg.lower() not in deps_section:
                if pkg in KNOWN_PACKAGES:
                    errors.append(
                        ValidationError(
                            file_path="pyproject.toml",
                            severity="error",
                            code="MISSING_DEPENDENCY",
                            message=(
                                f"Package '{pkg}' is imported but not listed "
                                "in pyproject.toml dependencies."
                            ),
                            auto_fixable=True,
                        )
                    )
                else:
                    warnings.append(
                        ValidationError(
                            file_path="pyproject.toml",
                            severity="warning",
                            code="UNKNOWN_DEPENDENCY",
                            message=(
                                f"Package '{pkg}' is imported but not found "
                                "in pyproject.toml. Verify it is listed."
                            ),
                        )
                    )

        return errors, warnings

    def _auto_fix_dependencies(
        self, files: dict[str, str]
    ) -> tuple[str, int]:
        """Auto-fix missing known dependencies in pyproject.toml.

        Returns:
            Tuple of (fixed_pyproject_content, number_of_fixes).
        """
        pyproject_content = files.get("pyproject.toml", "")
        if not pyproject_content:
            return pyproject_content, 0

        # Run dependency validation to find what's missing
        dep_errors, _ = self._validate_dependencies(files)
        missing = [
            e
            for e in dep_errors
            if e.code == "MISSING_DEPENDENCY" and e.auto_fixable
        ]
        if not missing:
            return pyproject_content, 0

        fixes = 0
        for err in missing:
            # Extract package name from message
            match = re.search(r"Package '(\w+)'", err.message)
            if not match:
                continue
            pkg = match.group(1)
            dep_line = KNOWN_PACKAGES.get(pkg)
            if not dep_line:
                continue

            # Insert after [tool.poetry.dependencies] section header
            marker = "[tool.poetry.dependencies]"
            if marker in pyproject_content:
                idx = pyproject_content.index(marker) + len(marker)
                pyproject_content = (
                    pyproject_content[:idx]
                    + "\n"
                    + dep_line
                    + pyproject_content[idx:]
                )
                fixes += 1
                logger.info(
                    "auto_fixed_dependency",
                    package=pkg,
                    dep_line=dep_line,
                )

        return pyproject_content, fixes

    def _validate_file(
        self, path: str, content: str
    ) -> tuple[list[ValidationError], list[ValidationError]]:
        """Validate a single file."""
        errors: list[ValidationError] = []
        warnings: list[ValidationError] = []

        # Empty file check
        if not content.strip():
            errors.append(
                ValidationError(
                    file_path=path,
                    severity="error",
                    code="EMPTY_FILE",
                    message="File is empty",
                )
            )
            return errors, warnings

        # Placeholder checks (all files)
        for pattern, code in _PLACEHOLDER_PATTERNS:
            for match in re.finditer(pattern, content, re.IGNORECASE):
                line_num = content[: match.start()].count("\n") + 1
                warnings.append(
                    ValidationError(
                        file_path=path,
                        severity="warning",
                        code=code,
                        message=f"Placeholder found: {match.group()!r}",
                        line=line_num,
                    )
                )

        # HTML-specific checks
        if path.endswith(".html"):
            self._validate_html(path, content, errors, warnings)

        # Python-specific checks
        if path.endswith(".py"):
            self._validate_python(path, content, errors, warnings)

        return errors, warnings

    def _validate_html(
        self,
        path: str,
        content: str,
        errors: list[ValidationError],
        warnings: list[ValidationError],
    ) -> None:
        """HTML-specific validation."""
        if "<!DOCTYPE html>" not in content and "<!doctype html>" not in content.lower():
            warnings.append(
                ValidationError(
                    file_path=path,
                    severity="warning",
                    code="MISSING_DOCTYPE",
                    message="Missing <!DOCTYPE html> declaration",
                    auto_fixable=True,
                )
            )

        if '<meta name="viewport"' not in content:
            warnings.append(
                ValidationError(
                    file_path=path,
                    severity="warning",
                    code="MISSING_VIEWPORT",
                    message="Missing <meta viewport> tag",
                    auto_fixable=True,
                )
            )

        # External CSS reference check
        if re.search(
            r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\'](?!https://fonts)',
            content,
        ):
            warnings.append(
                ValidationError(
                    file_path=path,
                    severity="warning",
                    code="EXTERNAL_CSS",
                    message="External CSS reference found (should be inline <style>)",
                )
            )

    def _validate_python(
        self,
        path: str,
        content: str,
        errors: list[ValidationError],
        warnings: list[ValidationError],
    ) -> None:
        """Python-specific validation via compile()."""
        try:
            compile(content, path, "exec")
        except SyntaxError as e:
            errors.append(
                ValidationError(
                    file_path=path,
                    severity="error",
                    code="PYTHON_SYNTAX_ERROR",
                    message=f"Syntax error: {e.msg}",
                    line=e.lineno,
                )
            )

    def _auto_fix_html(self, content: str) -> tuple[str, int]:
        """Auto-fix common HTML issues. Returns (fixed_content, fix_count)."""
        fixes = 0

        # Add DOCTYPE if missing
        if "<!DOCTYPE html>" not in content and "<!doctype html>" not in content.lower():
            if content.strip().startswith("<html"):
                content = "<!DOCTYPE html>\n" + content
                fixes += 1

        # Add viewport meta if missing
        if '<meta name="viewport"' not in content and "<head>" in content:
            content = content.replace(
                "<head>",
                '<head>\n    <meta name="viewport"'
                ' content="width=device-width, initial-scale=1.0">',
                1,
            )
            fixes += 1

        return content, fixes
