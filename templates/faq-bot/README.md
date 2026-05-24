# ❓ FAQ Bot - Telegram поддержка

Готовый бот для автоматизации поддержки клиентов с базой знаний и переадресацией операторам.

## ✨ Возможности

- 📚 База знаний с готовыми ответами
- 👨‍💼 Переадресация сложных вопросов операторам
- 🎯 Категории вопросов (доставка, оплата, возврат, гарантия)
- 📊 Удобная навигация на inline-кнопках

## 🚀 Быстрый старт

### 1. Установка

```bash
pip install -r requirements.txt
```

### 2. Конфигурация

```bash
cp .env.example .env
nano .env
```

Параметры:
- `TELEGRAM_BOT_TOKEN` - токен от @BotFather
- `SUPPORT_CHAT_ID` - ID чата/канала для вопросов операторам

### 3. Запуск

```bash
python bot.py
```

## 📝 Настройка базы знаний

Отредактируйте `FAQ_DATA` в `bot.py`:

```python
FAQ_DATA = {
    'your_topic': {
        'question': '🎯 Ваша тема',
        'answer': 'Подробный ответ здесь'
    },
}
```

## 🔧 Расширенные функции

### Добавление категорий

```python
FAQ_DATA['new_category'] = {
    'question': '📦 Новая категория',
    'answer': 'Ответ'
}
```

### Интеграция с CRM

Отправляйте вопросы в вашу CRM через webhook:

```python
import aiohttp

async def send_to_crm(user_id, question):
    async with aiohttp.ClientSession() as session:
        await session.post('https://your-crm.com/api/ticket', json={
            'user_id': user_id,
            'question': question
        })
```

### Автоответы с AI

Интегрируйте GPT для умных ответов:

```python
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key="your-key")

async def get_ai_answer(question):
    response = await client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": question}]
    )
    return response.choices[0].message.content
```

## 🐳 Docker Deploy

```bash
docker build -t faq-bot .
docker run -d --env-file .env faq-bot
```

## 📄 Лицензия

MIT - свободное использование.
