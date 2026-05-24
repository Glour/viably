"""Remove required fields from bot template config_schema.

bot_token and admin_id are runtime deploy params, not generation params.
Requiring them at project creation blocks users from creating bot projects.

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "p6q7r8s9t0u1"
down_revision: Union[str, Sequence[str], None] = "o5p6q7r8s9t0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Bot template slugs and their new config_schema (no required fields)
BOT_SCHEMAS = {
    "shop-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для получения заказов"}}}',
    "faq-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"support_chat_id":{"type":"string","title":"Support Chat ID","description":"ID чата для вопросов операторам"}}}',
    "notification-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для управления рассылками"}}}',
    "booking-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для получения заявок"}}}',
}

# Original schemas with required fields (for downgrade)
BOT_SCHEMAS_ORIGINAL = {
    "shop-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для получения заказов"}},"required":["bot_token","admin_id"]}',
    "faq-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"support_chat_id":{"type":"string","title":"Support Chat ID","description":"ID чата для вопросов операторам"}},"required":["bot_token"]}',
    "notification-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для управления рассылками"}},"required":["bot_token","admin_id"]}',
    "booking-bot": '{"type":"object","properties":{"bot_token":{"type":"string","title":"Токен бота","description":"Токен от @BotFather"},"admin_id":{"type":"string","title":"Admin ID","description":"Ваш Telegram ID для получения заявок"}},"required":["bot_token","admin_id"]}',
}


def upgrade() -> None:
    conn = op.get_bind()
    for slug, schema in BOT_SCHEMAS.items():
        conn.execute(
            text("UPDATE templates SET config_schema = CAST(:schema AS jsonb) WHERE slug = :slug"),
            {"slug": slug, "schema": schema},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for slug, schema in BOT_SCHEMAS_ORIGINAL.items():
        conn.execute(
            text("UPDATE templates SET config_schema = CAST(:schema AS jsonb) WHERE slug = :slug"),
            {"slug": slug, "schema": schema},
        )
