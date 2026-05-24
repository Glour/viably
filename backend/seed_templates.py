#!/usr/bin/env python3
"""Seed production-ready templates to database."""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from infrastructure.database.models.templates import Template

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/viably"

TEMPLATES = [
    {
        "name": "Shop Bot",
        "slug": "shop-bot",
        "description": "Готовый Telegram-бот для интернет-магазина с корзиной и оформлением заказов",
        "category": "telegram_bot",
        "credit_cost": 0,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_token": {
                    "type": "string",
                    "title": "Токен бота",
                    "description": "Токен от @BotFather"
                },
                "admin_id": {
                    "type": "string",
                    "title": "Admin ID",
                    "description": "Ваш Telegram ID для получения заказов"
                }
            }
        },
        "prompt_template": "Создай Telegram магазин с каталогом товаров, корзиной и оформлением заказов",
        "features": ["Каталог товаров", "Корзина покупок", "Оформление заказа", "Уведомления админу", "Inline-кнопки"],
        "tags": ["telegram", "shop", "ecommerce", "bot"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 1,
        "onboarding_prompt": "Настройте бота и добавьте свои товары в код. Подробная инструкция в README.md"
    },
    {
        "name": "FAQ Bot",
        "slug": "faq-bot",
        "description": "Бот для автоматизации поддержки клиентов с базой знаний и переадресацией операторам",
        "category": "telegram_bot",
        "credit_cost": 0,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_token": {
                    "type": "string",
                    "title": "Токен бота",
                    "description": "Токен от @BotFather"
                },
                "support_chat_id": {
                    "type": "string",
                    "title": "Support Chat ID",
                    "description": "ID чата для вопросов операторам"
                }
            },
        },
        "prompt_template": "Создай Telegram бот поддержки с FAQ и возможностью связи с оператором",
        "features": ["База знаний FAQ", "Переадресация операторам", "Категории вопросов", "Inline-навигация"],
        "tags": ["telegram", "support", "faq", "bot"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 2,
        "onboarding_prompt": "Настройте бота и отредактируйте FAQ_DATA в коде с вашими вопросами и ответами"
    },
    {
        "name": "Landing Page",
        "slug": "landing-page",
        "description": "Современный одностраничный сайт на Next.js с Tailwind CSS",
        "category": "website",
        "credit_cost": 0,
        "config_schema": {"type": "object", "properties": {}},
        "prompt_template": "Создай одностраничный лендинг с Hero, Features, Pricing и Contact секциями",
        "features": ["Next.js 15", "Tailwind CSS", "Адаптивный дизайн", "SEO-оптимизация", "Готов к Vercel"],
        "tags": ["nextjs", "landing", "website", "tailwind"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 3,
        "onboarding_prompt": "Отредактируйте контент в app/page.tsx под ваш продукт"
    },
    {
        "name": "Blog",
        "slug": "blog",
        "description": "Современный блог на Next.js с поддержкой MDX. Пишите посты в Markdown",
        "category": "website",
        "credit_cost": 0,
        "config_schema": {"type": "object", "properties": {}},
        "prompt_template": "Создай блог с поддержкой MDX, тегами и красивым дизайном",
        "features": ["MDX поддержка", "Теги и категории", "Tailwind CSS", "Статическая генерация", "Адаптивный дизайн"],
        "tags": ["nextjs", "blog", "mdx", "markdown"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 4,
        "onboarding_prompt": "Создавайте посты в папке posts/ с frontmatter (title, date, tags, excerpt)"
    },
    {
        "name": "Portfolio",
        "slug": "portfolio",
        "description": "Современное личное портфолио на Next.js с темным дизайном",
        "category": "website",
        "credit_cost": 0,
        "config_schema": {"type": "object", "properties": {}},
        "prompt_template": "Создай портфолио с проектами, навыками и контактами",
        "features": ["Темный дизайн", "Секции проектов", "Навыки", "Контакты", "Адаптивный"],
        "tags": ["nextjs", "portfolio", "personal", "dark-theme"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 5,
        "onboarding_prompt": "Отредактируйте массивы projects и skills в app/page.tsx с вашими данными"
    }
]


async def seed_templates():
    """Add templates to database."""
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        for template_data in TEMPLATES:
            # Check if exists
            from sqlalchemy import select
            result = await session.execute(
                select(Template).where(Template.slug == template_data["slug"])
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"✓ Template '{template_data['name']}' already exists, skipping")
                continue
            
            # Create new
            template = Template(**template_data)
            session.add(template)
            print(f"✓ Added template '{template_data['name']}'")
        
        await session.commit()
        print("\n✅ All templates seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_templates())
