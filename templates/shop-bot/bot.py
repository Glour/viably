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

# Конфигурация
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN')
ADMIN_ID = int(os.getenv('ADMIN_ID', '0'))

# Инициализация
bot = Bot(token=TOKEN)
storage = MemoryStorage()
dp = Dispatcher(storage=storage)

# Состояния для FSM
class OrderState(StatesGroup):
    waiting_for_name = State()
    waiting_for_phone = State()
    waiting_for_address = State()

# Каталог товаров
PRODUCTS = {
    'product_1': {'name': '🍕 Пицца Маргарита', 'price': 500, 'description': 'Классическая пицца с томатами и моцареллой'},
    'product_2': {'name': '🍔 Бургер Классик', 'price': 350, 'description': 'Сочный бургер с говядиной'},
    'product_3': {'name': '🍣 Суши Сет', 'price': 800, 'description': 'Набор из 24 суши'},
}

# Корзина (в продакшене использовать БД)
cart = {}

def get_main_keyboard():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=🛍 Каталог, callback_data=catalog)],
        [InlineKeyboardButton(text=🛒 Корзина, callback_data=cart)],
        [InlineKeyboardButton(text=ℹ️ О магазине, callback_data=about)],
    ])
    return keyboard

def get_catalog_keyboard():
    buttons = []
    for pid, product in PRODUCTS.items():
        buttons.append([InlineKeyboardButton(
            text=f{product[name]} - {product[price]}₽,
            callback_data=fproduct_{pid}
        )])
    buttons.append([InlineKeyboardButton(text=◀️ Назад, callback_data=main)])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_product_keyboard(product_id):
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=➕ Добавить в корзину, callback_data=fadd_{product_id})],
        [InlineKeyboardButton(text=◀️ К каталогу, callback_data=catalog)],
    ])

@dp.message(Command(start))
async def cmd_start(message: types.Message):
    await message.answer(
        f👋 Добро пожаловать в Shop Bot!nn
        fЯ помогу вам заказать товары быстро и удобно.,
        reply_markup=get_main_keyboard()
    )

@dp.callback_query(lambda c: c.data == main)
async def show_main(callback: CallbackQuery):
    await callback.message.edit_text(
        🏠 Главное меню,
        reply_markup=get_main_keyboard()
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data == catalog)
async def show_catalog(callback: CallbackQuery):
    await callback.message.edit_text(
        🛍 Наш каталог товаров:,
        reply_markup=get_catalog_keyboard()
    )
    await callback.answer()

@dp.callback_query(lambda c: c.data.startswith(product_product_))
async def show_product(callback: CallbackQuery):
    product_id = callback.data.replace(product_, )
    product = PRODUCTS.get(product_id)
    
    if product:
        text = f{product[name]}nn{product[description]}nn💰 Цена: {product[price]}₽
        await callback.message.edit_text(text, reply_markup=get_product_keyboard(product_id))
    await callback.answer()

@dp.callback_query(lambda c: c.data.startswith(add_))
async def add_to_cart(callback: CallbackQuery):
    product_id = callback.data.replace(add_, )
    user_id = callback.from_user.id
    
    if user_id not in cart:
        cart[user_id] = {}
    
    if product_id in cart[user_id]:
        cart[user_id][product_id] += 1
    else:
        cart[user_id][product_id] = 1
    
    await callback.answer(✅ Товар добавлен в корзину!, show_alert=True)

@dp.callback_query(lambda c: c.data == cart)
async def show_cart(callback: CallbackQuery):
    user_id = callback.from_user.id
    
    if user_id not in cart or not cart[user_id]:
        await callback.message.edit_text(
            🛒 Ваша корзина пуста,
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=🛍 К каталогу, callback_data=catalog)],
                [InlineKeyboardButton(text=◀️ Главная, callback_data=main)]
            ])
        )
    else:
        total = 0
        text = 🛒 Ваша корзина:nn
        
        for pid, qty in cart[user_id].items():
            product = PRODUCTS[pid]
            subtotal = product['price'] * qty
            total += subtotal
            text += f{product[name]} x{qty} = {subtotal}₽n
        
        text += fn💰 Итого: {total}₽
        
        await callback.message.edit_text(
            text,
            reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=✅ Оформить заказ, callback_data=checkout)],
                [InlineKeyboardButton(text=🗑 Очистить, callback_data=clear_cart)],
                [InlineKeyboardButton(text=◀️ Главная, callback_data=main)]
            ])
        )
    await callback.answer()

@dp.callback_query(lambda c: c.data == clear_cart)
async def clear_cart(callback: CallbackQuery):
    user_id = callback.from_user.id
    cart[user_id] = {}
    await callback.answer(🗑 Корзина очищена, show_alert=True)
    await show_cart(callback)

@dp.callback_query(lambda c: c.data == checkout)
async def checkout(callback: CallbackQuery, state: FSMContext):
    await callback.message.edit_text(📝 Введите ваше имя:)
    await state.set_state(OrderState.waiting_for_name)
    await callback.answer()

@dp.message(OrderState.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    await state.update_data(name=message.text)
    await message.answer(📱 Введите ваш номер телефона:)
    await state.set_state(OrderState.waiting_for_phone)

@dp.message(OrderState.waiting_for_phone)
async def process_phone(message: types.Message, state: FSMContext):
    await state.update_data(phone=message.text)
    await message.answer(📍 Введите адрес доставки:)
    await state.set_state(OrderState.waiting_for_address)

@dp.message(OrderState.waiting_for_address)
async def process_address(message: types.Message, state: FSMContext):
    data = await state.get_data()
    user_id = message.from_user.id
    
    # Формируем заказ
    order_text = f🎉 Новый заказ!nn
    order_text += f👤 Имя: {data[name]}n
    order_text += f📱 Телефон: {data[phone]}n
    order_text += f📍 Адрес: {message.text}nn
    order_text += 📦 Товары:n
    
    total = 0
    for pid, qty in cart[user_id].items():
        product = PRODUCTS[pid]
        subtotal = product['price'] * qty
        total += subtotal
        order_text += f{product[name]} x{qty} = {subtotal}₽n
    
    order_text += fn💰 Итого: {total}₽
    
    # Отправляем админу
    if ADMIN_ID:
        await bot.send_message(ADMIN_ID, order_text)
    
    # Очищаем корзину
    cart[user_id] = {}
    
    await message.answer(
        f✅ Спасибо за заказ!nn{order_text}nnМы свяжемся с вами в ближайшее время.,
        reply_markup=get_main_keyboard()
    )
    await state.clear()

@dp.callback_query(lambda c: c.data == about)
async def show_about(callback: CallbackQuery):
    await callback.message.edit_text(
        ℹ️ О магазинеnn
        Мы доставляем качественные товары быстро и надёжно.nn
        📞 Поддержка: @supportn
        ⏰ Работаем: 9:00 - 22:00,
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=◀️ Главная, callback_data=main)]
        ])
    )
    await callback.answer()

async def main():
    print(🤖 Shop Bot запущен!)
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
