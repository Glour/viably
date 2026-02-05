# Quickstart: Credits Module

**Branch**: `003-credits-module` | **Date**: 2026-02-05

## Prerequisites

- Python 3.12+
- PostgreSQL (development) или SQLite (tests)
- Активированное виртуальное окружение
- Установленные зависимости: `pip install -r backend/requirements.txt`

## Установка дополнительных зависимостей

```bash
cd backend
pip install apscheduler>=3.10.0
```

Добавить в `requirements.txt`:
```
apscheduler>=3.10.0
```

## Структура модуля

```
backend/app/credits/
├── __init__.py       # Экспорты модуля
├── models.py         # CreditTransaction, DailyBonus
├── schemas.py        # Pydantic схемы
├── service.py        # Бизнес-логика
├── routes.py         # FastAPI endpoints
└── cron.py           # Scheduler для rollover
```

## Создание миграций

```bash
cd backend

# Миграция для daily_bonuses + related_user_id
alembic revision --autogenerate -m "add_daily_bonuses_table"

# Применить миграции
alembic upgrade head
```

## Примеры использования

### Списание кредитов

```python
from app.credits.service import deduct_credits

result = await deduct_credits(
    user_id=user.id,
    amount=5,
    transaction_type="generation",
    project_id=project.id,
    description="Generated Shop Bot",
    db=db
)
# result = {"transaction_id": UUID, "balance_after": 145, "success": True}
```

### Начисление кредитов

```python
from app.credits.service import add_credits

result = await add_credits(
    user_id=user.id,
    amount=50,
    transaction_type="purchase",
    description="Credit purchase - 50 pack",
    db=db
)
# result = {"transaction_id": UUID, "balance_after": 200, "success": True}
```

### Получение ежедневного бонуса

```python
from app.credits.service import claim_daily_bonus

result = await claim_daily_bonus(user_id=user.id, db=db)
# result = {
#     "claimed": True,
#     "amount": 3,
#     "new_balance": 153,
#     "next_available_at": "2026-02-06T00:00:00Z"
# }
```

### Реферальный бонус

```python
from app.credits.service import award_referral_bonus

result = await award_referral_bonus(
    referrer_id=existing_user.id,
    referee_id=new_user.id,
    db=db
)
# result = {"transaction_id": UUID, "amount": 5, "balance_after": 155}
```

## API Endpoints

### GET /api/credits/balance

Получить текущий баланс:

```bash
curl -X GET http://localhost:8000/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"
```

Response:
```json
{
  "data": {
    "credits": 150,
    "plan": "starter"
  }
}
```

### GET /api/credits/transactions

Получить историю транзакций:

```bash
curl -X GET "http://localhost:8000/api/credits/transactions?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/credits/daily-bonus

Получить ежедневный бонус:

```bash
curl -X POST http://localhost:8000/api/credits/daily-bonus \
  -H "Authorization: Bearer $TOKEN"
```

Response (успех):
```json
{
  "data": {
    "claimed": true,
    "amount": 3,
    "new_balance": 153,
    "next_available_at": "2026-02-06T00:00:00Z"
  }
}
```

Response (уже получен):
```json
{
  "detail": "Daily bonus already claimed today"
}
```

## Запуск тестов

```bash
cd backend

# Все тесты credits модуля
pytest tests/test_credits.py -v

# С покрытием
pytest tests/test_credits.py --cov=app/credits --cov-report=term-missing
```

## Интеграция с main.py

```python
# backend/app/main.py

from app.credits.routes import router as credits_router
from app.credits.cron import start_scheduler

app.include_router(credits_router, prefix="/api/credits", tags=["credits"])

@app.on_event("startup")
async def startup():
    start_scheduler()
```

## Cron Jobs

Месячный rollover запускается автоматически 1-го числа каждого месяца в 00:00 UTC.

Для ручного запуска (тестирование):

```python
from app.credits.service import process_monthly_rollover
from app.core.database import get_db

async with get_db() as db:
    await process_monthly_rollover(db)
```

## Конфигурация бонусов

Значения захардкожены в `service.py`:

```python
DAILY_BONUSES = {
    "free": 0,
    "starter": 3,
    "pro": 10,
    "business": 20
}

ROLLOVER_LIMITS = {
    "free": 0,
    "starter": 200,
    "pro": 600,
    "business": 2000
}

REFERRAL_BONUS = 5
```

Для изменения — отредактировать константы или вынести в конфиг.

## Troubleshooting

### Race condition при списании

Если возникают ошибки "could not serialize access":
- Убедитесь, что используется `with_for_update()` в запросах
- Проверьте isolation level транзакций

### Daily bonus не работает

1. Проверьте план пользователя (`user.plan`)
2. Проверьте записи в `daily_bonuses` таблице
3. Убедитесь, что timezone сервера = UTC

### Scheduler не запускается

1. Убедитесь, что `start_scheduler()` вызывается в startup event
2. Проверьте логи APScheduler
3. Для debugging: `scheduler.add_job(...)` вручную
