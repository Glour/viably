import type { ProjectFile } from "@/shared/types"
import type { GenerationStep, DeployStep } from "@/features/generation/types"

// --- Mock generated files for a Python Telegram bot (aiogram 3.x) ---

export const MOCK_GENERATED_FILES: ProjectFile[] = [
  {
    path: "main.py",
    name: "main.py",
    type: "file",
    content: `import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from config import BOT_TOKEN
from handlers import start, help, catalog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher()

    dp.include_router(start.router)
    dp.include_router(help.router)
    dp.include_router(catalog.router)

    logger.info("Bot started polling")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())`,
  },
  {
    path: "config.py",
    name: "config.py",
    type: "file",
    content: `import os
from typing import Final

BOT_TOKEN: Final[str] = os.getenv("BOT_TOKEN", "")
DATABASE_URL: Final[str] = os.getenv("DATABASE_URL", "")
ADMIN_ID: Final[int] = int(os.getenv("ADMIN_ID", "0"))

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN environment variable is required")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")`,
  },
  {
    path: "handlers",
    name: "handlers",
    type: "folder",
    children: [
      {
        path: "handlers/start.py",
        name: "start.py",
        type: "file",
        content: `from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from keyboards import main_menu_keyboard

router = Router()

@router.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        "👋 <b>Добро пожаловать!</b>\\n\\n"
        "Я помогу вам найти нужные товары и оформить заказ.\\n"
        "Выберите действие:",
        reply_markup=main_menu_keyboard()
    )`,
      },
      {
        path: "handlers/help.py",
        name: "help.py",
        type: "file",
        content: `from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

router = Router()

@router.message(Command("help"))
async def cmd_help(message: Message):
    help_text = """
📚 <b>Справка по боту</b>

<b>Команды:</b>
/start - Главное меню
/help - Эта справка
/catalog - Каталог товаров

<b>Возможности:</b>
🛍 Просмотр каталога товаров
🛒 Добавление товаров в корзину
💳 Оформление заказа
📦 Отслеживание статуса

По всем вопросам: @support
"""
    await message.answer(help_text)`,
      },
      {
        path: "handlers/catalog.py",
        name: "catalog.py",
        type: "file",
        content: `from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from keyboards import catalog_keyboard

router = Router()

@router.message(Command("catalog"))
async def cmd_catalog(message: Message):
    await message.answer(
        "🛍 <b>Каталог товаров</b>\\n\\n"
        "Выберите категорию:",
        reply_markup=catalog_keyboard()
    )

@router.callback_query(F.data.startswith("category_"))
async def process_category(callback: CallbackQuery):
    category_id = callback.data.split("_")[1]
    await callback.answer()
    await callback.message.edit_text(
        f"📦 Категория #{category_id}\\n\\n"
        "Здесь будут товары..."
    )`,
      },
    ],
  },
  {
    path: "models.py",
    name: "models.py",
    type: "file",
    content: `from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, nullable=False)
    username = Column(String(255))
    first_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    price = Column(Float, nullable=False)
    category = Column(String(100))
    in_stock = Column(Boolean, default=True)
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50), default="pending")
    total_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")`,
  },
  {
    path: "keyboards.py",
    name: "keyboards.py",
    type: "file",
    content: `from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def main_menu_keyboard() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="🛍 Каталог", callback_data="catalog")],
        [InlineKeyboardButton(text="🛒 Корзина", callback_data="cart")],
        [InlineKeyboardButton(text="📦 Мои заказы", callback_data="orders")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def catalog_keyboard() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="📱 Электроника", callback_data="category_1")],
        [InlineKeyboardButton(text="👕 Одежда", callback_data="category_2")],
        [InlineKeyboardButton(text="🏠 Для дома", callback_data="category_3")],
        [InlineKeyboardButton(text="⚽️ Спорт", callback_data="category_4")],
        [InlineKeyboardButton(text="🔙 Назад", callback_data="back_main")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def back_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Назад", callback_data="back")]
    ])`,
  },
  {
    path: "requirements.txt",
    name: "requirements.txt",
    type: "file",
    content: `aiogram==3.15.0
sqlalchemy==2.0.36
asyncpg==0.30.0
python-dotenv==1.0.1
pydantic==2.10.6
pydantic-settings==2.7.1`,
  },
  {
    path: "Dockerfile",
    name: "Dockerfile",
    type: "file",
    content: `FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]`,
  },
  {
    path: ".env.example",
    name: ".env.example",
    type: "file",
    content: `BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://user:password@localhost:5432/botdb
ADMIN_ID=123456789`,
  },
]

// --- Mock code snippets for typewriter animation during generation ---

export const MOCK_CODE_SNIPPETS = [
  {
    language: "python",
    code: `from aiogram import Bot, Dispatcher
from aiogram.filters import Command

@router.message(Command("start"))
async def cmd_start(message: Message):
    await message.answer("Welcome!")`,
  },
  {
    language: "python",
    code: `class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True)
    username = Column(String(255))`,
  },
  {
    language: "python",
    code: `def catalog_keyboard() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="📱 Electronics", callback_data="cat_1")],
        [InlineKeyboardButton(text="👕 Clothing", callback_data="cat_2")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)`,
  },
  {
    language: "python",
    code: `async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    dp.include_router(start.router)
    await dp.start_polling(bot)`,
  },
  {
    language: "python",
    code: `@router.callback_query(F.data.startswith("product_"))
async def show_product(callback: CallbackQuery):
    product_id = callback.data.split("_")[1]
    await callback.answer()
    await show_product_details(callback.message, product_id)`,
  },
  {
    language: "python",
    code: `BOT_TOKEN: Final[str] = os.getenv("BOT_TOKEN", "")
DATABASE_URL: Final[str] = os.getenv("DATABASE_URL", "")

if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN is required")`,
  },
]

// --- WebSocket Generation Flow Constants ---

/**
 * Generation steps for AI code generation flow
 * Based on data-model.md Section 5 (T008)
 */
export const GENERATION_STEPS: Pick<GenerationStep, 'name'>[] = [
  { name: 'Analyzing template' },
  { name: 'Generating architecture' },
  { name: 'Writing code' },
  { name: 'Code review' },
  { name: 'Testing' },
  { name: 'Finalizing' },
]

/**
 * Deployment steps for bot deployment flow
 * Based on data-model.md Section 5 (T009)
 */
export const DEPLOY_STEPS: Omit<DeployStep, 'status'>[] = [
  { name: 'Валидация проекта' },
  { name: 'Подготовка файлов' },
  { name: 'Сборка Docker-образа' },
  { name: 'Запуск контейнера' },
  { name: 'Проверка работоспособности' },
  { name: 'Финализация' },
]

/**
 * WebSocket reconnection configuration
 * Based on data-model.md Section 5 (T010)
 */
export const MAX_RECONNECT_ATTEMPTS = 5
export const INITIAL_RECONNECT_INTERVAL = 3000 // 3s
export const MAX_RECONNECT_INTERVAL = 48000 // 48s
