"""Seed full templates: website templates + improve bot templates.

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-02-20
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision: str = 'n4o5p6q7r8s9'
down_revision: Union[str, Sequence[str], None] = 'm3n4o5p6q7r8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TEMPLATES = [
    {
        "slug": "shop-bot",
        "name": "Shop Bot",
        "description": "Готовый Telegram-бот для интернет-магазина с корзиной и оформлением заказов",
        "category": "telegram_bot",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для получения заказов"}}}',
        "prompt_template": "Создай полноценный Telegram магазин-бот на Python (aiogram 3.x) с: каталогом товаров, корзиной покупок, оформлением заказов, уведомлениями админу, inline-кнопками навигации. Используй структуру с роутерами. Включи requirements.txt с зависимостями.",
        "features": ["Каталог товаров", "Корзина покупок", "Оформление заказа", "Уведомления админу", "Inline-кнопки"],
        "tags": ["telegram", "shop", "ecommerce", "bot"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 1,
        "onboarding_prompt": "Бот готов к запуску! Установите зависимости: pip install -r requirements.txt\nЗатем запустите: python main.py\nРедактируйте товары в массиве PRODUCTS в файле main.py",
    },
    {
        "slug": "faq-bot",
        "name": "FAQ Bot",
        "description": "Бот для автоматизации поддержки клиентов с базой знаний и переадресацией операторам",
        "category": "telegram_bot",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"support_chat_id":{"type":"string","title":"Support Chat ID","description":"ID чата для вопросов операторам"}}}',
        "prompt_template": "Создай Telegram бот поддержки на Python (aiogram 3.x) с: базой знаний FAQ (категории и вопросы), возможностью связи с оператором, inline-навигацией по категориям, поиском по вопросам. Включи requirements.txt.",
        "features": ["База знаний FAQ", "Переадресация операторам", "Категории вопросов", "Inline-навигация"],
        "tags": ["telegram", "support", "faq", "bot"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 2,
        "onboarding_prompt": "Бот готов к запуску! Установите зависимости: pip install -r requirements.txt\nЗапустите: python main.py\nОтредактируйте массив FAQ_DATA в файле main.py под ваши вопросы и ответы",
    },
    {
        "slug": "landing-page",
        "name": "Landing Page",
        "description": "Современный лендинг с красивым дизайном — Hero, Features, Pricing, Contacts",
        "category": "website",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": "Создай красивый современный лендинг (одностраничный сайт) в виде одного HTML-файла с встроенным CSS и JavaScript. Дизайн в стиле современных SaaS-сервисов: тёмный градиентный фон в hero-секции, акцентный цвет indigo/violet, шрифт Inter. Структура: Header с навигацией, Hero с CTA, Features (3-4 карточки), Pricing (3 тарифа), CTA-секция, Footer. Весь контент на русском, реальный (без плейсхолдеров). Адаптивный дизайн. Все стили внутри тега <style>.",
        "features": ["Современный дизайн", "Адаптивная вёрстка", "Анимации при наведении", "Секция тарифов", "Готов к деплою"],
        "tags": ["landing", "website", "html", "css"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 3,
        "onboarding_prompt": "Сайт готов! Редактируйте текст и цвета прямо в index.html.\nДля деплоя введите желаемый субдомен (например: mysite → mysite.viably.dev)",
    },
    {
        "slug": "portfolio",
        "name": "Портфолио",
        "description": "Личное портфолио разработчика или дизайнера с проектами, навыками и контактами",
        "category": "website",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": "Создай современное личное портфолио в виде одного HTML-файла со встроенным CSS и JS. Тёмная тема с акцентами. Секции: About me, Skills (с иконками), Projects (сетка карточек с описанием и ссылками), Contact (форма). Плавная прокрутка, анимации появления элементов при скролле. Весь контент на русском, реалистичный. Все стили внутри <style>.",
        "features": ["Тёмная тема", "Анимации при скролле", "Секция проектов", "Контактная форма", "Адаптивный"],
        "tags": ["portfolio", "website", "html", "personal"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 4,
        "onboarding_prompt": "Портфолио готово! Замените данные об авторе, проектах и навыках в index.html.\nДля деплоя введите субдомен (например: ivanov → ivanov.viably.dev)",
    },
    {
        "slug": "business-site",
        "name": "Корпоративный сайт",
        "description": "Профессиональный сайт для компании или агентства с услугами и командой",
        "category": "website",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": "Создай профессиональный корпоративный сайт в виде одного HTML-файла со встроенными CSS и JS. Светлая тема с тёмными акцентами, корпоративный стиль. Секции: Header с навигацией, Hero с описанием компании, Services (4-6 карточек услуг), About (история, цифры, команда), Testimonials (отзывы клиентов), Contact (форма + карта-заглушка). Весь контент на русском, реалистичный для IT-компании. Все стили внутри <style>.",
        "features": ["Корпоративный дизайн", "Секция услуг", "Отзывы клиентов", "Команда", "Контактная форма"],
        "tags": ["business", "corporate", "website", "html"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 5,
        "onboarding_prompt": "Сайт готов! Замените контент (название компании, описание услуг) в index.html.\nДля деплоя введите субдомен (например: mycompany → mycompany.viably.dev)",
    },
    {
        "slug": "online-store",
        "name": "Интернет-магазин",
        "description": "Одностраничный интернет-магазин с каталогом, корзиной и оформлением заказа",
        "category": "website",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": "Создай красивый одностраничный интернет-магазин в виде одного HTML-файла со встроенными CSS и JavaScript. Карточки товаров в сетке (3-4 колонки), возможность добавления в корзину (localStorage), счётчик в корзине, модальное окно корзины с итоговой суммой. Тёмный современный дизайн. Минимум 8 реалистичных товаров с ценами в рублях. Все стили внутри <style>.",
        "features": ["Каталог товаров", "Корзина на JS", "Счётчик товаров", "Фильтры категорий", "Адаптивный"],
        "tags": ["shop", "ecommerce", "website", "html", "javascript"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 6,
        "onboarding_prompt": "Магазин готов! Замените товары в массиве products в JavaScript-секции index.html.\nДля деплоя введите субдомен (например: myshop → myshop.viably.dev)",
    },
    {
        "slug": "notification-bot",
        "name": "Бот-уведомлятор",
        "description": "Telegram-бот для отправки уведомлений и рассылок подписчикам",
        "category": "telegram_bot",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для управления рассылками"}}}',
        "prompt_template": "Создай Telegram бот для рассылок на Python (aiogram 3.x) с: системой подписки/отписки пользователей, панелью администратора (список подписчиков, отправка сообщений всем), статистикой подписчиков. Используй SQLite для хранения данных. Включи requirements.txt.",
        "features": ["Рассылки подписчикам", "Панель администратора", "Статистика", "Кнопка отписки", "SQLite БД"],
        "tags": ["telegram", "notifications", "broadcast", "bot"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 7,
        "onboarding_prompt": "Бот готов! Установите зависимости: pip install -r requirements.txt\nЗапустите: python main.py\nОтправьте /start боту, затем /admin для управления рассылками",
    },
    {
        "slug": "booking-bot",
        "name": "Бот записи",
        "description": "Telegram-бот для онлайн-записи клиентов (услуги, мастера, временные слоты)",
        "category": "telegram_bot",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для получения заявок"}}}',
        "prompt_template": "Создай Telegram бот для записи клиентов на Python (aiogram 3.x) с: выбором услуги из меню, выбором даты (ближайшие 7 дней), выбором времени (слоты с 9:00 до 20:00 каждые 30 минут), подтверждением записи, уведомлением администратору, просмотром и отменой записи клиентом. Используй SQLite. Включи requirements.txt.",
        "features": ["Выбор услуги", "Выбор даты и времени", "Подтверждение записи", "Отмена записи", "Уведомления"],
        "tags": ["telegram", "booking", "appointments", "bot"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 8,
        "onboarding_prompt": "Бот готов! Установите зависимости: pip install -r requirements.txt\nЗапустите: python main.py\nОтредактируйте список услуг в массиве SERVICES в файле main.py",
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    for tpl in TEMPLATES:
        # Idempotent: skip if slug already exists
        exists = conn.execute(
            text("SELECT 1 FROM templates WHERE slug = :slug"),
            {"slug": tpl["slug"]},
        ).fetchone()

        if exists:
            # Update key fields if template already exists
            conn.execute(
                text("""
                    UPDATE templates
                    SET onboarding_prompt = :onboarding_prompt,
                        prompt_template   = :prompt_template,
                        is_active         = :is_active,
                        sort_order        = :sort_order
                    WHERE slug = :slug
                """),
                {
                    "slug": tpl["slug"],
                    "onboarding_prompt": tpl["onboarding_prompt"],
                    "prompt_template": tpl["prompt_template"],
                    "is_active": tpl["is_active"],
                    "sort_order": tpl["sort_order"],
                },
            )
            continue

        # features and tags are text[] in PostgreSQL
        import json
        conn.execute(
            text("""
                INSERT INTO templates (
                    id, name, slug, description, category, credit_cost,
                    config_schema, prompt_template, features, tags,
                    usage_count, is_active, sort_order, onboarding_prompt,
                    created_at, updated_at
                ) VALUES (
                    :id, :name, :slug, :description, :category, :credit_cost,
                    CAST(:config_schema AS jsonb), :prompt_template,
                    :features, :tags,
                    :usage_count, :is_active, :sort_order, :onboarding_prompt,
                    NOW(), NOW()
                )
            """),
            {
                "id": str(uuid.uuid4()),
                "name": tpl["name"],
                "slug": tpl["slug"],
                "description": tpl["description"],
                "category": tpl["category"],
                "credit_cost": tpl["credit_cost"],
                "config_schema": tpl["config_schema"],
                "prompt_template": tpl["prompt_template"],
                "features": tpl["features"],  # list → text[]
                "tags": tpl["tags"],            # list → text[]
                "usage_count": tpl["usage_count"],
                "is_active": tpl["is_active"],
                "sort_order": tpl["sort_order"],
                "onboarding_prompt": tpl["onboarding_prompt"],
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    slugs = [t["slug"] for t in TEMPLATES]
    # Only remove templates added by this migration (not original 2)
    new_slugs = [s for s in slugs if s not in ("shop-bot", "faq-bot")]
    for slug in new_slugs:
        conn.execute(text("DELETE FROM templates WHERE slug = :slug"), {"slug": slug})
