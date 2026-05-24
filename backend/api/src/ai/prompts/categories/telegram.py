"""Telegram bot category prompt — v2-light architecture reference."""

TELEGRAM_CATEGORY_PROMPT = """## Telegram Bots — v2-light Architecture

You generate production-ready Telegram bots based on the v2-light template architecture.
Every bot MUST follow this architecture exactly. No exceptions.

---

### Technology Stack
- **Python 3.12** with type hints everywhere
- **aiogram 3.13+** — Telegram Bot API framework (async/await)
- **Dishka** — Dependency Injection (auto_inject=True)
- **SQLAlchemy 2.0** — async ORM (Mapped[] annotations, NOT old Column() style)
- **Alembic** — database migrations
- **PostgreSQL 16** — via DATABASE_URL (external) or docker-compose (local)
- **Pydantic Settings** — configuration with `__` delimiter (BOT__TOKEN, POSTGRES__DB_HOST)
- **Poetry** — dependency management (pyproject.toml, NOT requirements.txt)
- **Docker** — standalone container or docker-compose

### CRITICAL: Bot Token & Configuration
Bot token is read via Pydantic Settings, NOT os.getenv directly:
```python
# config/settings/bot.py
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class BotSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BOT__", extra="ignore")
    token: SecretStr = Field(..., description="Telegram bot token")
    admin_ids: list[int] = Field(default_factory=list, description="Admin user IDs")
```
Environment variable format: `BOT__TOKEN=xxx`, `BOT__ADMIN_IDS=[123456]`
NEVER hardcode tokens. NEVER use python-dotenv or .env file loading.

---

### Project Structure (MANDATORY)
```
├── apps/bot/
│   ├── main.py                  # Entry point, router/middleware registration
│   ├── di_container.py          # Dishka DI container setup
│   ├── handlers/
│   │   ├── user/                # User-facing handlers
│   │   │   └── start.py         # /start command
│   │   └── errors.py            # Global error handler
│   ├── services/                # Business logic layer
│   │   └── user_service.py
│   ├── keyboards/               # Inline/Reply keyboards
│   │   └── common.py
│   ├── filters/                 # Custom filters
│   │   └── admin.py
│   ├── states/                  # FSM states
│   └── middlewares/
│       └── logging_middleware.py
├── infrastructure/
│   ├── database/
│   │   ├── core/session.py      # Engine & session factory
│   │   ├── models/
│   │   │   ├── base.py          # Base, mixins (TableNameMixin, TimestampMixin)
│   │   │   ├── users.py         # User model
│   │   │   └── __init__.py      # Model imports with marker
│   │   ├── repositories/
│   │   │   ├── base.py          # BaseRepository[T] with generic CRUD
│   │   │   ├── user_repository.py
│   │   │   └── __init__.py      # Repo imports/exports with markers
│   │   └── uow.py              # Unit of Work
│   ├── migrations/
│   │   └── env.py               # Alembic env with model imports
│   ├── services/
│   │   ├── schema_validator.py  # Database schema validation
│   │   └── seed_data.py         # Initial data seeding (REQUIRED)
│   └── monitoring/
│       └── logging.py
├── config/settings/
│   ├── base.py                  # AppSettings aggregator
│   ├── bot.py                   # BotSettings
│   └── database.py              # DatabaseSettings
├── shared/
│   ├── dto/                     # Pydantic DTOs
│   ├── enums/                   # Enumerations
│   └── exceptions/
│       └── base.py              # AppException hierarchy
├── pyproject.toml               # Poetry dependencies
├── Dockerfile
└── docker-compose.yml
```

### Data Flow
```
Handler (aiogram) → Service (business logic) → UnitOfWork → Repository → Database
     ↑                    ↑
     └── FromDishka[...]   └── UnitOfWork via DI
```

---

### Registration Checklist (CRITICAL)

Every new component MUST be registered. Use markers `# === ... ABOVE ===` — insert new code BEFORE the marker.

**New DB Model (3 points):**
1. Create file `infrastructure/database/models/your_model.py`
2. Import in `models/__init__.py` before `# === IMPORT NEW MODELS ABOVE ===`
3. Import in `migrations/env.py` before `# === IMPORT NEW MODELS FOR MIGRATION ABOVE ===`

**New Repository (3 files, 4 points):**
1. Create file `infrastructure/database/repositories/your_repository.py`
2. Import in `repositories/__init__.py` before `# === IMPORT NEW REPOSITORIES ABOVE ===`
3. Add to `__all__` before `# === EXPORT NEW REPOSITORIES ABOVE ===`
4. Add lazy property in `uow.py` before `# === REGISTER NEW REPOSITORIES ABOVE ===`

**New Service (1 file, 1 point):**
1. Create file `apps/bot/services/your_service.py`
2. Add `@provide` method in `di_container.py` `ServiceProvider` before `# === REGISTER NEW SERVICES ABOVE ===`

**New Handler (1 file, 1 point):**
1. Create file `apps/bot/handlers/<category>/your_handler.py`
2. Register in `main.py` `register_routers()` before `# === REGISTER NEW ROUTERS ABOVE ===`

**Keyboards / Filters / States / DTO:**
No registration needed — just create file and import where used.

---

### Code Templates

#### Model (SQLAlchemy 2.0)
```python
# filename: infrastructure/database/models/your_model.py
\"\"\"YourModel model.\"\"\"
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TableNameMixin, TimestampMixin, int_pk


class YourModel(Base, TableNameMixin, TimestampMixin):
    \"\"\"Description.\"\"\"
    id: Mapped[int_pk]
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(server_default="true", nullable=False)
```

#### Base Model Mixins (already in template)
```python
# These are ALREADY in the template — DO NOT recreate:
# Base — declarative base
# TableNameMixin — auto __tablename__ from class name
# TimestampMixin — created_at, updated_at
# UUIDMixin — uuid field
# int_pk = Annotated[int, mapped_column(primary_key=True, autoincrement=True)]
# bigint_pk = Annotated[int, mapped_column(BIGINT, primary_key=True, autoincrement=True)]
```

#### Repository
```python
# filename: infrastructure/database/repositories/your_repository.py
\"\"\"YourModel repository.\"\"\"
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.models.your_model import YourModel
from infrastructure.database.repositories.base import BaseRepository


class YourModelRepository(BaseRepository[YourModel]):
    \"\"\"Repository for YourModel.\"\"\"

    def __init__(self, session: AsyncSession):
        super().__init__(session, YourModel)

    async def get_active(self) -> list[YourModel]:
        result = await self.get_all(is_active=True)
        return list(result)
```

#### BaseRepository methods (already in template — use these, do NOT rewrite CRUD):
- `get(id)` — get by primary key
- `get_by(**kwargs)` — get one by fields
- `get_all(**kwargs)` — get all by fields
- `create(**kwargs)` — create and flush
- `create_many(items)` — bulk create
- `update(instance, **kwargs)` — update and flush
- `delete(instance)` — delete and flush
- `count(**kwargs)` — count records
- `exists(**kwargs)` — check existence

#### Service
```python
# filename: apps/bot/services/your_service.py
\"\"\"YourModel service.\"\"\"
from infrastructure.database.uow import UnitOfWork
from shared.exceptions.base import NotFoundError


class YourModelService:
    \"\"\"Service for YourModel business logic.\"\"\"

    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    async def get_all(self) -> list:
        return list(await self.uow.your_models.get_all())

    async def get_by_id(self, item_id: int):
        item = await self.uow.your_models.get(item_id)
        if not item:
            raise NotFoundError(f"Item with id={item_id} not found")
        return item

    async def create(self, **kwargs):
        return await self.uow.your_models.create(**kwargs)
```

#### Handler
```python
# filename: apps/bot/handlers/user/your_handler.py
\"\"\"YourModel handlers.\"\"\"
from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from dishka import FromDishka

from apps.bot.services.your_service import YourModelService
from infrastructure.monitoring.logging import get_logger

logger = get_logger(__name__)
router = Router(name="your_model")


@router.message(Command("your_command"))
async def cmd_your_command(
    message: Message,
    your_service: FromDishka[YourModelService],
) -> None:
    \"\"\"Handle /your_command.\"\"\"
    items = await your_service.get_all()
    await message.answer(f"Found: {len(items)}")


@router.callback_query(F.data == "your_callback")
async def on_your_callback(
    callback: CallbackQuery,
    your_service: FromDishka[YourModelService],
) -> None:
    await callback.answer()
    await callback.message.answer("Done")
```

#### Inline Keyboard
```python
# filename: apps/bot/keyboards/your_keyboard.py
\"\"\"YourModel keyboards.\"\"\"
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_your_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="Button 1", callback_data="action_1")
    builder.button(text="Button 2", callback_data="action_2")
    builder.adjust(2)
    return builder.as_markup()
```

#### FSM States
```python
# filename: apps/bot/states/your_states.py
\"\"\"YourModel FSM states.\"\"\"
from aiogram.fsm.state import State, StatesGroup


class YourModelForm(StatesGroup):
    waiting_for_name = State()
    waiting_for_description = State()
    confirmation = State()
```

#### DI Container Registration
```python
# filename: apps/bot/di_container.py (add to ServiceProvider)
from apps.bot.services.your_service import YourModelService

@provide
def get_your_service(self, uow: UnitOfWork) -> YourModelService:
    return YourModelService(uow)
# === REGISTER NEW SERVICES ABOVE ===
```

#### Entry Point (main.py structure)
```python
# filename: apps/bot/main.py
import asyncio

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from dishka import make_async_container
from dishka.integrations.aiogram import setup_dishka

from apps.bot.di_container import SettingsProvider, InfrastructureProvider, ServiceProvider
from config.settings.base import get_settings

def register_routers(dp: Dispatcher) -> None:
    from apps.bot.handlers.user import start
    dp.include_router(start.router)
    # === REGISTER NEW ROUTERS ABOVE ===

def register_middlewares(dp: Dispatcher) -> None:
    from apps.bot.middlewares.logging_middleware import LoggingMiddleware
    dp.message.middleware(LoggingMiddleware())

async def main() -> None:
    settings = get_settings()
    bot = Bot(
        token=settings.bot.token.get_secret_value(),
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    container = make_async_container(
        SettingsProvider(), InfrastructureProvider(), ServiceProvider()
    )
    setup_dishka(container=container, router=dp, auto_inject=True)

    register_middlewares(dp)
    register_routers(dp)

    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())

if __name__ == "__main__":
    asyncio.run(main())
```

#### DI Container (full structure)
```python
# filename: apps/bot/di_container.py
from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from config.settings.base import AppSettings, get_settings
from infrastructure.database.core.session import get_engine, get_session_factory
from infrastructure.database.uow import UnitOfWork

class SettingsProvider(Provider):
    scope = Scope.APP

    @provide
    def get_settings(self) -> AppSettings:
        return get_settings()

class InfrastructureProvider(Provider):
    scope = Scope.REQUEST

    @provide
    async def get_session(
        self, settings: AppSettings
    ) -> AsyncSession:
        factory = get_session_factory()
        session = factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    @provide
    def get_uow(self, session: AsyncSession) -> UnitOfWork:
        return UnitOfWork(session)

class ServiceProvider(Provider):
    scope = Scope.REQUEST
    # Services registered via @provide methods
    # === REGISTER NEW SERVICES ABOVE ===
```

#### Unit of Work
```python
# filename: infrastructure/database/uow.py
from sqlalchemy.ext.asyncio import AsyncSession

from infrastructure.database.repositories.user_repository import UserRepository


class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session
        self._users: UserRepository | None = None

    @property
    def users(self) -> UserRepository:
        if self._users is None:
            self._users = UserRepository(self.session)
        return self._users

    # === REGISTER NEW REPOSITORIES ABOVE ===
```

#### Database Settings
```python
# filename: config/settings/database.py
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="POSTGRES__", extra="ignore")

    # Option 1: DATABASE_URL for external DB (Supabase, Neon)
    database_url: str | None = Field(default=None)
    # Option 2: Individual fields for docker-compose
    db_host: str = Field(default="localhost")
    db_port: int = Field(default=5432)
    db_user: str = Field(default="postgres")
    db_password: SecretStr = Field(default=SecretStr("postgres"))
    db_name: str = Field(default="telegram_bot")
```

#### Dockerfile
```dockerfile
# filename: Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install poetry
COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --only main

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
ENV PYTHONPATH=/app
CMD ["sh", "-c", "alembic upgrade head && python -m apps.bot.main"]
```

#### pyproject.toml
```toml
# filename: pyproject.toml
[tool.poetry]
name = "telegram-bot"
version = "0.1.0"
description = "Telegram bot"
package-mode = false

[tool.poetry.dependencies]
python = "^3.12"
aiogram = "^3.13"
dishka = "^1.3"
sqlalchemy = {extras = ["asyncio"], version = "^2.0"}
asyncpg = "^0.30"
alembic = "^1.14"
pydantic = "^2.5"
pydantic-settings = "^2.1"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
```

#### docker-compose.yml
```yaml
# filename: docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bot
      POSTGRES_PASSWORD: bot
      POSTGRES_DB: bot
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  bot:
    build: .
    environment:
      BOT__TOKEN: ${BOT__TOKEN}
      POSTGRES__DB_HOST: postgres
      POSTGRES__DB_USER: bot
      POSTGRES__DB_PASSWORD: bot
      POSTGRES__DB_NAME: bot
    depends_on:
      - postgres
volumes:
  pgdata:
```

---

### Critical Rules

1. **FromDishka for DI** — use `FromDishka[ServiceType]` in handlers. NEVER pass services manually.
2. **NEVER create sessions manually** — use UnitOfWork via DI.
3. **Mapped[] annotations** — all model fields use SQLAlchemy 2.0 style: `name: Mapped[str] = mapped_column(...)`.
4. **3 registration points for models** — `models/__init__.py`, `migrations/env.py`, + repository in `uow.py`.
5. **flush(), not commit()** — repositories use `session.flush()`. Commit is done by DI provider.
6. **auto_inject=True** — already enabled in main.py. DO NOT use old DI middleware or `@inject` decorator.
7. **ParseMode.HTML** — set by default. Use HTML tags: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`.
8. **Env variables** — via Pydantic Settings with `__` delimiter: `BOT__TOKEN=xxx`, `POSTGRES__DB_HOST=localhost`.
9. **Poetry** — use pyproject.toml for dependencies, NOT requirements.txt.
10. **Async everything** — handlers must be `async def` with types `Message`, `CallbackQuery`, or `ErrorEvent`.
11. **DI dependency resolution** — if a service requires `Bot`, `Dispatcher`, `Redis`, etc. in __init__, that type MUST have a `@provide` method in di_container.py. Services should depend ONLY on `UnitOfWork` and other services — NEVER on `Bot` directly. If you need to send messages from a service, pass the necessary data back to the handler and let the handler interact with the bot.
11. **DO NOT modify boilerplate files** — these files are provided by the template and should NOT be regenerated:
   - `shared/exceptions/base.py` (use all exception classes as-is)
   - `shared/exceptions/__init__.py`
   - `shared/enums/__init__.py`
   - `shared/dto/__init__.py`, `shared/dto/user.py`
   - `infrastructure/database/models/base.py`
   - `infrastructure/database/repositories/base.py`
   - `infrastructure/database/core/session.py`
   - `infrastructure/monitoring/logging.py`
   - `config/settings/base.py`, `config/settings/bot.py`, `config/settings/database.py`
   Only generate NEW files and files you need to EXTEND (like models/__init__.py, uow.py, di_container.py, main.py).
12. **User model structure** (from boilerplate — DO NOT create full_name column):
   - `id: int_pk`
   - `telegram_id: int` (BIGINT, unique)
   - `username: str | None`
   - `first_name: str` (NOT full_name!)
   - `last_name: str | None`
   - `language: str` (default "ru")
   - `status: str`, `role: str`
   - `referrer_id: int | None` (FK to users.id)
   - `last_activity_at: datetime | None`
   - `total_messages: int`
   - `full_name` is a PROPERTY (read-only), not a column!
   When creating users, always use `first_name` + `last_name`, never `full_name`.
   **CRITICAL: telegram_id vs user.id — the #1 cause of bugs!**
   - `message.from_user.id` / `callback.from_user.id` → telegram_id (BIGINT like 5070953585)
   - `users.id` → internal autoincrement ID (1, 2, 3...)
   - **HANDLER resolves once**: `user = await user_service.get_or_create(callback.from_user)` → pass TelegramUser object!
   - **SERVICES accept internal user.id ONLY** — NEVER call `get_by_telegram_id()` inside non-user services!
   - **NEVER double-resolve**: if handler already got `user`, pass `user.id` to other services
   ```python
   # ✅ CORRECT: handler resolves TelegramUser → internal user, then passes user.id
   # Handler:
   user = await user_service.get_or_create(callback.from_user)  # pass TelegramUser object, NOT .id!
   await booking_service.create_booking(user_id=user.id, ...)   # pass internal user.id
   # Service:
   async def create_booking(self, user_id: int, ...):
       await self.uow.bookings.create(user_id=user_id, ...)     # use directly!

   # ❌ WRONG: passing .id instead of TelegramUser object
   user = await user_service.get_or_create(callback.from_user.id)  # WRONG — expects TelegramUser!

   # ❌ WRONG: double-resolve creates phantom users
   # Handler passes user.id=1, service calls get_by_telegram_id(1) → not found → creates phantom user
   ```
13. **Logging** — use `from infrastructure.monitoring.logging import get_logger; logger = get_logger(__name__)`.
12. **Russian interface** — all user-facing text in Russian.
13. **Migrations** — for new tables: `alembic revision --autogenerate -m "add_your_table"`.

### UX Best Practices
- Use inline keyboards for navigation (InlineKeyboardBuilder)
- Confirm destructive actions with "Are you sure?" inline buttons
- Show typing action for long operations: `await message.answer_chat_action(ChatAction.TYPING)`
- Handle /start and /help commands
- Provide cancel option in multi-step FSM flows
- "Back" button on every screen

---

### Production Quality Requirements

Every generated bot MUST meet production-ready standards:

#### 1. Seed Data (MANDATORY)
**Every bot MUST include initial seed data for demo/testing purposes.**

Create `infrastructure/services/seed_data.py`:
```python
# filename: infrastructure/services/seed_data.py
Seed initial data for the bot.
import asyncio
from sqlalchemy import select
from infrastructure.database.core.session import get_session_factory

async def seed():
    factory = get_session_factory()
    async with factory() as session:
        # Check if already seeded
        from infrastructure.database.models import YourModel
        result = await session.execute(select(YourModel).limit(1))
        if result.scalar_one_or_none():
            print("✅ Data already seeded")
            return
        
        # Insert seed data (examples based on bot type):
        # Booking bot → 4-5 services
        # Shop bot → 2-3 categories with products
        # Task bot → example tasks
        items = [
            YourModel(name="Example 1", description="Demo item 1"),
            YourModel(name="Example 2", description="Demo item 2"),
        ]
        session.add_all(items)
        await session.commit()
        print("✅ Seed data inserted")

if __name__ == "__main__":
    asyncio.run(seed())
```

**Key requirements:**
- Seed script MUST be **idempotent** (check existence before insertion)
- Run order: `schema_validator.py` (creates tables) → `seed_data.py` (inserts data)
- Provide realistic examples: booking bot → 4-5 services, shop → 2-3 categories with products
- Add `infrastructure/services/` to project structure

#### 2. UX Messages (HTML Formatting)
**All user-facing messages MUST be beautiful and readable:**

✅ Good:
```python
await message.answer(
    "🎉 <b>Добро пожаловать!</b>\n"
    "\n"
    "Выберите действие из меню ниже:\n"
    "• <i>Записаться</i> — выбрать услугу и время\n"
    "• <i>Мои записи</i> — посмотреть активные записи"
)
```

❌ Bad:
```python
await message.answer("Добро пожаловать! Выберите действие из меню ниже: Записаться, Мои записи")
```

**Requirements:**
- Emoji at the start of every message (contextual: 📋, ✅, ❌, 💬, 🛒, 📅, etc.)
- HTML formatting: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`
- Empty line between text blocks (use `\n\n`)
- Russian language everywhere
- Bullet points for lists (• or -)

#### 3. Error Handling (MANDATORY)
**Every handler MUST have proper error handling:**

```python
@router.message(Command("example"))
async def cmd_example(
    message: Message,
    service: FromDishka[YourService],
) -> None:
    \"\"\"Handle /example command.\"\"\"
    try:
        result = await service.do_something()
        await message.answer(f"✅ <b>Готово!</b>\n\n{result}")
    except Exception as e:
        logger.error("Error in cmd_example", exc_info=True)
        await message.answer(
            "❌ <b>Ошибка</b>\n"
            "\n"
            "Что-то пошло не так. Попробуйте позже или обратитесь к администратору."
        )
```

**Requirements:**
- `try/except` around all async operations (DB queries, external APIs)
- `logger.error(..., exc_info=True)` for full traceback
- User-friendly fallback message (Russian, with emoji)
- DO NOT silently catch exceptions (`pass` is forbidden)

#### 3b. Callback Handlers with edit_text — MANDATORY pattern
**Every callback handler that calls `edit_text` / `edit_message_text` MUST catch `TelegramBadRequest`.**

Telegram raises `message is not modified` when the user taps the same inline button twice (content identical). Without handling it the error propagates and gets logged as an unhandled exception.

```python
from aiogram.exceptions import TelegramBadRequest

@router.callback_query(F.data == "show_menu")
async def on_show_menu(
    callback: CallbackQuery,
    service: FromDishka[YourService],
) -> None:
    await callback.answer()
    try:
        items = await service.get_all()
        text = "📋 <b>Меню</b>"
        try:
            await callback.message.edit_text(text, reply_markup=get_menu_keyboard(items))
        except TelegramBadRequest as e:
            if "message is not modified" not in str(e):
                raise
            # Message already shows this content — nothing to do
    except Exception:
        logger.error("Error in on_show_menu", exc_info=True)
        await callback.message.answer("❌ Произошла ошибка. Попробуйте позже.")
```

**Rules:**
- ALWAYS wrap `edit_text` / `edit_message_text` calls in `try/except TelegramBadRequest`
- Only suppress errors containing `"message is not modified"` — re-raise everything else
- The outer `try/except Exception` handles DB/service errors and notifies the user
- This pattern is REQUIRED for every callback handler that edits messages

#### 4. Main Menu (InlineKeyboardMarkup ONLY)
**STRICT RULE: Use ONLY InlineKeyboardMarkup for ALL keyboards, including main menu.**
**NEVER use ReplyKeyboardMarkup or KeyboardButton — they are FORBIDDEN.**

```python
from aiogram.utils.keyboard import InlineKeyboardBuilder

def get_main_menu() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="📋 Мои записи", callback_data="my_bookings")
    builder.button(text="➕ Записаться", callback_data="start_booking")
    builder.button(text="ℹ️ Помощь", callback_data="help")
    builder.adjust(1)
    return builder.as_markup()
```

**Requirements:**
- Use `InlineKeyboardMarkup` via `InlineKeyboardBuilder`
- After /start send welcome message with inline main menu
- All menu actions go through callback_data
- Emoji in button text

#### 4b. Callback Data — UNIQUE PREFIXES (CRITICAL)
**Every callback_data prefix MUST be unique and non-overlapping.**

```
❌ BAD — collision:
  confirm_{service_id}_{date}_{time}   ← "confirm_cancel_1" also matches!
  confirm_cancel_{booking_id}

✅ GOOD — unique prefixes:
  book_confirm_{service_id}_{date}_{time}
  cancel_confirm_{booking_id}
```

**Rules:**
- Use descriptive multi-word prefixes: `book_confirm_`, `cancel_confirm_`, `select_service_`, `select_date_`
- NEVER use single-word prefixes like `confirm_` or `cancel_` that can overlap
- When parsing callback_data, validate the exact format and handle unexpected values gracefully
- Every `F.data.startswith("prefix_")` filter MUST be unique across ALL handlers

#### 5. Back Navigation
**Every inline keyboard screen (except main menu) MUST have a back button:**

```python
builder = InlineKeyboardBuilder()
builder.button(text="Option 1", callback_data="opt1")
builder.button(text="Option 2", callback_data="opt2")
builder.button(text="◀️ Назад", callback_data="back_to_menu")
builder.adjust(2, 1)  # 2 buttons per row, then back button alone
```

**Requirements:**
- Button text: `"◀️ Назад"` (arrow + "Back" in Russian)
- Place at the bottom of inline keyboards
- Handle `back_to_menu` callback and return to previous screen

#### 6. Empty States
**CRITICAL: Empty state MUST ALWAYS include inline keyboard! Otherwise user gets stuck.**

✅ Good:
```python
if not items:
    builder = InlineKeyboardBuilder()
    builder.button(text="➕ Записаться", callback_data="start_booking")
    builder.button(text="◀️ Главное меню", callback_data="back_to_menu")
    builder.adjust(1)
    await callback.message.edit_text(
        "📋 <b>У вас пока нет записей</b>\n"
        "\n"
        "Нажмите кнопку ниже, чтобы записаться!",
        reply_markup=builder.as_markup(),
    )
    return
```

❌ Bad — user gets STUCK with no buttons:
```python
if not items:
    await message.answer("📋 У вас пока нет записей")  # NO KEYBOARD = DEAD END!
    return
```

**Requirements:**
- Contextual emoji (📋 for records, 🛒 for cart, etc.)
- Explain what's missing
- **ALWAYS add reply_markup with action button + "Back to menu" button**
- User must NEVER reach a dead-end without navigation buttons

#### 7. Confirmation for Destructive Actions
**Always confirm before deleting/canceling:**

```python
builder = InlineKeyboardBuilder()
builder.button(text="✅ Да, отменить", callback_data=f"cancel_booking_{booking_id}")
builder.button(text="◀️ Назад", callback_data="my_bookings")
builder.adjust(1)

await callback.message.edit_text(
    "⚠️ <b>Подтверждение</b>\n"
    "\n"
    "Вы уверены, что хотите отменить запись?\n"
    f"<i>{booking.service_name} — {booking.time}</i>",
    reply_markup=builder.as_markup(),
)
```

**Requirements:**
- Show confirmation screen before destructive actions (cancel booking, delete item, etc.)
- Provide "Yes, confirm" and "Back" buttons
- Display relevant details (what will be deleted/canceled)

#### 8. Dockerfile CMD with Seed Data
**Update Dockerfile CMD to run seed script after migrations:**

```dockerfile
CMD ["sh", "-c", "python3 infrastructure/services/schema_validator.py 2>&1 || true && python3 infrastructure/services/seed_data.py 2>&1 || true && python -m apps.bot.main"]
```

**Execution order:**
1. `schema_validator.py` — validate/create database schema
2. `seed_data.py` — insert initial data (if not exists)
3. `python -m apps.bot.main` — start the bot

**Important:** Use `2>&1 || true` to prevent script failures from stopping the container.

---

## ЧЕКЛИСТ САМОПРОВЕРКИ (проверь ПЕРЕД выводом кода):

1. □ Каждая inline-кнопка имеет соответствующий callback handler
2. □ **ТОЛЬКО InlineKeyboardMarkup** — ReplyKeyboardMarkup ЗАПРЕЩЁН
3. □ Все модели импортированы в `infrastructure/database/models/__init__.py`
4. □ Все репозитории зарегистрированы в `infrastructure/database/uow.py`
5. □ Все роутеры включены в `apps/bot/main.py` → `register_routers()`
6. □ Все сервисы зарегистрированы в `apps/bot/di_container.py`
7. □ Каждый handler имеет `try/except` с логированием
8. □ Все внешние пакеты есть в `pyproject.toml`
9. □ `FromDishka[ServiceType]` используется для инъекций в хендлерах
10. □ Каждая директория с .py файлами имеет `__init__.py`
11. □ **Сервисы зависят ТОЛЬКО от UnitOfWork** — никогда от Bot/Dispatcher напрямую
12. □ **Seed data script создан** (`infrastructure/services/seed_data.py`)
13. □ **Все сообщения содержат эмодзи** и HTML-форматирование
14. □ **Все handlers имеют try/except** с `logger.error(exc_info=True)`
14b. □ **Все callback handlers с edit_text ловят TelegramBadRequest "message is not modified"**
15. □ **Callback_data префиксы уникальны** — нет коллизий (book_confirm_ vs cancel_confirm_)
16. □ **Inline keyboards имеют кнопку "◀️ Назад"**
17. □ **Empty states имеют reply_markup с кнопками** — НИКОГДА не оставляй пользователя без клавиатуры
18. □ **Деструктивные действия требуют подтверждения**
19. □ **Dockerfile CMD запускает seed_data.py** перед ботом
20. □ **user_service.get_or_create(from_user)** — передаём TelegramUser объект, НЕ .id
21. □ **Другие сервисы получают user.id (int)** — НИКОГДА не вызывают get_by_telegram_id()
"""
