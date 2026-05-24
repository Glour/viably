# 🛍 Shop Bot - Telegram магазин

Готовый шаблон Telegram-бота для интернет-магазина с корзиной и оформлением заказов.

## ✨ Возможности

- 📦 Каталог товаров с описанием и ценами
- 🛒 Корзина покупок
- ✅ Оформление заказа с контактными данными
- 👨‍💼 Уведомление админа о новых заказах
- 🎨 Интуитивный интерфейс на inline-кнопках

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 2. Настройка

Скопируйте  в  и заполните:

```bash
cp .env.example .env
nano .env
```

Параметры:
- `TELEGRAM_BOT_TOKEN` - токен бота от @BotFather
- `ADMIN_ID` - ваш Telegram ID для получения заказов

### 3. Запуск

```bash
python bot.py
```

## 📝 Настройка каталога

Отредактируйте словарь `PRODUCTS` в `bot.py`:

```python
PRODUCTS = {
    'product_1': {
        'name': '🍕 Ваш товар',
        'price': 500,
        'description': 'Описание товара'
    },
}
```

## 🐳 Deploy с Docker

```bash
docker build -t shop-bot .
docker run -d --env-file .env shop-bot
```

## 📚 Расширение

### Добавление БД

Замените словарь `cart` на SQLite/PostgreSQL для persistence:

```python
import sqlite3
# Ваша БД логика
```

### Платёжная система

Интегрируйте Telegram Payments или сторонний процессинг:

```python
from aiogram.types import LabeledPrice, PreCheckoutQuery
# Payments API
```

## 🔧 Техническая поддержка

- Документация aiogram: https://docs.aiogram.dev/
- Telegram Bot API: https://core.telegram.org/bots/api

## 📄 Лицензия

MIT - используйте свободно для коммерческих и личных проектов.
