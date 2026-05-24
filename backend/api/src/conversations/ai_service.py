"""AI service for conversation-based generation."""

import json
import logging
import re
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.services.anthropic import AnthropicClient
from settings.config import settings
from infrastructure.database.models.conversations import Artifact, Conversation, Message
from api.src.conversations.schemas import ArtifactType
from core.redis import get_redis
from infrastructure.database.models.projects import Project, ProjectStatus
from infrastructure.database.models.templates import Template
from api.src.ai.boilerplates.loader import BoilerplateLoader
from api.src.ai.prompts.categories import CATEGORY_PROMPTS

logger = logging.getLogger(__name__)


class ConversationAIService:
    """AI service for conversation-based generation.

    Handles:
    - Building conversation context with prompt caching
    - Streaming AI responses
    - Extracting and saving artifacts
    - Redis caching for performance
    """

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the service with a database session.

        Args:
            db: Async database session for persistence operations.
        """
        self.db = db
        self._redis = None

    async def _get_redis(self):
        """Lazy Redis client initialization."""
        if self._redis is None:
            self._redis = await get_redis()
        return self._redis


    async def _get_template_specific_prompt(self, conversation_id: UUID) -> str | None:
        """Get template-specific prompt for template-based and allow_empty projects."""
        try:
            result = await self.db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            conv = result.scalar_one_or_none()
            if not conv or not conv.project_id:
                return None

            result = await self.db.execute(
                select(Project).where(Project.id == conv.project_id)
            )
            project = result.scalar_one_or_none()
            if not project:
                return None

            if not project.template_id:
                text = self._get_project_intent_text(project)
                inferred_slug = self._detect_template_slug_from_text(text)
                if not inferred_slug:
                    return None
                return self._load_template_prompt_by_slug(inferred_slug)

            result = await self.db.execute(
                select(Template).where(Template.id == project.template_id)
            )
            template = result.scalar_one_or_none()
            if not template:
                return None

            return self._load_template_prompt_by_slug(template.slug)
        except Exception as e:
            logger.warning("Failed to load template-specific prompt: %s", e)
            return None

    @staticmethod
    def _load_template_prompt_by_slug(slug: str | None) -> str | None:
        if not slug:
            return None

        template_prompts = {
            "booking-bot": ("api.src.ai.prompts.templates.booking_bot", "BOOKING_BOT_PROMPT"),
            "shop-bot": ("api.src.ai.prompts.templates.shop_bot", "SHOP_BOT_PROMPT"),
            "faq-bot": ("api.src.ai.prompts.templates.faq_bot", "FAQ_BOT_PROMPT"),
            "notification-bot": ("api.src.ai.prompts.templates.notification_bot", "NOTIFICATION_BOT_PROMPT"),
            "portfolio": ("api.src.ai.prompts.templates.portfolio", "PORTFOLIO_PROMPT"),
            "business-site": ("api.src.ai.prompts.templates.business_site", "BUSINESS_SITE_PROMPT"),
            "online-store": ("api.src.ai.prompts.templates.online_store", "ONLINE_STORE_PROMPT"),
            "landing-page": ("api.src.ai.prompts.templates.landing_page", "LANDING_PAGE_PROMPT"),
            "dashboard": ("api.src.ai.prompts.templates.dashboard", "DASHBOARD_PROMPT"),
            "saas-landing": ("api.src.ai.prompts.templates.saas_landing", "SAAS_LANDING_PROMPT"),
            "ecommerce": ("api.src.ai.prompts.templates.ecommerce", "ECOMMERCE_PROMPT"),
        }

        entry = template_prompts.get(slug)
        if not entry:
            return None

        import importlib

        mod = importlib.import_module(entry[0])
        return getattr(mod, entry[1], None)

    @staticmethod
    def _get_project_intent_text(project: Project) -> str:
        config = project.config if isinstance(project.config, dict) else {}
        parts = [
            str(config.get("initialPrompt", "") or ""),
            str(project.description or ""),
            str(project.name or ""),
        ]
        return " ".join(part.strip() for part in parts if part and part.strip())

    @staticmethod
    def _detect_template_slug_from_text(text: str) -> str | None:
        lower = (text or "").lower()
        if not lower:
            return None

        if any(kw in lower for kw in ["dashboard", "дашборд", "admin", "панел", "кабинет", "crm", "analytics"]):
            return "dashboard"
        if any(kw in lower for kw in ["portfolio", "портфолио", "resume", "резюме"]):
            return "portfolio"
        if any(kw in lower for kw in ["store", "shop", "магазин", "ecommerce", "e-commerce", "интернет-магазин"]):
            return "online-store"
        if "saas" in lower and any(kw in lower for kw in ["landing", "лендинг", "site", "website", "сайт"]):
            return "saas-landing"
        if any(kw in lower for kw in ["company", "corporate", "agency", "business site", "корпоратив", "агентств"]):
            return "business-site"
        if any(kw in lower for kw in ["landing", "лендинг", "website", "site", "сайт", "promo", "промо"]):
            return "landing-page"
        return None

    @staticmethod
    def _detect_category_from_text(text: str) -> str:
        """Detect project category from free-text description or name.

        Args:
            text: Project name, description, or initial prompt.

        Returns:
            'telegram_bot', 'website', or 'webapp' (default).
        """
        lower = text.lower()
        telegram_keywords = ["бот", "bot", "telegram", "телеграм", "tg", "aiogram", "pyrogram"]
        if any(kw in lower for kw in telegram_keywords):
            return "telegram_bot"

        webapp_keywords = [
            "dashboard", "дашборд", "admin", "panel", "панель", "analytics",
            "crm", "erp", "platform", "app", "application", "приложение",
            "кабинет", "личный кабинет", "workspace", "portal",
        ]
        if any(kw in lower for kw in webapp_keywords):
            return "webapp"

        website_keywords = [
            "landing", "landing page", "лендинг", "website", "site", "сайт",
            "portfolio", "портфолио", "store", "shop", "магазин", "ecommerce",
            "online store", "business site", "corporate", "company", "promo", "промо",
        ]
        if any(kw in lower for kw in website_keywords):
            return "website"

        return "webapp"

    @staticmethod
    def _resolve_template_category(template: Template | None) -> str:
        if not template:
            return ""
        slug = getattr(template, "slug", "") or ""
        category = getattr(template, "category", "") or ""
        if slug == "landing-page" and category in ("webapp", "web_app", ""):
            return "website"
        return category

    async def _get_template_category(self, conversation_id: UUID) -> str:
        """Get the category of the template for this conversation's project.

        For template-based projects: reads category from template.
        For allow_empty projects (from hero/quick-create): detects from config/description.
        """
        try:
            result = await self.db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
            if not conversation or not conversation.project_id:
                return ""
            proj_result = await self.db.execute(
                select(Project).where(Project.id == conversation.project_id)
            )
            project = proj_result.scalar_one_or_none()
            if not project:
                return ""

            # Template-based project: use template category
            if project.template_id:
                tmpl_result = await self.db.execute(
                    select(Template).where(Template.id == project.template_id)
                )
                template = tmpl_result.scalar_one_or_none()
                return self._resolve_template_category(template)

            # allow_empty project (from hero / quick-create): detect from config or text
            if project.config and isinstance(project.config, dict):
                # Explicit category hint passed from frontend
                if project.config.get("category"):
                    return project.config["category"]
                # Detect from initial prompt stored in config
                initial_prompt = project.config.get("initialPrompt", "")
                if initial_prompt:
                    return self._detect_category_from_text(initial_prompt)

            # Fallback: detect from description or name
            text = project.description or project.name or ""
            if text:
                return self._detect_category_from_text(text)

            return "webapp"  # safe default
        except Exception as e:
            logger.warning("Failed to get template category: %s", e)
            return ""


    async def build_conversation_context(
        self, conversation_id: UUID
    ) -> list[dict[str, Any]]:
        """Build context for AI request with caching support.

        Logic:
        1. Try to load from Redis cache (TTL: 1 hour)
        2. If cache miss, load all messages from DB (ordered by created_at)
        3. If len(messages) == 0 AND project.template_id exists:
           - Prepend system message with template content
        4. Add cache_control markers for Anthropic prompt caching
        5. Cache result in Redis
        6. Return messages list

        Args:
            conversation_id: UUID of the conversation.

        Returns:
            List of message dicts in Anthropic API format:
            [{"role": "user"|"assistant", "content": "..."}]
            Note: System messages use structured content with cache_control

        Raises:
            ValueError: If conversation or project not found.
        """
        str_conversation_id = str(conversation_id)
        cache_key = f"conversation:{str_conversation_id}:context"

        # Try Redis cache first
        try:
            redis = await self._get_redis()
            cached = await redis.get(cache_key)
            if cached:
                logger.info(
                    "Context loaded from cache",
                    extra={"conversation_id": str_conversation_id},
                )
                return json.loads(cached)
        except Exception as cache_error:
            logger.warning(
                "Redis cache read failed, falling back to DB",
                extra={
                    "conversation_id": str_conversation_id,
                    "error": str(cache_error),
                },
            )

        # Load conversation from DB
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Load all messages ordered by created_at
        # Limit to last 20 messages to avoid hitting the 200k token context limit
        from sqlalchemy import func as sa_func
        total_msg_result = await self.db.execute(
            select(sa_func.count()).select_from(Message)
            .where(Message.conversation_id == conversation_id)
        )
        total_msgs = total_msg_result.scalar() or 0
        _CONTEXT_MSG_LIMIT = 20
        messages_query = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        if total_msgs > _CONTEXT_MSG_LIMIT:
            messages_query = messages_query.limit(_CONTEXT_MSG_LIMIT).offset(total_msgs - _CONTEXT_MSG_LIMIT)
            logger.info(
                "Context window trimmed: total=%d, keeping last %d messages",
                total_msgs, _CONTEXT_MSG_LIMIT,
                extra={"conversation_id": str_conversation_id},
            )
        messages_result = await self.db.execute(messages_query)
        db_messages = messages_result.scalars().all()

        # Build message list for Anthropic API
        messages: list[dict[str, Any]] = []

        # If first conversation and template exists, add system message
        if len(db_messages) == 0:
            try:
                result = await self.db.execute(
                    select(Project).where(Project.id == conversation.project_id)
                )
                project = result.scalar_one_or_none()

                if project and project.template_id:
                    result = await self.db.execute(
                        select(Template).where(Template.id == project.template_id)
                    )
                    template = result.scalar_one_or_none()

                    if template and template.prompt_template:
                        system_content = template.prompt_template

                        logger.info(
                            "Template will be used as system prompt",
                            extra={
                                "conversation_id": str_conversation_id,
                                "template_id": str(template.id),
                            },
                        )

                        messages.append({
                            "role": "__system__",
                            "content": system_content,
                            "cache_control": {"type": "ephemeral"}
                        })
            except Exception as template_error:
                logger.warning(
                    "Failed to load template for system message",
                    extra={
                        "conversation_id": str_conversation_id,
                        "error": str(template_error),
                    },
                )

        # Add existing messages
        for msg in db_messages:
            if msg.role == "system":
                continue

            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Cache context in Redis (1 hour TTL)
        try:
            redis = await self._get_redis()
            await redis.setex(
                cache_key,
                3600,
                json.dumps(messages)
            )
            logger.info(
                "Context cached in Redis",
                extra={"conversation_id": str_conversation_id},
            )
        except Exception as cache_error:
            logger.warning(
                "Failed to cache context in Redis",
                extra={
                    "conversation_id": str_conversation_id,
                    "error": str(cache_error),
                },
            )

        return messages

    async def _load_boilerplate_context(self, conversation_id: UUID) -> str | None:
        """Load boilerplate files based on project's template category.

        Only loads on the first message (no existing artifacts).
        Works for both template-based and allow_empty projects.

        Args:
            conversation_id: UUID of the conversation.

        Returns:
            Formatted boilerplate context string or None.
        """
        try:
            # Check if there are existing artifacts — skip boilerplate for follow-up messages
            existing = await self._get_current_artifacts(conversation_id)
            if existing:
                return None

            # Get project to determine category
            result = await self.db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            conversation = result.scalar_one_or_none()
            if not conversation or not conversation.project_id:
                return None

            proj_result = await self.db.execute(
                select(Project).where(Project.id == conversation.project_id)
            )
            project = proj_result.scalar_one_or_none()
            if not project:
                return None

            # Template-based project: use template category
            if project.template_id:
                tmpl_result = await self.db.execute(
                    select(Template).where(Template.id == project.template_id)
                )
                template = tmpl_result.scalar_one_or_none()
                if not template:
                    return None
                category = self._resolve_template_category(template)
            else:
                # allow_empty project: detect category from config/description/name
                category = ""
                if project.config and isinstance(project.config, dict):
                    category = project.config.get("category", "")
                    if not category:
                        initial_prompt = project.config.get("initialPrompt", "")
                        if initial_prompt:
                            category = self._detect_category_from_text(initial_prompt)
                if not category:
                    text = self._get_project_intent_text(project)
                    category = self._detect_category_from_text(text) if text else "webapp"

                logger.info(
                    "Detected boilerplate category for allow_empty project",
                    extra={
                        "project_id": str(project.id),
                        "category": category,
                    },
                )

            loader = BoilerplateLoader(category)
            return loader.load()
        except Exception as e:
            logger.warning("Failed to load boilerplate context: %s", e)
            return None

    async def _get_current_artifacts(self, conversation_id: UUID) -> list[Artifact]:
        """Get the latest artifacts for a conversation.

        Args:
            conversation_id: UUID of the conversation.

        Returns:
            List of current artifacts.
        """
        result = await self.db.execute(
            select(Artifact)
            .where(Artifact.conversation_id == conversation_id)
            .order_by(Artifact.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    def _load_boilerplate_file_map(category: str) -> dict[str, str]:
        try:
            from api.src.ai.boilerplates.loader import (
                BoilerplateLoader,
                _TELEGRAM_BOT_FILES,
                _WEBAPP_FILES,
                _WEBSITE_FILES,
            )

            if category in ("telegram_bot", "telegram-bot", "telegram"):
                file_list = _TELEGRAM_BOT_FILES
            elif category in ("website", "web"):
                file_list = _WEBSITE_FILES
            else:
                file_list = _WEBAPP_FILES

            loader = BoilerplateLoader(category)
            boilerplate_dir = loader._boilerplate_dir
            if not boilerplate_dir.exists():
                return {}

            file_map: dict[str, str] = {}
            for rel_path in file_list:
                file_path = boilerplate_dir / rel_path
                if file_path.exists():
                    try:
                        file_map[rel_path] = file_path.read_text(encoding="utf-8")
                    except Exception:
                        pass
            return file_map
        except Exception:
            return {}

    @staticmethod
    def _apply_artifact_overrides(base_artifacts: list[dict], override_artifacts: list[dict]) -> list[dict]:
        merged = {artifact.get("title"): artifact for artifact in base_artifacts if artifact.get("title")}
        ordered = [artifact for artifact in base_artifacts if not artifact.get("title")]

        for artifact in base_artifacts:
            if artifact.get("title"):
                ordered.append(artifact)

        seen_titles = {artifact.get("title") for artifact in ordered if artifact.get("title")}
        for artifact in override_artifacts:
            title = artifact.get("title")
            if title:
                merged[title] = artifact
                if title not in seen_titles:
                    ordered.append(artifact)
                    seen_titles.add(title)
            else:
                ordered.append(artifact)

        result: list[dict] = []
        added_titles: set[str] = set()
        for artifact in ordered:
            title = artifact.get("title")
            if title:
                if title in added_titles:
                    continue
                result.append(merged[title])
                added_titles.add(title)
            else:
                result.append(artifact)
        return result

    @staticmethod
    def _website_changed_content_files(artifacts: list[dict], boilerplate_map: dict[str, str]) -> list[str]:
        content_files = {
            "src/content/site.ts",
            "src/pages/Home.tsx",
            "src/components/landing/Header.tsx",
            "src/components/landing/Hero.tsx",
            "src/components/landing/Features.tsx",
            "src/components/landing/Metrics.tsx",
            "src/components/landing/CTA.tsx",
            "src/components/landing/Footer.tsx",
            "src/index.css",
        }
        changed: list[str] = []
        by_title = {artifact.get("title"): artifact.get("content", "") for artifact in artifacts if artifact.get("title")}
        for path in sorted(content_files):
            if path in by_title and by_title[path] != boilerplate_map.get(path):
                changed.append(path)
        return changed

    @staticmethod
    def _website_needs_content_regen(artifacts: list[dict], boilerplate_map: dict[str, str]) -> bool:
        changed_files = ConversationAIService._website_changed_content_files(artifacts, boilerplate_map)
        if "src/content/site.ts" in changed_files:
            return False
        if len(changed_files) >= 3:
            return False

        default_markers = (
            "Northstar Studio",
            "Website boilerplate",
            "Лендинг, который уже собран",
            "Готово к адаптации",
        )
        for artifact in artifacts:
            title = artifact.get("title") or ""
            if title in {
                "src/content/site.ts",
                "src/pages/Home.tsx",
                "src/components/landing/Header.tsx",
                "src/components/landing/Hero.tsx",
                "src/components/landing/Footer.tsx",
            }:
                content = artifact.get("content", "")
                if any(marker in content for marker in default_markers):
                    return True

        return len(changed_files) < 2

    @staticmethod
    def _enforce_website_first_run_contract(
        artifacts: list[dict],
        boilerplate_map: dict[str, str],
    ) -> list[dict]:
        if not artifacts or not boilerplate_map:
            return artifacts

        allowed_override_titles = {"src/content/site.ts"}
        by_title = {
            artifact.get("title"): artifact
            for artifact in artifacts
            if artifact.get("title")
        }

        def _ext_lang(path: str) -> str:
            ext = path.rsplit(".", 1)[-1].lower() if "." in path else "text"
            return {
                "ts": "typescript", "tsx": "tsx", "js": "javascript",
                "jsx": "jsx", "css": "css", "html": "html",
                "json": "json", "toml": "toml", "md": "markdown",
                "py": "python", "ini": "ini", "cfg": "ini",
                "yaml": "yaml", "yml": "yaml",
            }.get(ext, "text")

        def _ext_type(path: str) -> str:
            ext = path.rsplit(".", 1)[-1].lower() if "." in path else "text"
            return {
                "ts": "typescript", "tsx": "react", "js": "javascript",
                "jsx": "react", "css": "css", "html": "html",
                "json": "json", "toml": "toml", "md": "markdown",
                "py": "python", "ini": "ini", "cfg": "ini",
                "yaml": "yaml", "yml": "yaml",
            }.get(ext, "text")

        normalized: list[dict[str, Any]] = []
        dropped_titles: list[str] = []
        for rel_path, boilerplate_content in boilerplate_map.items():
            override = by_title.get(rel_path)
            if rel_path in allowed_override_titles and override and override.get("content"):
                normalized.append({
                    "type": override.get("type") or _ext_type(rel_path),
                    "title": rel_path,
                    "content": override["content"],
                    "language": override.get("language") or _ext_lang(rel_path),
                })
            else:
                if override and override.get("content") != boilerplate_content:
                    dropped_titles.append(rel_path)
                normalized.append({
                    "type": _ext_type(rel_path),
                    "title": rel_path,
                    "content": boilerplate_content,
                    "language": _ext_lang(rel_path),
                })

        if dropped_titles:
            logger.info(
                "Website first-run contract dropped non-content overrides: %s",
                sorted(dropped_titles),
            )

        return normalized

    @staticmethod
    def _extract_json_object(text: str) -> dict[str, Any] | None:
        raw = (text or "").strip()
        if not raw:
            return None

        candidates = [raw]
        if "```json" in raw:
            try:
                candidates.append(raw.split("```json", 1)[1].split("```", 1)[0].strip())
            except Exception:
                pass
        elif "```" in raw:
            try:
                candidates.append(raw.split("```", 1)[1].split("```", 1)[0].strip())
            except Exception:
                pass

        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidates.append(raw[start:end + 1])

        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                continue
        return None

    @staticmethod
    def _render_website_site_content(data: dict[str, Any]) -> str:
        def _str(value: Any, default: str) -> str:
            value = value if isinstance(value, str) else default
            return value.replace('\\', '\\\\').replace('"', '\\"')

        def _list(values: Any, defaults: list[str], min_len: int) -> list[str]:
            if isinstance(values, list):
                clean = [str(v) for v in values if str(v).strip()]
            else:
                clean = []
            clean = clean[:min_len]
            while len(clean) < min_len:
                clean.append(defaults[len(clean)])
            return [item.replace('\\', '\\\\').replace('"', '\\"') for item in clean]

        def _nav(values: Any, defaults: list[tuple[str, str]]) -> list[tuple[str, str]]:
            items: list[tuple[str, str]] = []
            if isinstance(values, list):
                for idx, item in enumerate(values[: len(defaults)]):
                    if isinstance(item, dict):
                        href = str(item.get("href") or defaults[idx][0])
                        label = str(item.get("label") or defaults[idx][1])
                    else:
                        href, label = defaults[idx][0], str(item)
                    items.append((href, label.replace('\\', '\\\\').replace('"', '\\"')))
            while len(items) < len(defaults):
                href, label = defaults[len(items)]
                items.append((href, label))
            return items

        features_default = [
            ("layout", "Секции уже разложены", "Есть готовая композиция лендинга с hero, trust-блоками и финальным CTA.", "Используйте блок как основу и адаптируйте копирайтинг, визуал и порядок секций под конкретный продукт."),
            ("wand", "AI меняет, а не изобретает", "Модель получает рабочий каркас и должна адаптировать его под нишу пользователя.", "Меняйте контент существующих блоков, а не пересобирайте весь лендинг, если это не требуется запросом."),
            ("layers", "Проще масштабировать", "Можно добавлять pricing, FAQ, gallery и другие блоки без слома структуры.", "Структура уже готова для расширения, поэтому новые секции можно аккуратно встраивать поверх базы."),
        ]

        raw_features = data.get("features") if isinstance(data.get("features"), list) else []
        rendered_features = []
        for idx, default in enumerate(features_default):
            item = raw_features[idx] if idx < len(raw_features) and isinstance(raw_features[idx], dict) else {}
            icon = str(item.get("icon") or default[0])
            if icon not in {"layout", "wand", "layers"}:
                icon = default[0]
            rendered_features.append({
                "icon": icon,
                "title": _str(item.get("title"), default[1]),
                "text": _str(item.get("text"), default[2]),
                "detail": _str(item.get("detail"), default[3]),
            })

        raw_metrics = data.get("metrics") if isinstance(data.get("metrics"), list) else []
        metrics_default = [
            ("12 ч", "до первого собранного прототипа"),
            ("6+", "готовых landing-секций в базе"),
            ("1", "единый визуальный каркас для доработки"),
        ]
        rendered_metrics = []
        for idx, default in enumerate(metrics_default):
            item = raw_metrics[idx] if idx < len(raw_metrics) and isinstance(raw_metrics[idx], dict) else {}
            rendered_metrics.append({
                "value": _str(item.get("value"), default[0]),
                "label": _str(item.get("label"), default[1]),
            })

        brand_name = _str(data.get("brand_name"), "Northstar Studio")
        nav_items = _nav(data.get("nav"), [("#features", "Возможности"), ("#metrics", "Результаты"), ("#cta", "Запуск")])
        footer_links = _nav(data.get("footer_links"), [("#hero", "Наверх"), ("#features", "Секции"), ("#cta", "CTA")])
        hero_bullets = _list(data.get("hero_bullets"), [
            "Структура секций уже готова к адаптации под нишу",
            "Шрифты, сетка и CTA не нужно собирать с нуля",
            "Лендинг легко расширить новыми блоками",
        ], 3)
        footer_note = _str(data.get("footer_note"), f"{brand_name}, website boilerplate for Viably.")

        feature_items = "\n".join(
            f'''      {{\n        icon: "{item["icon"]}",\n        title: "{item["title"]}",\n        text: "{item["text"]}",\n        detail: "{item["detail"]}",\n      }},'''
            for item in rendered_features
        )
        metric_items = "\n".join(
            f'''    {{ value: "{item["value"]}", label: "{item["label"]}" }},'''
            for item in rendered_metrics
        )
        brand_nav_items = "\n".join(
            f'''      {{ href: "{href}", label: "{label}" }},'''
            for href, label in nav_items
        )
        footer_nav_items = "\n".join(
            f'''      {{ href: "{href}", label: "{label}" }},'''
            for href, label in footer_links
        )
        bullet_items = "\n".join(f'''      "{item}",''' for item in hero_bullets)

        return f'''export type LandingNavItem = {{
  href: string;
  label: string;
}};

export type LandingFeature = {{
  icon: "layout" | "wand" | "layers";
  title: string;
  text: string;
  detail: string;
}};

export type LandingMetric = {{
  value: string;
  label: string;
}};

export const siteContent = {{
  brand: {{
    name: "{brand_name}",
    nav: [
{brand_nav_items}
    ] satisfies LandingNavItem[],
    primaryAction: "{_str(data.get("primary_action"), "Запросить демо")}",
  }},
  hero: {{
    badge: "{_str(data.get("hero_badge"), "Website boilerplate")}",
    title: "{_str(data.get("hero_title"), "Лендинг, который уже собран как нормальный продуктовый сайт")}",
    description:
      "{_str(data.get("hero_description"), "База включает hero, секции преимуществ, метрики, финальный CTA и навигацию по якорям. AI должен адаптировать этот каркас под запрос, а не генерировать всё с нуля.")}",
    primaryAction: "{_str(data.get("hero_primary_action"), "Запустить проект")}",
    secondaryAction: "{_str(data.get("hero_secondary_action"), "Посмотреть кейсы")}",
    panelTitle: "{_str(data.get("hero_panel_title"), "Что уже лежит в бойлерплейте")}",
    bullets: [
{bullet_items}
    ],
  }},
  features: {{
    eyebrow: "{_str(data.get("features_eyebrow"), "Преимущества")}",
    title: "{_str(data.get("features_title"), "Стартовая архитектура для маркетинговых сайтов")}",
    items: [
{feature_items}
    ] satisfies LandingFeature[],
  }},
  metrics: [
{metric_items}
  ] satisfies LandingMetric[],
  cta: {{
    eyebrow: "{_str(data.get("cta_eyebrow"), "Готово к адаптации")}",
    title: "{_str(data.get("cta_title"), "Используйте этот лендинг как базу, а не как одноразовый черновик")}",
    description:
      "{_str(data.get("cta_description"), "Меняйте оффер, секции, палитру и контент под нишу. Базовая структура уже готова для дальнейшей генерации.")}",
    primaryAction: "{_str(data.get("cta_primary_action"), "Собрать страницу")}",
    secondaryAction: "{_str(data.get("cta_secondary_action"), "Обсудить задачу")}",
  }},
  footer: {{
    note: "{footer_note}",
    links: [
{footer_nav_items}
    ] satisfies LandingNavItem[],
  }},
}} as const;
'''

    @staticmethod
    def _find_missing_imports(artifacts: list[dict]) -> list[str]:
        """Find files that are imported but don't exist in artifacts.

        Parses import statements from all JS/TS/TSX/JSX artifacts and checks
        if the imported relative paths exist in the artifact list.

        Returns:
            List of missing file paths.
        """
        import re

        existing_paths = set()
        for a in artifacts:
            title = a.get("title", "")
            existing_paths.add(title)
            # Also add without src/ prefix and with it
            if title.startswith("src/"):
                existing_paths.add(title[4:])
            else:
                existing_paths.add("src/" + title)

        # Collect basenames for fuzzy match
        existing_basenames = set()
        for p in existing_paths:
            basename = p.rsplit("/", 1)[-1].lower()
            existing_basenames.add(basename)
            # Also without extension
            if "." in basename:
                existing_basenames.add(basename.rsplit(".", 1)[0].lower())

        missing = []
        import_re = re.compile(
            r'''(?:import|from)\s+.*?['"](\.\.?/[^'"]+)['"]'''
        )

        for a in artifacts:
            title = a.get("title", "")
            content = a.get("content", "")
            # Only check JS/TS files
            if not any(title.endswith(ext) for ext in (".tsx", ".ts", ".jsx", ".js")):
                continue

            dir_path = "/".join(title.split("/")[:-1]) if "/" in title else ""

            for match in import_re.finditer(content):
                import_path = match.group(1)
                # Resolve relative path
                if import_path.startswith("./"):
                    resolved = dir_path + "/" + import_path[2:] if dir_path else import_path[2:]
                elif import_path.startswith("../"):
                    parts = dir_path.split("/") if dir_path else []
                    rel = import_path
                    while rel.startswith("../"):
                        if parts:
                            parts.pop()
                        rel = rel[3:]
                    resolved = "/".join(parts + [rel]) if parts else rel
                else:
                    resolved = import_path

                # Check with various extensions
                found = False
                candidates = [resolved]
                if "." not in resolved.rsplit("/", 1)[-1]:
                    candidates.extend([
                        resolved + ".tsx", resolved + ".ts",
                        resolved + ".jsx", resolved + ".js",
                        resolved + "/index.tsx", resolved + "/index.ts",
                    ])

                for cand in candidates:
                    if cand in existing_paths:
                        found = True
                        break
                    # Check basename match
                    cand_base = cand.rsplit("/", 1)[-1].lower()
                    if cand_base in existing_basenames:
                        found = True
                        break
                    if "." in cand_base and cand_base.rsplit(".", 1)[0].lower() in existing_basenames:
                        found = True
                        break

                if not found:
                    # Skip known external packages
                    if any(import_path.startswith(p) for p in [
                        "./lib/", "../lib/", "./hooks/", "../hooks/",
                    ]):
                        # lib/utils.ts is in boilerplate, skip
                        if "utils" in import_path:
                            continue
                    # Determine the most likely full path
                    best = resolved + ".tsx" if "." not in resolved.rsplit("/", 1)[-1] else resolved
                    if not best.startswith("src/"):
                        best = "src/" + best
                    if best not in missing:
                        missing.append(best)

        return missing

    def _build_artifacts_context(self, artifacts: list[Artifact]) -> str:
        """Build a context string from current artifacts.

        Args:
            artifacts: List of artifact objects.

        Returns:
            Formatted string with all current project files.
        """
        if not artifacts:
            return ""

        parts = ["Current project files:\n"]
        for artifact in artifacts:
            lang = artifact.language or "text"
            title = artifact.title or "unnamed"
            parts.append(f"```{lang}\n# filename: {title}\n{artifact.content}\n```\n")

        return "\n".join(parts)

    async def send_message_streaming(
        self,
        conversation_id: UUID,
        user_content: str,
        user_id: UUID | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Send message and stream AI response.

        Flow:
        1. Build context with build_conversation_context()
        2. Add artifact context + new user message
        3. Call Anthropic streaming API with full message history
        4. Yield tokens as they arrive
        5. Extract artifacts from complete response
        6. Save user message and assistant response to DB
        7. Save extracted artifacts to DB
        8. Invalidate Redis cache

        Args:
            conversation_id: UUID of the conversation.
            user_content: User message content.
            user_id: Optional user ID for logging.

        Yields:
            Event dicts:
            - {"type": "token", "content": "..."}
            - {"type": "artifact", "artifact": {...}}
            - {"type": "done", "message_id": "...", "tokens_used": 123}
            - {"type": "error", "error": "..."}

        Raises:
            ValueError: If conversation not found or API error.
        """
        str_conversation_id = str(conversation_id)
        str_user_id = str(user_id) if user_id else "unknown"
        _selected_api_key: str = settings.ANTHROPIC_API_KEY  # may be updated by pool selection

        try:
            # Step 1: Build conversation context
            logger.info(
                "Building conversation context",
                extra={
                    "conversation_id": str_conversation_id,
                    "user_id": str_user_id,
                },
            )
            context_messages = await self.build_conversation_context(conversation_id)

            # Extract system prompt if present (from template)
            template_system = None
            messages = []
            for msg in context_messages:
                if msg.get("role") == "__system__":
                    template_system = msg["content"]
                else:
                    messages.append(msg)

            # Get template category for prompt selection
            template_category = await self._get_template_category(conversation_id)

            # Classify request complexity for prompt tiering and model routing
            from api.src.ai.classifier import RequestComplexity, classify_request

            # Build artifact context early — needed for classifier
            current_artifacts = await self._get_current_artifacts(conversation_id)
            has_artifacts = len(current_artifacts) > 0

            request_complexity = classify_request(
                user_message=user_content,
                has_artifacts=has_artifacts,
                conversation_length=len(context_messages),
            )

            if not has_artifacts and template_category in ("telegram_bot", "telegram-bot", "telegram", "webapp", "web_app", "website", "web"):
                if request_complexity != RequestComplexity.FULL:
                    logger.info(
                        "Forcing FULL prompt stack for first boilerplate-backed request",
                        extra={
                            "conversation_id": str_conversation_id,
                            "original_complexity": request_complexity.value,
                            "template_category": template_category,
                        },
                    )
                request_complexity = RequestComplexity.FULL

            logger.info(
                "Request classified",
                extra={
                    "conversation_id": str_conversation_id,
                    "complexity": request_complexity.value,
                    "has_artifacts": has_artifacts,
                },
            )

            # Build effective system prompt as list of blocks for prompt caching
            from api.src.ai.prompts.categories.webapp import WEBAPP_CATEGORY_PROMPT

            use_agent_loop = settings.USE_AGENT_LOOP

            if use_agent_loop:
                from api.src.ai.prompts.base import AGENT_LOOP_PROMPT as _base_prompt
            else:
                from api.src.ai.prompts.base import BASE_PROMPT as _base_prompt

            # Build system as list of content blocks with cache_control
            # Static blocks get cache_control for better Anthropic prompt caching
            system_blocks = [
                {
                    "type": "text",
                    "text": _base_prompt,
                    "cache_control": {"type": "ephemeral"},
                }
            ]

            if request_complexity == RequestComplexity.SIMPLE:
                # SIMPLE: only base prompt — already added above
                pass
            elif request_complexity == RequestComplexity.STANDARD:
                # STANDARD: base + category prompt (no boilerplate)
                category_text = CATEGORY_PROMPTS.get(template_category, WEBAPP_CATEGORY_PROMPT)
                if template_category in ("telegram_bot", "telegram-bot", "telegram"):
                    from api.src.ai.prompts.categories.telegram import TELEGRAM_CATEGORY_PROMPT
                    category_text = TELEGRAM_CATEGORY_PROMPT
                    template_specific = await self._get_template_specific_prompt(conversation_id)
                    if template_specific:
                        category_text += "\n\n" + template_specific
                else:
                    template_specific = await self._get_template_specific_prompt(conversation_id)
                    if template_specific:
                        category_text += "\n\n" + template_specific

                system_blocks.append({
                    "type": "text",
                    "text": category_text,
                    "cache_control": {"type": "ephemeral"},
                })

                if template_system:
                    system_blocks.append({
                        "type": "text",
                        "text": "## Template Instructions\n" + template_system,
                    })
            else:
                # FULL: base + category + template + boilerplate
                category_text = CATEGORY_PROMPTS.get(template_category, WEBAPP_CATEGORY_PROMPT)
                if template_category in ("telegram_bot", "telegram-bot", "telegram"):
                    from api.src.ai.prompts.categories.telegram import TELEGRAM_CATEGORY_PROMPT
                    category_text = TELEGRAM_CATEGORY_PROMPT
                    template_specific = await self._get_template_specific_prompt(conversation_id)
                    if template_specific:
                        category_text += "\n\n" + template_specific
                else:
                    template_specific = await self._get_template_specific_prompt(conversation_id)
                    if template_specific:
                        category_text += "\n\n" + template_specific

                system_blocks.append({
                    "type": "text",
                    "text": category_text,
                    "cache_control": {"type": "ephemeral"},
                })

                if template_system:
                    system_blocks.append({
                        "type": "text",
                        "text": "## Template Instructions\n" + template_system,
                    })

                # Load boilerplate files for Lovable-style generation (dynamic, no cache_control)
                boilerplate_context = await self._load_boilerplate_context(conversation_id)
                if boilerplate_context:
                    system_blocks.append({
                        "type": "text",
                        "text": boilerplate_context,
                    })
                    logger.info(
                        "Boilerplate loaded into system prompt",
                        extra={
                            "conversation_id": str_conversation_id,
                            "boilerplate_len": len(boilerplate_context),
                        },
                    )

            # Build effective_system as string for backward compat with agent loop
            effective_system = "\n\n".join(block["text"] for block in system_blocks)

            # Step 2: Build artifact context and add user message
            # current_artifacts already fetched above for classifier
            artifacts_context = self._build_artifacts_context(current_artifacts)

            # If no conversation artifacts yet, try project.generated_code for context
            if not artifacts_context:
                try:
                    result = await self.db.execute(
                        select(Conversation).where(Conversation.id == conversation_id)
                    )
                    conv = result.scalar_one_or_none()
                    if conv and conv.project_id:
                        proj_result = await self.db.execute(
                            select(Project).where(Project.id == conv.project_id)
                        )
                        proj = proj_result.scalar_one_or_none()
                        if proj and proj.generated_code and proj.generated_code.get("files"):
                            parts = ["Текущие файлы проекта (готовый код из шаблона):\n"]
                            for fname, fcontent in proj.generated_code["files"].items():
                                ext = fname.rsplit(".", 1)[-1].lower() if "." in fname else "text"
                                parts.append(f"```{ext}\n# filename: {fname}\n{fcontent}\n```\n")
                            artifacts_context = "\n".join(parts)
                except Exception as ctx_err:
                    logger.warning("Failed to load project generated_code for context: %s", ctx_err)

            # Compose user message with artifact context
            if artifacts_context:
                enriched_user_content = artifacts_context + "\n\nUser request:\n" + user_content
            else:
                enriched_user_content = user_content

            messages.append({
                "role": "user",
                "content": enriched_user_content
            })

            # Step 3: Call Anthropic streaming API with full history
            logger.info(
                "Starting AI streaming with full history",
                extra={
                    "conversation_id": str_conversation_id,
                    "message_count": len(messages),
                    "has_template": template_system is not None,
                    "artifacts_count": len(current_artifacts),
                },
            )

            # Route to Haiku for SIMPLE requests, Sonnet for everything else
            if request_complexity == RequestComplexity.SIMPLE:
                model_override = "haiku"
            else:
                model_override = settings.GENERATION_MODEL

            # Select API key/token from pool (priority: OAuth tokens > API keys)
            _selected_api_key = settings.ANTHROPIC_API_KEY
            _oauth_tokens = settings.ANTHROPIC_OAUTH_TOKEN_POOL
            _api_keys = settings.ANTHROPIC_API_KEY_POOL
            
            # Try OAuth token pool first (cheaper)
            if _oauth_tokens:
                try:
                    from api.src.proxy.token_pool import get_token_pool
                    from core.redis import get_redis
                    _redis = await get_redis()
                    _token_pool = get_token_pool(_redis)
                    _selected_api_key = await _token_pool.get_token()
                    logger.info("Using OAuth token from pool: ...%s", _selected_api_key[-8:])
                except Exception as _oauth_err:
                    logger.warning("OAuth token pool selection failed, falling back: %s", _oauth_err)
                    # Fallback to API key pool
                    if _api_keys:
                        try:
                            from api.src.proxy.key_pool import ApiKeyPool
                            from core.redis import get_redis
                            _redis = await get_redis()
                            _key_pool = ApiKeyPool(_redis)
                            _selected_api_key = await _key_pool.get_key(_api_keys)
                        except Exception as _pool_err:
                            logger.warning("Key pool selection failed, using default key: %s", _pool_err)
            elif _api_keys:
                # No OAuth tokens, try API key pool
                try:
                    from api.src.proxy.key_pool import ApiKeyPool
                    from core.redis import get_redis
                    _redis = await get_redis()
                    _key_pool = ApiKeyPool(_redis)
                    _selected_api_key = await _key_pool.get_key(_api_keys)
                except Exception as _pool_err:
                    logger.warning("Key pool selection failed, using default key: %s", _pool_err)

            # Route through AI Gateway if configured (handles OAT tokens properly)
            _gw_url = getattr(settings, 'ai_gateway_url', '') or getattr(settings, 'AI_GATEWAY_URL', '')
            _gw_key = getattr(settings, 'ai_gateway_key', '') or getattr(settings, 'AI_GATEWAY_KEY', '')
            if _gw_url and _gw_key:
                client = AnthropicClient(
                    api_key=_gw_key,
                    base_url=_gw_url,
                    default_model=model_override,
                    default_max_tokens=settings.GENERATION_MAX_TOKENS,
                )
                logger.info("Using AI Gateway: %s", _gw_url)
            else:
                client = AnthropicClient(
                    api_key=_selected_api_key,
                    default_model=model_override,
                    default_max_tokens=settings.GENERATION_MAX_TOKENS,
                )

            # Step 2b: Generate plan for first message only (no existing artifacts)
            is_first_message = len(current_artifacts) == 0
            if is_first_message:
                plan_response = await self._generate_plan(
                    client=client,
                    messages=messages,
                    effective_system=effective_system,
                    conversation_id=str_conversation_id,
                )
                if plan_response:
                    yield {"type": "plan", "content": plan_response}

            full_response = ""
            token_count = 0
            usage_data = None

            if use_agent_loop:
                # ===== AGENT LOOP PATH =====
                agent_result: dict[str, Any] = {}
                async for event in self._run_agent_loop_gen(
                    client=client,
                    messages=messages,
                    effective_system=effective_system,
                    current_artifacts=current_artifacts,
                    is_first_message=is_first_message,
                    template_category=template_category,
                    conversation_id=str_conversation_id,
                    result_out=agent_result,
                ):
                    yield event
                artifacts = agent_result["artifacts"]
                full_response = agent_result["full_response"]
                token_count = agent_result["token_count"]
            else:
                # ===== LEGACY PATH =====
                from infrastructure.services.anthropic.client import USAGE_MARKER

                usage_data = None
                # Stream tokens using full message history
                # Pass system_blocks (list[dict]) for optimal prompt caching
                async for token in client.stream_messages(
                    messages=messages,
                    system=system_blocks,
                ):
                    # Intercept usage marker — don't forward to client
                    if token.startswith(USAGE_MARKER):
                        try:
                            usage_data = json.loads(token[len(USAGE_MARKER):])
                        except json.JSONDecodeError:
                            pass
                        continue

                    full_response += token
                    token_count += 1

                    yield {
                        "type": "token",
                        "content": token
                    }

                # Extract artifacts via regex
                logger.info(
                    "Extracting artifacts from response",
                    extra={
                        "conversation_id": str_conversation_id,
                        "response_length": len(full_response),
                    },
                )
                artifacts = self.extract_artifacts(full_response)

                # Resolve generic titles on follow-up messages
                if not is_first_message and current_artifacts and artifacts:
                    _GENERIC_BASENAMES = {"file", "index", "app", "main", "page", "component"}
                    existing_by_type: dict[str, list] = {}
                    for ca in current_artifacts:
                        t = ca.type or "react"
                        existing_by_type.setdefault(t, []).append(ca)
                    for art in artifacts:
                        raw_title = art.get("title", "")
                        basename = raw_title.rsplit("/", 1)[-1].rsplit(".", 1)[0].lower()
                        if basename in _GENERIC_BASENAMES and art.get("type") in existing_by_type:
                            new_titles = {a["title"] for a in artifacts}
                            candidates = [
                                ca for ca in existing_by_type[art["type"]]
                                if ca.title and ca.title not in new_titles
                            ]
                            if candidates:
                                best = max(candidates, key=lambda c: c.created_at)
                                logger.info(
                                    "Resolved generic title '%s' -> '%s'",
                                    raw_title, best.title,
                                )
                                art["title"] = best.title

                # Validate and self-correct if needed (max 1 retry)
                if artifacts and settings.USE_GENERATION_V2:
                    from api.src.ai.core.validators import OutputValidator

                    validator = OutputValidator()
                    artifact_files = {
                        a["title"]: a["content"] for a in artifacts
                    }
                    artifact_files, validation = validator.validate_and_fix(
                        artifact_files
                    )

                    if not validation.passed:
                        yield {
                            "type": "correction",
                            "message": "Обнаружены ошибки в коде, исправляю...",
                            "errors_count": len(validation.errors),
                        }

                        correction_prompt = (
                            OutputValidator.format_errors_as_prompt(validation)
                        )
                        corrected_artifacts = await self._attempt_self_correction(
                            client=client,
                            messages=messages,
                            effective_system=effective_system,
                            full_response=full_response,
                            correction_prompt=correction_prompt,
                            conversation_id=str_conversation_id,
                        )
                        if corrected_artifacts:
                            # Merge corrected files into originals (don't replace the whole set)
                            corrected_by_title = {
                                a["title"]: a for a in corrected_artifacts
                            }
                            for a in artifacts:
                                if a["title"] in corrected_by_title:
                                    a["content"] = corrected_by_title[a["title"]]["content"]
                            # Add any new files from correction that weren't in originals
                            existing_titles = {a["title"] for a in artifacts}
                            for ca in corrected_artifacts:
                                if ca["title"] not in existing_titles:
                                    artifacts.append(ca)

                            corrected_files = {
                                a["title"]: a["content"] for a in artifacts
                            }
                            corrected_files, final_result = (
                                validator.validate_and_fix(corrected_files)
                            )
                            for a in artifacts:
                                if a["title"] in corrected_files:
                                    a["content"] = corrected_files[a["title"]]
                            full_response = (
                                "(self-corrected)\n" + full_response
                            )

                            if final_result.passed:
                                yield {
                                    "type": "correction",
                                    "message": "Ошибки исправлены!",
                                }
                            else:
                                yield {
                                    "type": "correction",
                                    "message": (
                                        "Частично исправлено. "
                                        "Осталось проблем: "
                                        f"{len(final_result.errors)}"
                                    ),
                                    "errors_count": len(
                                        final_result.errors
                                    ),
                                }
                        else:
                            yield {
                                "type": "correction",
                                "message": (
                                    "Не удалось автоматически исправить "
                                    "ошибки"
                                ),
                            }

                        logger.info(
                            "Self-correction completed",
                            extra={
                                "conversation_id": str_conversation_id,
                                "corrected": corrected_artifacts is not None,
                            },
                        )

                # Merge boilerplate files on first message (legacy only)
                _MERGE_CATEGORIES = (
                    "webapp", "website", "web_app", "web",
                    "telegram_bot", "telegram-bot", "telegram",
                )
                # Only merge boilerplate if AI actually generated code artifacts
                # If AI asked clarifying questions (0 artifacts), skip boilerplate save
                ai_artifact_count = len(artifacts)
                if is_first_message and template_category in _MERGE_CATEGORIES and ai_artifact_count > 0:
                    try:
                        from api.src.ai.boilerplates.loader import (
                            BoilerplateLoader,
                            _WEBAPP_FILES,
                            _WEBSITE_FILES,
                            _TELEGRAM_BOT_FILES,
                        )

                        loader = BoilerplateLoader(template_category)
                        boilerplate_dir = loader._boilerplate_dir

                        # Select the right file list based on category
                        if template_category in ("telegram_bot", "telegram-bot", "telegram"):
                            boilerplate_file_list = _TELEGRAM_BOT_FILES
                        elif template_category in ("website", "web"):
                            boilerplate_file_list = _WEBSITE_FILES
                        else:
                            boilerplate_file_list = _WEBAPP_FILES

                        if boilerplate_dir.exists():
                            ai_files = {a["title"]: a for a in artifacts}

                            def _ext_lang(path: str) -> str:
                                ext = path.rsplit(".", 1)[-1].lower() if "." in path else "text"
                                return {
                                    "ts": "typescript", "tsx": "tsx", "js": "javascript",
                                    "jsx": "jsx", "css": "css", "html": "html",
                                    "json": "json", "toml": "toml", "md": "markdown",
                                    "py": "python", "ini": "ini", "cfg": "ini",
                                    "yaml": "yaml", "yml": "yaml",
                                }.get(ext, "text")

                            def _ext_type(path: str) -> str:
                                ext = path.rsplit(".", 1)[-1].lower() if "." in path else "text"
                                return {
                                    "ts": "typescript", "tsx": "react", "js": "javascript",
                                    "jsx": "react", "css": "css", "html": "html",
                                    "json": "json", "toml": "toml", "md": "markdown",
                                    "py": "python", "ini": "ini", "cfg": "ini",
                                    "yaml": "yaml", "yml": "yaml",
                                }.get(ext, "text")

                            merged_artifacts = list(artifacts)
                            ai_titles = set(ai_files.keys())
                            ai_basenames = {t.rsplit("/", 1)[-1].lower() for t in ai_titles}
                            _BOILERPLATE_PLACEHOLDER_PAGES = {"src/pages/Home.tsx"}
                            ai_has_pages = any(
                                t.endswith(".tsx") or t.endswith(".jsx")
                                for t in ai_titles
                            )

                            for rel_path in boilerplate_file_list:
                                file_path = boilerplate_dir / rel_path
                                if not file_path.exists():
                                    continue
                                if rel_path in ai_titles:
                                    continue
                                basename = rel_path.rsplit("/", 1)[-1].lower()
                                if basename in ai_basenames:
                                    continue
                                if ai_has_pages and rel_path in _BOILERPLATE_PLACEHOLDER_PAGES:
                                    continue
                                try:
                                    content = file_path.read_text(encoding="utf-8")
                                    merged_artifacts.append({
                                        "type": _ext_type(rel_path),
                                        "title": rel_path,
                                        "content": content,
                                        "language": _ext_lang(rel_path),
                                    })
                                except Exception:
                                    pass

                            artifacts = merged_artifacts
                            logger.info(
                                "Boilerplate merged: %d ai + %d boilerplate = %d total",
                                len(ai_files), len(merged_artifacts) - len(ai_files),
                                len(merged_artifacts),
                                extra={"conversation_id": str_conversation_id},
                            )
                    except Exception as merge_err:
                        logger.warning("Boilerplate merge failed: %s", merge_err)

                # For website first-run generations, ensure the model actually adapted visible content
                # instead of returning a trivial cosmetic diff or leaving boilerplate branding intact.
                if is_first_message and template_category in ("website", "web") and artifacts:
                    try:
                        boilerplate_map = self._load_boilerplate_file_map(template_category)
                        if boilerplate_map and self._website_needs_content_regen(artifacts, boilerplate_map):
                            yield {
                                "type": "progress",
                                "message": "Дотягиваю контент лендинга поверх boilerplate...",
                            }

                            content_prompt = (
                                "Return ONLY a valid JSON object, no markdown and no code fences. "
                                "Generate structured landing content for an EXISTING website boilerplate.\n\n"
                                f"User request:\n{user_content}\n\n"
                                "Required JSON fields:\n"
                                "brand_name, nav, primary_action, hero_badge, hero_title, hero_description, hero_primary_action, hero_secondary_action, hero_panel_title, hero_bullets, features_eyebrow, features_title, features, metrics, cta_eyebrow, cta_title, cta_description, cta_primary_action, cta_secondary_action, footer_note, footer_links.\n"
                                "Rules:\n"
                                "- All text must be in Russian.\n"
                                "- nav and footer_links are arrays of {href,label}.\n"
                                "- features is an array of exactly 3 items with keys {icon,title,text,detail}.\n"
                                "- icon must be one of: layout, wand, layers.\n"
                                "- metrics is an array of exactly 3 items with keys {value,label}.\n"
                                "- Replace default boilerplate branding and generic copy with content matching the request.\n"
                            )

                            regen_response = await client.generate_code(
                                prompt=content_prompt,
                                system_prompt="You produce structured JSON for website boilerplate content. Return ONLY valid JSON.",
                                model=model_override,
                                max_tokens=min(settings.GENERATION_MAX_TOKENS, 1200),
                            )
                            content_data = self._extract_json_object(regen_response)
                            if content_data:
                                site_content = self._render_website_site_content(content_data)
                                artifacts = self._apply_artifact_overrides(
                                    artifacts,
                                    [{
                                        "type": "typescript",
                                        "title": "src/content/site.ts",
                                        "content": site_content,
                                        "language": "typescript",
                                    }],
                                )
                                logger.info(
                                    "Website content regen updated src/content/site.ts",
                                    extra={"conversation_id": str_conversation_id},
                                )
                    except Exception as website_regen_err:
                        logger.warning("Website content regen failed: %s", website_regen_err)

            if use_agent_loop and is_first_message and template_category in ("website", "web") and artifacts:
                try:
                    boilerplate_map = self._load_boilerplate_file_map(template_category)
                    if boilerplate_map and self._website_needs_content_regen(artifacts, boilerplate_map):
                        yield {
                            "type": "progress",
                            "message": "Дотягиваю контент лендинга поверх boilerplate...",
                        }

                        content_prompt = (
                            "Return ONLY a valid JSON object, no markdown and no code fences. "
                            "Generate structured landing content for an EXISTING website boilerplate.\n\n"
                            f"User request:\n{user_content}\n\n"
                            "Required JSON fields:\n"
                            "brand_name, nav, primary_action, hero_badge, hero_title, hero_description, hero_primary_action, hero_secondary_action, hero_panel_title, hero_bullets, features_eyebrow, features_title, features, metrics, cta_eyebrow, cta_title, cta_description, cta_primary_action, cta_secondary_action, footer_note, footer_links.\n"
                            "Rules:\n"
                            "- All text must be in Russian.\n"
                            "- nav and footer_links are arrays of {href,label}.\n"
                            "- features is an array of exactly 3 items with keys {icon,title,text,detail}.\n"
                            "- icon must be one of: layout, wand, layers.\n"
                            "- metrics is an array of exactly 3 items with keys {value,label}.\n"
                            "- Replace default boilerplate branding and generic copy with content matching the request.\n"
                        )

                        regen_response = await client.generate_code(
                            prompt=content_prompt,
                            system_prompt="You produce structured JSON for website boilerplate content. Return ONLY valid JSON.",
                            model=model_override,
                            max_tokens=min(settings.GENERATION_MAX_TOKENS, 1200),
                        )
                        content_data = self._extract_json_object(regen_response)
                        if content_data:
                            site_content = self._render_website_site_content(content_data)
                            artifacts = self._apply_artifact_overrides(
                                artifacts,
                                [{
                                    "type": "typescript",
                                    "title": "src/content/site.ts",
                                    "content": site_content,
                                    "language": "typescript",
                                }],
                            )
                            logger.info(
                                "Website content regen updated src/content/site.ts (agent path)",
                                extra={"conversation_id": str_conversation_id},
                            )
                except Exception as website_regen_err:
                    logger.warning("Website content regen failed on agent path: %s", website_regen_err)

            if is_first_message and template_category in ("website", "web") and artifacts:
                try:
                    boilerplate_map = self._load_boilerplate_file_map(template_category)
                    if boilerplate_map:
                        artifacts = self._enforce_website_first_run_contract(
                            artifacts,
                            boilerplate_map,
                        )
                except Exception as website_contract_err:
                    logger.warning(
                        "Website first-run contract enforcement failed: %s",
                        website_contract_err,
                    )

            # Step 4d: Validate imports — find missing files and generate them
            if artifacts and len(artifacts) > 0:
                try:
                    missing = self._find_missing_imports(artifacts)
                    if missing:
                        logger.info(
                            "Missing imports detected: %s",
                            missing,
                            extra={"conversation_id": str_conversation_id},
                        )
                        yield {"type": "progress", "message": f"Генерирую недостающие компоненты ({len(missing)})..."}

                        missing_list = ", ".join(missing)
                        fix_prompt = (
                            f"The following files are imported but missing from the project: {missing_list}\n\n"
                            "Generate ONLY these missing files. Each file should be a complete, working component "
                            "that fits the project theme and existing code. Output ONLY the missing files."
                        )

                        # Build context of existing artifacts
                        existing_context = "\n".join(
                            f"File: {a['title']}\n```\n{a['content'][:500]}\n```"
                            for a in artifacts[:10]
                        )

                        fix_response = await client.generate_code(
                            prompt=f"{fix_prompt}\n\nExisting project files:\n{existing_context}",
                            system_prompt=effective_system,
                            model=model_override,
                            max_tokens=settings.GENERATION_MAX_TOKENS,
                        )

                        # Parse fix response for artifacts
                        fix_artifacts = self.extract_artifacts(fix_response)
                        if fix_artifacts:
                            existing_titles = {a["title"] for a in artifacts}
                            for fa in fix_artifacts:
                                if fa["title"] not in existing_titles:
                                    artifacts.append(fa)
                            logger.info(
                                "Missing imports fixed: added %d files",
                                len(fix_artifacts),
                                extra={"conversation_id": str_conversation_id},
                            )
                except Exception as fix_err:
                    logger.warning("Missing imports fix failed: %s", fix_err)

            # Step 5: Save to database
            # Save user message (original, without artifact context)
            user_message = Message(
                conversation_id=conversation_id,
                role="user",
                content=user_content,
                tokens_used=0,
            )
            self.db.add(user_message)

            # Save assistant message
            assistant_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_response,
                tokens_used=token_count,
            )
            self.db.add(assistant_message)

            await self.db.flush()

            # Save artifacts
            saved_artifacts = []
            for artifact_data in artifacts:
                artifact = Artifact(
                    conversation_id=conversation_id,
                    message_id=assistant_message.id,
                    type=artifact_data["type"],
                    title=artifact_data["title"],
                    content=artifact_data["content"],
                    language=artifact_data["language"],
                    version=1,
                )
                self.db.add(artifact)
                await self.db.flush()

                saved_artifacts.append(artifact)

                yield {
                    "type": "artifact",
                    "artifact": {
                        "id": str(artifact.id),
                        "type": artifact.type,
                        "title": artifact.title,
                        "content": artifact.content,
                        "language": artifact.language,
                        "version": artifact.version,
                    }
                }

            await self.db.commit()

            # Update project.generated_code from artifacts
            if saved_artifacts:
                try:
                    conversation = await self.db.get(Conversation, conversation_id)
                    if conversation and conversation.project_id:
                        # ProjectStatus imported at top level
                        proj_result = await self.db.execute(
                            select(Project).where(Project.id == conversation.project_id)
                        )
                        project = proj_result.scalar_one_or_none()
                        if project:
                            # Build files dict from all current artifacts
                            all_artifacts = await self._get_current_artifacts(conversation_id)
                            files = {}
                            for a in all_artifacts:
                                fname = a.title or f"file_{a.id}.{a.language or 'txt'}"
                                files[fname] = a.content
                            if files:
                                project.generated_code = {"files": files}
                                project.status = ProjectStatus.READY.value
                                await self.db.commit()
                                logger.info("Updated project.generated_code with %d files", len(files))
                except Exception as proj_err:
                    logger.warning("Failed to update project generated_code: %s", proj_err)

            # Invalidate cache
            try:
                redis = await self._get_redis()
                cache_key = f"conversation:{str_conversation_id}:context"
                await redis.delete(cache_key)
            except Exception as cache_error:
                logger.warning(
                    "Failed to invalidate cache",
                    extra={
                        "conversation_id": str_conversation_id,
                        "error": str(cache_error),
                    },
                )

            # Include usage data if available (from legacy path or agent loop)
            done_event = {
                "type": "done",
                "message_id": str(assistant_message.id),
                "tokens_used": token_count,
            }
            if usage_data:
                done_event["usage"] = usage_data
            yield done_event

            logger.info(
                "Message streaming completed",
                extra={
                    "conversation_id": str_conversation_id,
                    "artifacts_count": len(artifacts),
                    "tokens_used": token_count,
                },
            )

            # Generate follow-up suggestions
            try:
                suggestion_prompt = (
                    "На основе только что сгенерированного бота, предложи 3 конкретных "
                    "улучшения которые пользователь может попросить в следующем сообщении. "
                    "Предложения должны быть:\n"
                    "1. Конкретными и действенными (не абстрактные)\n"
                    "2. Реализуемыми через доработку кода бота\n"
                    "3. Полезными для production использования\n\n"
                    "Примеры хороших предложений:\n"
                    '- "Добавить расписание работы"\n'
                    '- "Настроить уведомления админу"\n'  
                    '- "Добавить фото к услугам"\n'
                    '- "Добавить отзывы клиентов"\n'
                    '- "Настроить рабочие часы"\n\n'
                    "Формат: JSON массив из 3 строк на русском. "
                    "Каждый пункт 3-5 слов, начинается с глагола.\n"
                    'Пример: ["Добавить расписание работы", "Настроить уведомления админу", "Добавить фото к услугам"]'
                )
                suggestion_messages = [
                    {"role": "user", "content": suggestion_prompt},
                ]

                suggestion_response = ""
                async for chunk in client.stream_messages(
                    messages=suggestion_messages,
                    system=(
                        "Ты помощник. Отвечай только JSON массивом "
                        "строк на русском."
                    ),
                    max_tokens=200,
                ):
                    if chunk.startswith(USAGE_MARKER):
                        continue
                    suggestion_response += chunk

                suggestions = json.loads(suggestion_response.strip())
                if isinstance(suggestions, list) and len(suggestions) > 0:
                    yield {
                        "type": "suggestions",
                        "items": suggestions[:3],
                    }
            except Exception:
                pass  # Suggestions are optional, don't fail on error

        except Exception as e:
            error_msg = str(e)
            error_type = type(e).__name__

            # If 429 rate limit — mark key as limited in pool
            if "429" in error_msg or "rate_limit" in error_msg.lower() or "RateLimitError" in error_type:
                try:
                    _pool_keys = settings.ANTHROPIC_API_KEY_POOL
                    if _pool_keys and _selected_api_key:
                        from api.src.proxy.key_pool import ApiKeyPool
                        from core.redis import get_redis
                        _redis = await get_redis()
                        _key_pool = ApiKeyPool(_redis)
                        await _key_pool.report_rate_limited(_selected_api_key)
                except Exception as _rl_err:
                    logger.warning("Failed to report rate limit: %s", _rl_err)

            logger.error(
                "Message streaming failed",
                extra={
                    "conversation_id": str_conversation_id,
                    "error": error_msg,
                    "error_type": error_type,
                },
            )

            yield {
                "type": "error",
                "error": error_msg,
                "code": error_type,
            }

    def extract_artifacts(self, ai_response: str) -> list[dict[str, Any]]:
        """Extract artifacts from AI response.

        Patterns:
        - ```html\\n...\\n```
        - ```react\\n...\\n```
        - ```python\\n...\\n```
        etc.

        Extracts title from comments:
        - Python/JavaScript: # filename: main.py or // filename: app.js
        - HTML/XML: <!-- filename: index.html -->

        Args:
            ai_response: Full AI response text.

        Returns:
            List of artifact dicts:
            [{"type": "html", "title": "index.html", "content": "...", "language": "html"}]
        """
        artifacts = []

        # Log first 500 chars of response for debugging
        logger.info(
            "Extracting artifacts from response (preview: %s...)",
            ai_response[:200].replace("\n", "\\n"),
        )

        # Pattern to match code blocks with language (robust: handles \r\n and trailing spaces)
        # Handles: ```html, ```html   , ```html\r\n etc.
        pattern = r"```(\w+)[^\n]*\n(.*?)\n```"
        matches = re.findall(pattern, ai_response, re.DOTALL)

        logger.info("Regex matched %d code blocks", len(matches))

        # Valid artifact types (from schema)
        valid_types = {
            "html", "react", "vue", "svelte",
            "python", "javascript", "typescript",
            "css", "json", "yaml", "markdown", "text",
            "toml", "ini",
        }

        for lang, content in matches:
            lang_lower = lang.lower()

            # Check if this is a valid artifact type
            artifact_type = self._map_language_to_type(lang_lower)
            logger.info("Code block: lang=%s -> type=%s (valid=%s)", lang_lower, artifact_type, artifact_type in valid_types)
            if artifact_type not in valid_types:
                continue

            # Extract title from content
            title = self._extract_title_from_content(content, lang_lower)

            # Strip leading filename/title comment from content — it's metadata,
            # not code.  Leaving it causes Vite/Babel parse errors in preview.
            clean_content = re.sub(
                r"^(?://|#|<!--)\s*(?:filename|title)\s*:\s*.+?(?:-->)?\s*\n",
                "",
                content.strip(),
                count=1,
                flags=re.IGNORECASE,
            )

            artifacts.append({
                "type": artifact_type,
                "title": title or f"file.{lang_lower}",
                "content": clean_content,
                "language": lang_lower
            })

            logger.info(
                "Extracted artifact: type=%s title=%s content_len=%d",
                artifact_type, title, len(content),
            )

        logger.info("Artifact extraction complete: %d artifacts", len(artifacts))

        return artifacts

    def _extract_title_from_content(self, content: str, language: str) -> str | None:
        """Extract title/filename from code comments.

        Args:
            content: Code content.
            language: Programming language.

        Returns:
            Extracted title or None.
        """
        # Try different comment patterns
        patterns = [
            r"#\s*(?:title|filename):\s*(.+)",  # Python, Ruby, Shell, YAML
            r"//\s*(?:title|filename):\s*(.+)",  # JavaScript, C++, Java
            r"<!--\s*(?:title|filename):\s*(.+?)\s*-->",  # HTML, XML
            r"/\*\s*(?:title|filename):\s*(.+?)\s*\*/",  # CSS, C
        ]

        # Only check first few lines (where filename comments typically are)
        first_lines = "\n".join(content.split("\n")[:5])

        for pattern in patterns:
            match = re.search(pattern, first_lines, re.IGNORECASE)
            if match:
                return match.group(1).strip()

        return None

    def _map_language_to_type(self, language: str) -> str:
        """Map language identifier to ArtifactType.

        Args:
            language: Language identifier from code block.

        Returns:
            ArtifactType string.
        """
        # Direct mapping
        type_map = {
            "html": "html",
            "react": "react",
            "jsx": "react",
            "vue": "vue",
            "svelte": "svelte",
            "python": "python",
            "py": "python",
            "javascript": "javascript",
            "js": "javascript",
            "typescript": "typescript",
            "ts": "typescript",
            "tsx": "react",
            "css": "css",
            "scss": "css",
            "sass": "css",
            "json": "json",
            "yaml": "yaml",
            "yml": "yaml",
            "markdown": "markdown",
            "md": "markdown",
            "text": "text",
            "txt": "text",
            "toml": "toml",
            "ini": "ini",
            "cfg": "ini",
            "dockerfile": "text",
        }

        return type_map.get(language, "text")

    async def _generate_plan(
        self,
        client: AnthropicClient,
        messages: list[dict[str, Any]],
        effective_system: str,
        conversation_id: str,
    ) -> str | None:
        """Generate a brief plan before the main generation.

        Asks Claude to outline 3-5 steps of what it will do,
        using a small max_tokens for speed.

        Args:
            client: AnthropicClient instance.
            messages: Conversation message history.
            effective_system: System prompt.
            conversation_id: Conversation ID for logging.

        Returns:
            Plan text or None if generation failed.
        """
        logger.info(
            "Generating plan",
            extra={"conversation_id": conversation_id},
        )

        plan_prompt = (
            "Опиши кратко в 3-5 пунктах, что ты собираешься "
            "сделать для этого запроса. "
            "Формат: нумерованный список. Только план, без кода. "
            "Максимум 200 слов."
        )

        try:
            # Append plan request as a user message after the original
            plan_messages = list(messages) + [
                {"role": "user", "content": plan_prompt},
            ]

            plan_response = ""
            async for chunk in client.stream_messages(
                messages=plan_messages,
                system=effective_system,
                max_tokens=500,
            ):
                if not chunk.startswith(USAGE_MARKER):
                    plan_response += chunk

            if plan_response.strip():
                logger.info(
                    "Plan generated",
                    extra={
                        "conversation_id": conversation_id,
                        "plan_length": len(plan_response),
                    },
                )
                return plan_response.strip()

            return None

        except Exception as e:
            logger.warning(
                "Plan generation failed, continuing without plan",
                extra={
                    "conversation_id": conversation_id,
                    "error": str(e),
                },
            )
            return None

    async def _run_agent_loop_gen(
        self,
        client: AnthropicClient,
        messages: list[dict[str, Any]],
        effective_system: str,
        current_artifacts: list[Artifact],
        is_first_message: bool,
        template_category: str,
        conversation_id: str,
        result_out: dict[str, Any] | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Run agent loop and yield WS events.

        Results are written to result_out dict with keys:
        artifacts, full_response, token_count.
        """
        from api.src.ai.agent.budget import AgentBudget
        from api.src.ai.agent.events import (
            FinalTextEvent,
            IterationEvent,
            TextEvent,
            ToolCallEvent,
            ToolResultEvent,
        )
        from api.src.ai.agent.loop import AgentLoop
        from api.src.ai.agent.tools import TOOLS, ProjectWorkspace

        # Initialize workspace with existing artifacts (for follow-up messages)
        initial_files: dict[str, str] = {}
        if current_artifacts:
            for art in current_artifacts:
                if art.title and art.content:
                    initial_files[art.title] = art.content

        # On first message, pre-load boilerplate into workspace
        _AGENT_BOILERPLATE_CATEGORIES = (
            "webapp", "website", "web_app", "web",
            "telegram_bot", "telegram-bot", "telegram",
        )
        if is_first_message and template_category in _AGENT_BOILERPLATE_CATEGORIES:
            try:
                from api.src.ai.boilerplates.loader import (
                    BoilerplateLoader,
                    _TELEGRAM_BOT_FILES,
                    _WEBAPP_FILES,
                    _WEBSITE_FILES,
                )

                loader = BoilerplateLoader(template_category)
                boilerplate_dir = loader._boilerplate_dir

                if template_category in ("telegram_bot", "telegram-bot", "telegram"):
                    boilerplate_file_list = _TELEGRAM_BOT_FILES
                elif template_category in ("website", "web"):
                    boilerplate_file_list = _WEBSITE_FILES
                else:
                    boilerplate_file_list = _WEBAPP_FILES

                if boilerplate_dir.exists():
                    for rel_path in boilerplate_file_list:
                        file_path = boilerplate_dir / rel_path
                        if file_path.exists():
                            try:
                                initial_files[rel_path] = file_path.read_text(encoding="utf-8")
                            except Exception:
                                pass
                    logger.info(
                        "Boilerplate loaded into workspace: %d files",
                        len(initial_files),
                    )
            except Exception as e:
                logger.warning("Failed to load boilerplate into workspace: %s", e)

        workspace = ProjectWorkspace(initial_files)
        budget = AgentBudget.from_settings()

        agent = AgentLoop(
            client=client.client,
            model=client.default_model,
            system=effective_system,
            tools=TOOLS,
            budget=budget,
            workspace=workspace,
            max_tokens_per_turn=client.default_max_tokens,
        )

        full_response = ""

        async for event in agent.run(messages):
            if isinstance(event, FinalTextEvent):
                # Final clean text — show to user (replaces streaming indicators)
                # Strip any code blocks that AI leaked into the text response
                clean_text = re.sub(
                    r"```\w*\n.*?\n```",
                    "",
                    event.content,
                    flags=re.DOTALL,
                ).strip()
                full_response = clean_text
                yield {
                    "type": "final_text",
                    "content": clean_text,
                }
            elif isinstance(event, TextEvent):
                # Intermediate iteration text — log only, don't show to user
                pass
            elif isinstance(event, ToolCallEvent):
                # Strip large content from tool_input for WS
                ws_input = {
                    k: v for k, v in event.tool_input.items()
                    if k != "content"
                }
                if "content" in event.tool_input:
                    ws_input["content_length"] = len(
                        event.tool_input["content"]
                    )
                yield {
                    "type": "tool_call",
                    "tool_name": event.tool_name,
                    "tool_input": ws_input,
                    "iteration": event.iteration,
                }
            elif isinstance(event, ToolResultEvent):
                yield {
                    "type": "tool_result",
                    "tool_name": event.tool_name,
                    "success": event.success,
                    "summary": event.summary,
                    "iteration": event.iteration,
                }
            elif isinstance(event, IterationEvent):
                yield {
                    "type": "iteration",
                    "current": event.current,
                    "max": event.max_iterations,
                    "tokens_used": event.tokens_used,
                }

        # Get artifacts from workspace (not regex extraction)
        artifacts = workspace.to_artifacts()
        token_count = agent.total_tokens

        logger.info(
            "Agent loop completed: %d artifacts, %d tokens",
            len(artifacts), token_count,
            extra={"conversation_id": conversation_id},
        )

        if result_out is not None:
            result_out["artifacts"] = artifacts
            result_out["full_response"] = full_response
            result_out["token_count"] = token_count

    async def _attempt_self_correction(
        self,
        client: AnthropicClient,
        messages: list[dict[str, Any]],
        effective_system: str,
        full_response: str,
        correction_prompt: str,
        conversation_id: str,
    ) -> list[dict[str, Any]] | None:
        """Ask Claude to fix validation errors found in generated artifacts.

        Sends the original response + validation errors as a follow-up
        message and extracts corrected artifacts from the response.

        Args:
            client: AnthropicClient instance.
            messages: Conversation message history.
            effective_system: System prompt used.
            full_response: Original AI response text.
            correction_prompt: Formatted validation errors.
            conversation_id: Conversation ID for logging.

        Returns:
            List of corrected artifact dicts or None if correction failed.
        """
        logger.info(
            "Attempting self-correction for conversation",
            extra={"conversation_id": conversation_id},
        )

        try:
            # Build correction messages: original history + assistant response + correction request
            correction_messages = list(messages) + [
                {"role": "assistant", "content": full_response},
                {"role": "user", "content": correction_prompt},
            ]

            correction_response = ""
            async for token in client.stream_messages(
                messages=correction_messages,
                system=effective_system,
            ):
                correction_response += token

            corrected_artifacts = self.extract_artifacts(correction_response)
            if corrected_artifacts:
                logger.info(
                    "Self-correction produced artifacts",
                    extra={
                        "conversation_id": conversation_id,
                        "artifact_count": len(corrected_artifacts),
                    },
                )
                return corrected_artifacts

            logger.warning(
                "Self-correction produced no artifacts",
                extra={"conversation_id": conversation_id},
            )
            return None

        except Exception as e:
            logger.error(
                "Self-correction failed",
                extra={
                    "conversation_id": conversation_id,
                    "error": str(e),
                },
            )
            return None
