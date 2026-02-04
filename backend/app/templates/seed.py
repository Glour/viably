"""Initial template seed data."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.templates.models import Template

INITIAL_TEMPLATES = [
    {
        "name": "FAQ Bot",
        "slug": "faq-bot",
        "description": "Simple Q&A bot with inline buttons for quick answers",
        "category": "telegram_bot",
        "credit_cost": 3,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {
                    "type": "string",
                    "title": "Bot Name",
                    "description": "Display name for your bot",
                },
                "faq_items": {
                    "type": "array",
                    "title": "FAQ Items",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string"},
                            "answer": {"type": "string"},
                        },
                        "required": ["question", "answer"],
                    },
                    "minItems": 1,
                },
            },
            "required": ["bot_name", "faq_items"],
        },
        "prompt_template": "Create a Telegram FAQ bot named '{{bot_name}}' with these Q&A pairs: {{faq_items}}. Use aiogram 3.x, inline keyboards for questions, and clean async/await code.",
        "features": ["Inline keyboard", "Quick answers", "Easy setup"],
        "tags": ["telegram", "simple", "faq"],
        "sort_order": 1,
        "is_active": True,
    },
    {
        "name": "Shop Bot",
        "slug": "shop-bot",
        "description": "E-commerce bot with product catalog, shopping cart, and payment integration",
        "category": "telegram_bot",
        "credit_cost": 5,
        "config_schema": {
            "type": "object",
            "properties": {
                "shop_name": {"type": "string", "title": "Shop Name"},
                "products": {
                    "type": "array",
                    "title": "Products",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "price": {"type": "number"},
                            "image_url": {"type": "string"},
                        },
                        "required": ["name", "price"],
                    },
                },
                "payment_provider": {
                    "type": "string",
                    "enum": ["yookassa", "stripe"],
                    "title": "Payment Provider",
                },
                "currency": {"type": "string", "default": "RUB", "title": "Currency"},
            },
            "required": ["shop_name", "products", "payment_provider"],
        },
        "prompt_template": "Create a Telegram shop bot for '{{shop_name}}' with products: {{products}}. Implement: product catalog with pagination, shopping cart, {{payment_provider}} payment integration, order management. Use aiogram 3.x, SQLite for data, and best practices.",
        "features": [
            "Product catalog",
            "Shopping cart",
            "Payment integration",
            "Order management",
        ],
        "tags": ["telegram", "ecommerce", "shop"],
        "sort_order": 2,
        "is_active": True,
    },
    {
        "name": "Notification Bot",
        "slug": "notification-bot",
        "description": "Send scheduled notifications and broadcasts to subscribers",
        "category": "telegram_bot",
        "credit_cost": 3,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "title": "Bot Name"},
                "notification_types": {
                    "type": "array",
                    "title": "Notification Types",
                    "items": {"type": "string"},
                },
            },
            "required": ["bot_name"],
        },
        "prompt_template": "Create a Telegram notification bot '{{bot_name}}' with subscription management, scheduled notifications, and broadcast features. Use aiogram 3.x, APScheduler for scheduling, SQLite for subscribers.",
        "features": [
            "Subscription management",
            "Scheduled messages",
            "Broadcast to all users",
        ],
        "tags": ["telegram", "notifications", "scheduler"],
        "sort_order": 3,
        "is_active": True,
    },
    {
        "name": "Support Bot",
        "slug": "support-bot",
        "description": "Customer support bot with ticket system and admin panel",
        "category": "telegram_bot",
        "credit_cost": 6,
        "config_schema": {
            "type": "object",
            "properties": {
                "company_name": {"type": "string", "title": "Company Name"},
                "support_categories": {
                    "type": "array",
                    "title": "Support Categories",
                    "items": {"type": "string"},
                },
                "admin_chat_id": {
                    "type": "string",
                    "title": "Admin Telegram Chat ID",
                },
            },
            "required": ["company_name", "admin_chat_id"],
        },
        "prompt_template": "Create a support bot for '{{company_name}}' with ticket system, categories: {{support_categories}}, admin notifications to {{admin_chat_id}}. Features: ticket creation, status tracking, admin replies, auto-close. Use aiogram 3.x, PostgreSQL.",
        "features": [
            "Ticket system",
            "Admin panel",
            "Status tracking",
            "Auto-replies",
        ],
        "tags": ["telegram", "support", "tickets"],
        "sort_order": 4,
        "is_active": True,
    },
    {
        "name": "Poll Bot",
        "slug": "poll-bot",
        "description": "Create and manage polls with analytics",
        "category": "telegram_bot",
        "credit_cost": 4,
        "config_schema": {
            "type": "object",
            "properties": {
                "bot_name": {"type": "string", "title": "Bot Name"},
                "default_poll_type": {
                    "type": "string",
                    "enum": ["quiz", "regular"],
                    "title": "Default Poll Type",
                },
            },
            "required": ["bot_name"],
        },
        "prompt_template": "Create a Telegram poll bot '{{bot_name}}' with poll creation, voting, results analytics, and export. Support {{default_poll_type}} polls. Use aiogram 3.x, SQLite for data, matplotlib for charts.",
        "features": [
            "Poll creation",
            "Real-time results",
            "Analytics dashboard",
            "Export results",
        ],
        "tags": ["telegram", "polls", "analytics"],
        "sort_order": 5,
        "is_active": True,
    },
    {
        "name": "Booking Bot",
        "slug": "booking-bot",
        "description": "Appointment booking system with calendar integration",
        "category": "telegram_bot",
        "credit_cost": 8,
        "config_schema": {
            "type": "object",
            "properties": {
                "business_name": {"type": "string", "title": "Business Name"},
                "services": {
                    "type": "array",
                    "title": "Services",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "duration_minutes": {"type": "number"},
                            "price": {"type": "number"},
                        },
                    },
                },
                "working_hours": {
                    "type": "object",
                    "title": "Working Hours",
                    "properties": {
                        "start": {"type": "string"},
                        "end": {"type": "string"},
                    },
                },
            },
            "required": ["business_name", "services"],
        },
        "prompt_template": "Create a booking bot for '{{business_name}}' with services: {{services}}, working hours: {{working_hours}}. Features: calendar view, time slots, booking confirmation, reminders, cancellation. Use aiogram 3.x, PostgreSQL, APScheduler.",
        "features": [
            "Calendar interface",
            "Time slot management",
            "Booking confirmation",
            "Reminders",
            "Admin dashboard",
        ],
        "tags": ["telegram", "booking", "calendar"],
        "sort_order": 6,
        "is_active": True,
    },
]


async def seed_templates(db: AsyncSession) -> None:
    """Seed initial templates into database.

    Args:
        db: Database session.

    Note:
        Checks if templates already exist before seeding.
    """
    # Check if templates already exist
    result = await db.execute(select(Template).limit(1))
    if result.scalar_one_or_none():
        return  # Already seeded

    for template_data in INITIAL_TEMPLATES:
        template = Template(**template_data)
        db.add(template)

    await db.commit()
