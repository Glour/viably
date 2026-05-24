"""Fix onboarding prompts — replace technical instructions with welcome messages.

Revision ID: q7r8s9t0u1v2
Revises: p6q7r8s9t0u1
Create Date: 2026-02-21
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text

revision: str = "q7r8s9t0u1v2"
down_revision: Union[str, Sequence[str], None] = "p6q7r8s9t0u1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# New onboarding prompts: user-friendly welcome messages instead of technical instructions
ONBOARDING_UPDATES = {
    "shop-bot": (
        "Шаблон магазин-бота загружен! "
        "Давайте настроим его под ваш бизнес. "
        "Расскажите, что вы продаёте — я адаптирую каталог, категории и тексты под ваши товары."
    ),
    "faq-bot": (
        "Шаблон FAQ-бота загружен! "
        "Давайте наполним его вашей информацией. "
        "Расскажите о вашем бизнесе — я создам базу знаний с категориями и ответами на частые вопросы."
    ),
    "notification-bot": (
        "Шаблон бота-уведомлятора загружен! "
        "Давайте настроим его под ваши задачи. "
        "Расскажите, какие уведомления вы хотите рассылать — я адаптирую тексты и функционал."
    ),
    "booking-bot": (
        "Шаблон бота записи загружен! "
        "Давайте настроим его под ваши услуги. "
        "Расскажите, чем вы занимаетесь — я адаптирую список услуг, расписание и тексты."
    ),
    "landing-page": (
        "Шаблон лендинга загружен! "
        "Давайте персонализируем его под ваш бизнес. "
        "Расскажите, чем вы занимаетесь — я создам уникальный контент, тексты и подберу структуру."
    ),
    "portfolio": (
        "Шаблон портфолио загружен! "
        "Давайте сделаем его вашим. "
        "Расскажите о себе, ваших навыках и проектах — я создам персональную страницу."
    ),
    "business-site": (
        "Шаблон корпоративного сайта загружен! "
        "Давайте адаптируем его под вашу компанию. "
        "Расскажите о вашем бизнесе — я создам контент для всех секций."
    ),
    "online-store": (
        "Шаблон интернет-магазина загружен! "
        "Давайте наполним его вашими товарами. "
        "Расскажите, что вы продаёте — я создам каталог с категориями и ценами."
    ),
}

# Old prompts for downgrade
OLD_ONBOARDING = {
    "shop-bot": "Бот готов к запуску! Установите зависимости: pip install -r requirements.txt\nЗатем запустите: python main.py\nРедактируйте товары в массиве PRODUCTS в файле main.py",
    "faq-bot": "Бот готов! Установите зависимости: pip install -r requirements.txt\nЗапустите: python main.py\nОтредактируйте массив FAQ_DATA в файле main.py под ваши вопросы и ответы",
    "notification-bot": "Бот готов! Установите зависимости: pip install -r requirements.txt\nЗапустите: python main.py\nОтправьте /start боту, затем /admin для управления рассылками",
    "booking-bot": "Бот готов! Установите зависимости: pip install -r requirements.txt\nЗапустите: python main.py\nОтредактируйте список услуг в массиве SERVICES в файле main.py",
    "landing-page": "Сайт готов! Редактируйте текст и цвета прямо в index.html.\nДля деплоя введите желаемый субдомен (например: mysite → mysite.viably.dev)",
    "portfolio": "Портфолио готово! Замените данные об авторе, проектах и навыках в index.html.\nДля деплоя введите субдомен (например: ivanov → ivanov.viably.dev)",
    "business-site": "Сайт готов! Замените контент (название компании, описание услуг) в index.html.\nДля деплоя введите субдомен (например: mycompany → mycompany.viably.dev)",
    "online-store": "Магазин готов! Замените товары в массиве products в JavaScript-секции index.html.\nДля деплоя введите субдомен (например: myshop → myshop.viably.dev)",
}


def upgrade() -> None:
    conn = op.get_bind()
    for slug, new_prompt in ONBOARDING_UPDATES.items():
        conn.execute(
            text("UPDATE templates SET onboarding_prompt = :prompt WHERE slug = :slug"),
            {"slug": slug, "prompt": new_prompt},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for slug, old_prompt in OLD_ONBOARDING.items():
        conn.execute(
            text("UPDATE templates SET onboarding_prompt = :prompt WHERE slug = :slug"),
            {"slug": slug, "prompt": old_prompt},
        )
