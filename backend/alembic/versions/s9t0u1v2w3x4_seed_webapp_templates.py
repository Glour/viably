"""Seed webapp templates and migrate website templates to React.

Add 3 new webapp templates (dashboard, saas-landing, ecommerce).
Update existing website templates to category=webapp with React prompts.

Revision ID: s9t0u1v2w3x4
Revises: r8s9t0u1v2w3
Create Date: 2026-02-21
"""
from typing import Sequence, Union
import uuid

from alembic import op
from sqlalchemy import text

revision: str = "s9t0u1v2w3x4"
down_revision: Union[str, Sequence[str], None] = "r8s9t0u1v2w3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# New webapp templates
NEW_TEMPLATES = [
    {
        "slug": "dashboard",
        "name": "SaaS Dashboard",
        "description": "Панель управления с аналитикой, графиками и таблицами на React + shadcn/ui",
        "category": "webapp",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": (
            "Создай SaaS дашборд на React + Vite + shadcn/ui + Tailwind CSS. "
            "Боковая навигация (collapsible), верхний бар с поиском и профилем. "
            "Главная страница: 4 stat-карточки (выручка, пользователи, заказы, конверсия), "
            "2 графика (SVG-линейный и столбчатый), таблица последних заказов с пагинацией. "
            "Страницы: Dashboard, Пользователи (таблица с фильтрами), Настройки (форма профиля). "
            "Тёмная тема по умолчанию с переключателем. Все данные — моковые, реалистичные, на русском."
        ),
        "features": [
            "Sidebar навигация",
            "Stat-карточки",
            "SVG графики",
            "Таблица с пагинацией",
            "Тёмная тема",
        ],
        "tags": ["dashboard", "saas", "react", "analytics"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 10,
        "onboarding_prompt": (
            "Привет! Я создам для вас SaaS-дашборд на React.\n\n"
            "Расскажите: какие метрики важны, нужны ли графики, "
            "какие данные показывать в таблицах?"
        ),
    },
    {
        "slug": "saas-landing",
        "name": "Landing Page (React)",
        "description": "Современный лендинг для SaaS-продукта на React + shadcn/ui с анимациями",
        "category": "webapp",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": (
            "Создай современный лендинг для SaaS-продукта на React + Vite + shadcn/ui + Tailwind CSS. "
            "Структура: Header с навигацией и CTA, Hero секция с градиентом и анимацией, "
            "Features (3-4 карточки с иконками Lucide), Pricing (3 тарифа в Card), "
            "Testimonials (отзывы в карточках), FAQ (аккордеон), Footer. "
            "Плавный скролл, анимации при наведении. "
            "Весь контент на русском, реалистичный для IT-продукта."
        ),
        "features": [
            "Hero с градиентом",
            "Секция тарифов",
            "FAQ аккордеон",
            "Адаптивный дизайн",
            "Анимации",
        ],
        "tags": ["landing", "saas", "react", "website"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 11,
        "onboarding_prompt": (
            "Привет! Я создам лендинг для вашего продукта на React.\n\n"
            "Расскажите: что за продукт, какие ключевые преимущества, "
            "нужна ли секция тарифов?"
        ),
    },
    {
        "slug": "ecommerce",
        "name": "E-commerce App",
        "description": "Интернет-магазин на React с каталогом, корзиной и оформлением заказа",
        "category": "webapp",
        "credit_cost": 0,
        "config_schema": '{"type":"object","properties":{}}',
        "prompt_template": (
            "Создай интернет-магазин на React + Vite + shadcn/ui + Tailwind CSS. "
            "Страницы: Каталог (сетка карточек товаров с фильтрами по категории и ценой), "
            "Карточка товара (фото, описание, кнопка в корзину), "
            "Корзина (список товаров, изменение количества, итого), "
            "Оформление заказа (форма с валидацией Zod). "
            "Header с поиском, счётчиком корзины. "
            "Минимум 8 товаров с реалистичными данными, цены в рублях. "
            "Состояние корзины через React Context или Zustand."
        ),
        "features": [
            "Каталог с фильтрами",
            "Корзина покупок",
            "Оформление заказа",
            "Поиск товаров",
            "Адаптивный дизайн",
        ],
        "tags": ["ecommerce", "shop", "react", "webapp"],
        "usage_count": 0,
        "is_active": True,
        "sort_order": 12,
        "onboarding_prompt": (
            "Привет! Я создам интернет-магазин на React.\n\n"
            "Расскажите: какие товары продаёте, нужны ли фильтры по категориям, "
            "какие способы оплаты планируете?"
        ),
    },
]

# Update existing website templates to webapp category with React prompts
WEBSITE_TO_WEBAPP_UPDATES = [
    {
        "slug": "landing-page",
        "category": "webapp",
        "prompt_template": (
            "Создай красивый современный лендинг на React + Vite + shadcn/ui + Tailwind CSS. "
            "Дизайн в стиле современных SaaS-сервисов. "
            "Структура: Header с навигацией, Hero секция с градиентом и CTA, "
            "Features (3-4 карточки с иконками Lucide), Pricing (3 тарифа в Card), "
            "CTA-секция, Footer. Весь контент на русском, реалистичный. "
            "Адаптивный дизайн, тёмная тема."
        ),
        "onboarding_prompt": (
            "Привет! Я создам современный лендинг на React.\n\n"
            "Расскажите: для какого продукта или услуги нужен сайт? "
            "Какие секции важны?"
        ),
    },
    {
        "slug": "portfolio",
        "category": "webapp",
        "prompt_template": (
            "Создай современное личное портфолио на React + Vite + shadcn/ui + Tailwind CSS. "
            "Тёмная тема с акцентами. Секции: About me, Skills (карточки с иконками Lucide), "
            "Projects (сетка Card с описанием и ссылками), Contact (форма с валидацией Zod). "
            "Плавная прокрутка, анимации. Весь контент на русском, реалистичный."
        ),
        "onboarding_prompt": (
            "Привет! Я создам портфолио на React.\n\n"
            "Расскажите: какие проекты показать, какие навыки выделить?"
        ),
    },
    {
        "slug": "business-site",
        "category": "webapp",
        "prompt_template": (
            "Создай профессиональный корпоративный сайт на React + Vite + shadcn/ui + Tailwind CSS. "
            "Светлая тема с корпоративным стилем. "
            "Секции: Header с навигацией, Hero с описанием компании, "
            "Services (4-6 карточек услуг с иконками Lucide), About (история, цифры, команда), "
            "Testimonials (отзывы клиентов в Card), Contact (форма с валидацией Zod). "
            "Весь контент на русском, реалистичный для IT-компании."
        ),
        "onboarding_prompt": (
            "Привет! Я создам корпоративный сайт на React.\n\n"
            "Расскажите: что за компания, какие услуги предоставляете?"
        ),
    },
    {
        "slug": "online-store",
        "category": "webapp",
        "prompt_template": (
            "Создай интернет-магазин на React + Vite + shadcn/ui + Tailwind CSS. "
            "Каталог товаров в сетке Card, фильтры по категориям, "
            "корзина с состоянием через React Context, модальное окно корзины. "
            "Минимум 8 реалистичных товаров с ценами в рублях. "
            "Тёмный современный дизайн. Адаптивная вёрстка."
        ),
        "onboarding_prompt": (
            "Привет! Я создам интернет-магазин на React.\n\n"
            "Расскажите: какие товары продаёте, нужны ли категории?"
        ),
    },
]


def upgrade() -> None:
    conn = op.get_bind()

    # Insert new webapp templates
    for tpl in NEW_TEMPLATES:
        exists = conn.execute(
            text("SELECT 1 FROM templates WHERE slug = :slug"),
            {"slug": tpl["slug"]},
        ).fetchone()

        if exists:
            conn.execute(
                text("""
                    UPDATE templates
                    SET prompt_template = :prompt_template,
                        onboarding_prompt = :onboarding_prompt,
                        category = :category,
                        is_active = :is_active,
                        sort_order = :sort_order,
                        updated_at = NOW()
                    WHERE slug = :slug
                """),
                {
                    "slug": tpl["slug"],
                    "prompt_template": tpl["prompt_template"],
                    "onboarding_prompt": tpl["onboarding_prompt"],
                    "category": tpl["category"],
                    "is_active": tpl["is_active"],
                    "sort_order": tpl["sort_order"],
                },
            )
            continue

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
                    CAST(:features AS text[]), CAST(:tags AS text[]),
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
                "features": tpl["features"],
                "tags": tpl["tags"],
                "usage_count": tpl["usage_count"],
                "is_active": tpl["is_active"],
                "sort_order": tpl["sort_order"],
                "onboarding_prompt": tpl["onboarding_prompt"],
            },
        )

    # Update existing website templates to webapp
    for upd in WEBSITE_TO_WEBAPP_UPDATES:
        conn.execute(
            text("""
                UPDATE templates
                SET category = :category,
                    prompt_template = :prompt_template,
                    onboarding_prompt = :onboarding_prompt,
                    updated_at = NOW()
                WHERE slug = :slug
            """),
            upd,
        )


def downgrade() -> None:
    conn = op.get_bind()

    # Remove new webapp templates
    for tpl in NEW_TEMPLATES:
        conn.execute(
            text("DELETE FROM templates WHERE slug = :slug"),
            {"slug": tpl["slug"]},
        )

    # Revert website templates back to website category
    for upd in WEBSITE_TO_WEBAPP_UPDATES:
        conn.execute(
            text("""
                UPDATE templates
                SET category = 'website',
                    updated_at = NOW()
                WHERE slug = :slug
            """),
            {"slug": upd["slug"]},
        )
