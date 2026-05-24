"""Fix bot prompt_template and onboarding_prompt to match v2-light architecture.

Remove references to requirements.txt and SQLite, align with Poetry + PostgreSQL.

Revision ID: r8s9t0u1v2w3
Revises: q7r8s9t0u1v2
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "r8s9t0u1v2w3"
down_revision: Union[str, Sequence[str], None] = "q7r8s9t0u1v2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# New prompt_templates aligned with v2-light boilerplate architecture
UPDATES = [
    {
        "slug": "shop-bot",
        "prompt_template": (
            "Создай полноценный Telegram магазин-бот с: "
            "каталогом товаров (модель Product с name, description, price, image_url, is_active), "
            "корзиной покупок (модель CartItem), "
            "оформлением заказов (модель Order с статусами), "
            "уведомлениями админу о новых заказах, "
            "inline-кнопками навигации по каталогу. "
            "Используй v2-light архитектуру: модели в infrastructure/database/models/, "
            "репозитории в repositories/, сервисы в apps/bot/services/, "
            "хендлеры в apps/bot/handlers/user/. "
            "Зарегистрируй все компоненты по чеклисту (models/__init__.py, uow.py, di_container.py, main.py). "
            "Включи pyproject.toml с зависимостями (Poetry)."
        ),
        "onboarding_prompt": (
            "Привет! Я помогу создать бот-магазин для Telegram.\n\n"
            "Расскажите о вашем магазине: какие товары продаёте, "
            "нужна ли система оплаты, какие категории товаров?"
        ),
    },
    {
        "slug": "faq-bot",
        "prompt_template": (
            "Создай Telegram бот поддержки с: "
            "базой знаний FAQ (модели Category и FAQItem с вопросом и ответом), "
            "inline-навигацией по категориям, "
            "поиском по вопросам, "
            "возможностью связи с оператором (пересылка сообщения в чат поддержки). "
            "Используй v2-light архитектуру: модели, репозитории, сервисы, хендлеры. "
            "Зарегистрируй все компоненты по чеклисту. "
            "Включи pyproject.toml с зависимостями (Poetry)."
        ),
        "onboarding_prompt": (
            "Привет! Я помогу создать бот поддержки для Telegram.\n\n"
            "Расскажите: какие вопросы чаще всего задают ваши клиенты? "
            "Нужна ли переадресация на оператора?"
        ),
    },
    {
        "slug": "notification-bot",
        "prompt_template": (
            "Создай Telegram бот для рассылок с: "
            "системой подписки/отписки пользователей (модель Subscriber), "
            "панелью администратора (команды /admin, /broadcast, /stats), "
            "отправкой сообщений всем подписчикам, "
            "статистикой подписчиков (общее число, новые за период). "
            "Используй v2-light архитектуру с PostgreSQL: модели, репозитории, сервисы, хендлеры. "
            "Зарегистрируй все компоненты по чеклисту. "
            "Включи pyproject.toml с зависимостями (Poetry)."
        ),
        "onboarding_prompt": (
            "Привет! Я помогу создать бот для рассылок в Telegram.\n\n"
            "Расскажите: какие уведомления планируете отправлять? "
            "Нужна ли сегментация подписчиков?"
        ),
    },
    {
        "slug": "booking-bot",
        "prompt_template": (
            "Создай Telegram бот для записи клиентов с: "
            "выбором услуги из меню (модель Service с name, duration, price), "
            "выбором даты (ближайшие 7 дней, inline-календарь), "
            "выбором времени (слоты с 9:00 до 20:00 каждые 30 минут), "
            "подтверждением записи (модель Booking с user_id, service_id, date, time, status), "
            "уведомлением администратору о новой записи, "
            "просмотром и отменой записи клиентом (/my_bookings). "
            "Используй v2-light архитектуру с PostgreSQL: модели, репозитории, сервисы, хендлеры. "
            "Зарегистрируй все компоненты по чеклисту. "
            "Включи pyproject.toml с зависимостями (Poetry)."
        ),
        "onboarding_prompt": (
            "Привет! Я помогу создать бот для онлайн-записи в Telegram.\n\n"
            "Расскажите: какие услуги предоставляете, "
            "какой график работы, нужна ли запись к конкретным мастерам?"
        ),
    },
]


def upgrade() -> None:
    conn = op.get_bind()
    for upd in UPDATES:
        conn.execute(
            text("""
                UPDATE templates
                SET prompt_template = :prompt_template,
                    onboarding_prompt = :onboarding_prompt,
                    updated_at = NOW()
                WHERE slug = :slug
            """),
            upd,
        )


def downgrade() -> None:
    # Revert to old prompts from n4o5p6q7r8s9 migration
    conn = op.get_bind()
    old_prompts = {
        "shop-bot": "Создай полноценный Telegram магазин-бот на Python (aiogram 3.x) с: каталогом товаров, корзиной покупок, оформлением заказов, уведомлениями админу, inline-кнопками навигации. Используй структуру с роутерами. Включи requirements.txt с зависимостями.",
        "faq-bot": "Создай Telegram бот поддержки на Python (aiogram 3.x) с: базой знаний FAQ (категории и вопросы), возможностью связи с оператором, inline-навигацией по категориям, поиском по вопросам. Включи requirements.txt.",
        "notification-bot": "Создай Telegram бот для рассылок на Python (aiogram 3.x) с: системой подписки/отписки пользователей, панелью администратора (список подписчиков, отправка сообщений всем), статистикой подписчиков. Используй SQLite для хранения данных. Включи requirements.txt.",
        "booking-bot": "Создай Telegram бот для записи клиентов на Python (aiogram 3.x) с: выбором услуги из меню, выбором даты (ближайшие 7 дней), выбором времени (слоты с 9:00 до 20:00 каждые 30 минут), подтверждением записи, уведомлением администратору, просмотром и отменой записи клиентом. Используй SQLite. Включи requirements.txt.",
    }
    for slug, prompt in old_prompts.items():
        conn.execute(
            text("UPDATE templates SET prompt_template = :prompt WHERE slug = :slug"),
            {"slug": slug, "prompt": prompt},
        )
