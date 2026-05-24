"""seed_initial_templates

Revision ID: f0bc0f102528
Revises: g7h8i9j0k1l2
Create Date: 2026-02-09 00:29:21.801393

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0bc0f102528'
down_revision: Union[str, Sequence[str], None] = 'g7h8i9j0k1l2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed initial templates."""
    templates_table = sa.table(
        'templates',
        sa.column('id', sa.UUID),
        sa.column('name', sa.String),
        sa.column('slug', sa.String),
        sa.column('description', sa.Text),
        sa.column('category', sa.String),
        sa.column('credit_cost', sa.Integer),
        sa.column('config_schema', sa.JSON),
        sa.column('code_template', sa.JSON),
        sa.column('prompt_template', sa.Text),
        sa.column('preview_image_url', sa.Text),
        sa.column('features', sa.ARRAY(sa.Text)),
        sa.column('tags', sa.ARRAY(sa.Text)),
        sa.column('usage_count', sa.Integer),
        sa.column('is_active', sa.Boolean),
        sa.column('sort_order', sa.Integer),
    )

    # Shop Bot Template
    shop_bot_id = str(uuid.uuid4())
    shop_bot_config_schema = {
        "type": "object",
        "properties": {
            "botName": {
                "type": "string",
                "title": "Название бота",
                "description": "Название вашего магазина"
            },
            "description": {
                "type": "string",
                "title": "Описание",
                "description": "Краткое описание магазина"
            },
            "currency": {
                "type": "string",
                "title": "Валюта",
                "enum": ["RUB", "USD", "EUR"],
                "default": "RUB"
            },
            "welcomeMessage": {
                "type": "string",
                "title": "Приветственное сообщение",
                "default": "Добро пожаловать в наш магазин!"
            }
        },
        "required": ["botName", "description"]
    }

    shop_bot_prompt_template = """Создай Telegram-бота для интернет-магазина со следующими характеристиками:

Название: {botName}
Описание: {description}
Валюта: {currency}
Приветствие: {welcomeMessage}

Требования:
1. Каталог товаров с категориями
2. Корзина покупок
3. Оформление заказов
4. Уведомления администратору о новых заказах
5. История заказов пользователя
6. Поиск по товарам

Используй python-telegram-bot библиотеку и SQLite для хранения данных."""

    # FAQ Bot Template
    faq_bot_id = str(uuid.uuid4())
    faq_bot_config_schema = {
        "type": "object",
        "properties": {
            "botName": {
                "type": "string",
                "title": "Название бота",
                "description": "Название вашего FAQ-бота"
            },
            "description": {
                "type": "string",
                "title": "Описание",
                "description": "О чем бот отвечает"
            },
            "defaultResponse": {
                "type": "string",
                "title": "Ответ по умолчанию",
                "default": "К сожалению, я не знаю ответа на этот вопрос."
            }
        },
        "required": ["botName", "description"]
    }

    faq_bot_prompt_template = """Создай Telegram FAQ-бота со следующими характеристиками:

Название: {botName}
Описание: {description}
Ответ по умолчанию: {defaultResponse}

Требования:
1. База знаний с вопросами и ответами
2. Поиск по ключевым словам
3. Категории вопросов
4. Команда /help со списком доступных команд
5. Inline-кнопки для навигации
6. Статистика популярных вопросов

Используй python-telegram-bot библиотеку."""

    templates_data = [
        {
            'id': shop_bot_id,
            'name': 'Shop Bot',
            'slug': 'shop-bot',
            'description': 'Telegram-бот для интернет-магазина с каталогом товаров, корзиной и оформлением заказов',
            'category': 'telegram_bot',
            'credit_cost': 3,
            'config_schema': shop_bot_config_schema,  # Pass dict directly, not JSON string
            'code_template': None,
            'prompt_template': shop_bot_prompt_template,
            'preview_image_url': None,
            'features': [
                'Каталог товаров',
                'Корзина',
                'Оформление заказов',
                'Уведомления',
                'История заказов',
                'Поиск по товарам'
            ],
            'tags': ['ecommerce', 'shop', 'популярный'],
            'usage_count': 0,
            'is_active': True,
            'sort_order': 1,
        },
        {
            'id': faq_bot_id,
            'name': 'FAQ Bot',
            'slug': 'faq-bot',
            'description': 'Бот для автоматических ответов на часто задаваемые вопросы',
            'category': 'telegram_bot',
            'credit_cost': 2,
            'config_schema': faq_bot_config_schema,  # Pass dict directly, not JSON string
            'code_template': None,
            'prompt_template': faq_bot_prompt_template,
            'preview_image_url': None,
            'features': [
                'База знаний',
                'Поиск по вопросам',
                'Быстрые ответы',
                'Категории вопросов',
                'Статистика'
            ],
            'tags': ['support', 'faq', 'быстрый старт'],
            'usage_count': 0,
            'is_active': True,
            'sort_order': 2,
        },
    ]

    op.bulk_insert(templates_table, templates_data)


def downgrade() -> None:
    """Remove seeded templates."""
    op.execute("DELETE FROM templates WHERE slug IN ('shop-bot', 'faq-bot')")
