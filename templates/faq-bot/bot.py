import os
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
import asyncio

logging.basicConfig(level=logging.INFO)

TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN')
SUPPORT_CHAT_ID = os.getenv('SUPPORT_CHAT_ID', '')

bot = Bot(token=TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

class SupportState(StatesGroup):
    waiting_for_question = State()

# База знаний FAQ
FAQ_DATA = {
    'delivery': {
        'question': '🚚 Доставка',
        'answer': 'Мы доставляем по всему городу за 1-2 дня.\n\n💰 Стоимость: 200₽ (бесплатно от 1000₽)\n⏰ Время: 10:00 - 20:00'
    },
    'payment': {
        'question': '💳 Оплата',
        'answer': 'Принимаем:\n- Наличные курьеру\n- Карты (Visa/MasterCard)\n- СБП\n- Онлайн-переводы'
    },
    'return': {
        'question': '↩️ Возврат',
        'answer': 'Вы можете вернуть товар в течение 14 дней без объяснения причин.\n\nУсловия:\n- Сохранен товарный вид\n- Есть чек\n- Не использовался'
    },
    'warranty': {
        'question': '🛡 Гарантия',
        'answer': 'Гарантия 12 месяцев на все товары.\n\nПри поломке:\n1. Свяжитесь с нами\n2. Отправьте товар (за наш счёт)\n3. Ремонт или замена в течение 7 дней'
    },
    'contacts': {
        'question': '📞 Контакты',
        'answer': '📧 Email: support@example.com\n📱 Телефон: +7 (900) 123-45-67\n🏢 Адрес: г. Москва, ул. Примерная, 1\n⏰ Режим работы: 9:00 - 21:00'
    }
}

def get_main_keyboard():
    buttons = []
    for key, item in FAQ_DATA.items():
        buttons.append([InlineKeyboardButton(text=item['question'], callback_data=f"faq_{key}")])
    
    buttons.append([InlineKeyboardButton(text="❓ Задать вопрос оператору", callback_data="ask_support")])
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_back_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="◀️ Назад в меню", callback_data="main")]
    ])

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        "👋 Добро пожаловать в FAQ Bot!\n\n"
        "Я отвечу на частые вопросы или соединю вас с оператором.\n\n"
        "Выберите интересующую тему:",
        reply_markup=get_main_keyboard()
    )

@dp.callback_query(lambda c: c.data == "main")
async def show_main(callback: CallbackQuery):
    await callback.message.edit_text(
        "📋 Выберите тему:",
        reply_markup=get_main_keyboard()
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data.startswith("faq_"))
async def show_faq(callback: CallbackQuery):
    faq_key = callback.data.replace("faq_", "")
    faq_item = FAQ_DATA.get(faq_key)
    
    if faq_item:
        text = f"{faq_item['question']}\n\n{faq_item['answer']}"
        
        keyboard = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Проблема решена", callback_data="solved")],
            [InlineKeyboardButton(text="❓ Связаться с оператором", callback_data="ask_support")],
            [InlineKeyboardButton(text="◀️ Назад в меню", callback_data="main")]
        ])
        
        await callback.message.edit_text(text, reply_markup=keyboard)
    
    await callback.answer()

@dp.callback_query(lambda c: c.data == "solved")
async def problem_solved(callback: CallbackQuery):
    await callback.answer("✅ Рады помочь!", show_alert=True)
    await show_main(callback)

@dp.callback_query(lambda c: c.data == "ask_support")
async def ask_support(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "✍️ Опишите ваш вопрос.\n\n"
        "Оператор ответит в ближайшее время.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Отмена", callback_data="main")]
        ])
    )
    await state.set_state(SupportState.waiting_for_question)
    await callback.answer()

@dp.message(SupportState.waiting_for_question)
async def process_question(message: types.Message, state: FSMContext):
    user = message.from_user
    username = user.username if user.username else 'без username'
    question_text = (
        f"❓ Новый вопрос от пользователя\n\n"
        f"👤 {user.full_name} (@{username})\n"
        f"🆔 ID: {user.id}\n\n"
        f"💬 Вопрос:\n{message.text}"
    )
    
    # Отправка в support чат
    if SUPPORT_CHAT_ID:
        await bot.send_message(SUPPORT_CHAT_ID, question_text)
    
    await message.answer(
        "✅ Ваш вопрос отправлен!\n\n"
        "Оператор ответит в течение часа.",
        reply_markup=get_main_keyboard()
    )
    
    await state.clear()

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    await message.answer(
        "ℹ️ Помощь по боту\n\n"
        "Команды:\n"
        "/start - Главное меню\n"
        "/help - Эта справка\n\n"
        "Выберите тему из меню или задайте вопрос оператору.",
        reply_markup=get_main_keyboard()
    )

async def main():
    print("🤖 FAQ Bot запущен!")
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
