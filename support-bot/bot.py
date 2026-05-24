#!/usr/bin/env python3
"""
Telegram Support Bot для Viably
Обрабатывает запросы пользователей и пересылает их администратору
"""
import os
import logging
import json
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
)

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler('/app/logs/support-bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_ID = int(os.getenv("TELEGRAM_ADMIN_ID", "0") or "0")
LOG_DIR = "/app/logs"

# FAQ данные
FAQ_DATA = {
    "start": {
        "title": "🚀 Как начать?",
        "answer": (
            "Добро пожаловать в Viably!\n\n"
            "1️⃣ Зарегистрируйтесь на сайте\n"
            "2️⃣ Подключите GitHub репозиторий\n"
            "3️⃣ Выберите тариф и получите кредиты\n"
            "4️⃣ Начните создавать сайты с помощью AI\n\n"
            "💡 Первый сайт можно создать бесплатно!"
        )
    },
    "credits": {
        "title": "💳 Как работают кредиты?",
        "answer": (
            "Кредиты — это валюта Viably:\n\n"
            "• 1 кредит = 1 AI-генерация сайта\n"
            "• Деплой включен в стоимость кредита\n"
            "• Кредиты не сгорают\n"
            "• Доступны тарифы от 3 до 100 кредитов\n\n"
            "📊 Проверить баланс можно в личном кабинете"
        )
    },
    "deploy": {
        "title": "🐛 Проблема с деплоем?",
        "answer": (
            "Если возникли проблемы с деплоем:\n\n"
            "1️⃣ Проверьте статус в Dashboard\n"
            "2️⃣ Убедитесь, что GitHub токен активен\n"
            "3️⃣ Проверьте логи в разделе 'Deployments'\n"
            "4️⃣ Попробуйте переделать деплой\n\n"
            "❌ Если проблема не решена — напишите нам, мы поможем!"
        )
    },
    "subscription": {
        "title": "💼 Управление подпиской",
        "answer": (
            "Управление подпиской:\n\n"
            "• Смена тарифа: в любой момент в Dashboard\n"
            "• Отмена: без штрафов и обязательств\n"
            "• История платежей: доступна в профиле\n"
            "• Возврат средств: в течение 7 дней\n\n"
            "💬 Вопросы? Напишите нам!"
        )
    }
}


def log_message(user_id: int, username: str, message: str, message_type: str = "user"):
    """Логирование сообщений в JSON формате"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "username": username,
        "message": message,
        "type": message_type
    }
    
    log_file = os.path.join(LOG_DIR, f"messages_{datetime.now().strftime('%Y-%m-%d')}.jsonl")
    try:
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')
    except Exception as e:
        logger.error(f"Failed to log message: {e}")


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    logger.info(f"User {user.id} ({user.username}) started the bot")
    
    welcome_message = (
        f"👋 Привет, {user.first_name}!\n\n"
        "Я бот поддержки Viably — платформы для создания сайтов с AI.\n\n"
        "🔹 Используйте /help чтобы увидеть доступные команды\n"
        "🔹 Используйте /faq для частых вопросов\n"
        "🔹 Или просто напишите ваш вопрос, и я передам его команде поддержки!\n\n"
        "💡 Мы отвечаем в течение 24 часов."
    )
    
    keyboard = [
        [
            InlineKeyboardButton("📚 FAQ", callback_data="faq_menu"),
            InlineKeyboardButton("💬 Написать в поддержку", callback_data="contact_support")
        ],
        [InlineKeyboardButton("🌐 Открыть Dashboard", url="https://viably.tech")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(welcome_message, reply_markup=reply_markup)
    log_message(user.id, user.username or "unknown", "/start", "command")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    user = update.effective_user
    
    help_text = (
        "📋 *Доступные команды:*\n\n"
        "/start — Приветствие и основная информация\n"
        "/help — Список команд (это сообщение)\n"
        "/faq — Частые вопросы\n\n"
        "💬 *Написать в поддержку:*\n"
        "Просто отправьте сообщение в чат, и мы свяжемся с вами!\n\n"
        "⏱ Среднее время ответа: до 24 часов"
    )
    
    await update.message.reply_text(help_text, parse_mode='Markdown')
    log_message(user.id, user.username or "unknown", "/help", "command")


async def faq_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /faq"""
    user = update.effective_user
    
    keyboard = [
        [InlineKeyboardButton(FAQ_DATA["start"]["title"], callback_data="faq_start")],
        [InlineKeyboardButton(FAQ_DATA["credits"]["title"], callback_data="faq_credits")],
        [InlineKeyboardButton(FAQ_DATA["deploy"]["title"], callback_data="faq_deploy")],
        [InlineKeyboardButton(FAQ_DATA["subscription"]["title"], callback_data="faq_subscription")],
        [InlineKeyboardButton("◀️ Назад", callback_data="back_to_start")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    faq_text = "❓ *Частые вопросы*\n\nВыберите интересующую тему:"
    
    await update.message.reply_text(faq_text, reply_markup=reply_markup, parse_mode='Markdown')
    log_message(user.id, user.username or "unknown", "/faq", "command")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик текстовых сообщений - пересылка администратору"""
    user = update.effective_user
    message_text = update.message.text
    
    logger.info(f"Message from {user.id} ({user.username}): {message_text}")
    log_message(user.id, user.username or "unknown", message_text, "user_message")
    
    # Пересылаем сообщение администратору
    admin_notification = (
        f"📨 *Новое сообщение в поддержку*\n\n"
        f"👤 От: {user.first_name} {user.last_name or ''}\n"
        f"🆔 User ID: `{user.id}`\n"
        f"📝 Username: @{user.username or 'нет'}\n\n"
        f"💬 Сообщение:\n{message_text}"
    )
    
    try:
        await context.bot.send_message(
            chat_id=ADMIN_ID,
            text=admin_notification,
            parse_mode='Markdown'
        )
        
        # Подтверждение пользователю
        await update.message.reply_text(
            "✅ Ваше сообщение отправлено в поддержку!\n\n"
            "Мы ответим вам в ближайшее время (обычно в течение 24 часов).\n\n"
            "Спасибо за обращение! 🙏"
        )
    except Exception as e:
        logger.error(f"Failed to forward message to admin: {e}")
        await update.message.reply_text(
            "❌ Произошла ошибка при отправке сообщения.\n"
            "Пожалуйста, попробуйте позже или напишите напрямую: @ne_stoit_togo"
        )


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик callback кнопок"""
    query = update.callback_query
    await query.answer()
    
    user = query.from_user
    data = query.data
    
    logger.info(f"Callback from {user.id} ({user.username}): {data}")
    
    if data == "faq_menu":
        keyboard = [
            [InlineKeyboardButton(FAQ_DATA["start"]["title"], callback_data="faq_start")],
            [InlineKeyboardButton(FAQ_DATA["credits"]["title"], callback_data="faq_credits")],
            [InlineKeyboardButton(FAQ_DATA["deploy"]["title"], callback_data="faq_deploy")],
            [InlineKeyboardButton(FAQ_DATA["subscription"]["title"], callback_data="faq_subscription")],
            [InlineKeyboardButton("◀️ Назад", callback_data="back_to_start")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            "❓ *Частые вопросы*\n\nВыберите интересующую тему:",
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    elif data.startswith("faq_"):
        faq_key = data.replace("faq_", "")
        if faq_key in FAQ_DATA:
            keyboard = [[InlineKeyboardButton("◀️ Назад к FAQ", callback_data="faq_menu")]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(
                f"*{FAQ_DATA[faq_key]['title']}*\n\n{FAQ_DATA[faq_key]['answer']}",
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
            log_message(user.id, user.username or "unknown", f"FAQ: {faq_key}", "faq_view")
    
    elif data == "contact_support":
        await query.edit_message_text(
            "💬 *Напишите ваш вопрос*\n\n"
            "Просто отправьте сообщение в этот чат, и мы обязательно вам ответим!\n\n"
            "⏱ Обычно отвечаем в течение 24 часов.",
            parse_mode='Markdown'
        )
    
    elif data == "back_to_start":
        keyboard = [
            [
                InlineKeyboardButton("📚 FAQ", callback_data="faq_menu"),
                InlineKeyboardButton("💬 Написать в поддержку", callback_data="contact_support")
            ],
            [InlineKeyboardButton("🌐 Открыть Dashboard", url="https://viably.tech")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            "👋 Чем могу помочь?\n\n"
            "Выберите действие или напишите ваш вопрос:",
            reply_markup=reply_markup
        )


def main():
    """Запуск бота"""
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is required")
    logger.info("Starting Viably Support Bot...")
    
    # Создаем директорию для логов если её нет
    os.makedirs(LOG_DIR, exist_ok=True)
    
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем обработчики
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("faq", faq_command))
    application.add_handler(CallbackQueryHandler(handle_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Запускаем бота
    logger.info("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
