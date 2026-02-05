# Research: Credits Module

**Branch**: `003-credits-module` | **Date**: 2026-02-05

## Research Questions

### 1. Atomic Credit Operations in SQLAlchemy

**Decision**: Использовать `SELECT ... FOR UPDATE` через SQLAlchemy `with_for_update()`

**Rationale**:
- PostgreSQL поддерживает row-level locking через FOR UPDATE
- SQLAlchemy async предоставляет `with_for_update()` для этого
- Предотвращает race conditions при параллельных запросах

**Implementation Pattern**:
```python
async with db.begin():
    stmt = select(User).where(User.id == user_id).with_for_update()
    result = await db.execute(stmt)
    user = result.scalar_one()
    # Safe to modify user.credits
```

**Alternatives Considered**:
- Optimistic locking (version column): Требует retry-логики, сложнее
- Application-level locks (Redis): Избыточно для данного use case
- Database triggers: Менее гибко, сложнее тестировать

---

### 2. Scheduler Library for Cron Jobs

**Decision**: APScheduler (apscheduler>=3.10.0)

**Rationale**:
- Зрелая библиотека (>10 лет, 6k+ GitHub stars)
- Встроенная поддержка asyncio (`AsyncIOScheduler`)
- Cron-выражения для точного планирования
- Не требует внешних зависимостей (Redis, RabbitMQ)

**Library Check**:
- PyPI weekly downloads: >1M
- Last commit: Active maintenance
- Python 3.12 support: Yes

**Implementation Pattern**:
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', day=1, hour=0, minute=0)
async def monthly_rollover_job():
    async with get_db() as db:
        await process_monthly_rollover(db)

def start_scheduler():
    scheduler.start()
```

**Alternatives Considered**:
- Celery Beat: Требует Redis/RabbitMQ, избыточно
- Cron system: Внешняя зависимость, сложнее деплоить
- asyncio.create_task + sleep: Ненадёжно при перезапусках

---

### 3. Daily Bonus Deduplication Strategy

**Decision**: Отдельная таблица `daily_bonuses` с unique constraint

**Rationale**:
- Unique constraint (user_id, bonus_date) гарантирует один бонус в день на уровне БД
- Быстрая проверка: простой SELECT по индексу
- Аудит: история всех полученных бонусов

**Schema**:
```sql
CREATE TABLE daily_bonuses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits_awarded INTEGER NOT NULL,
    bonus_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bonus_date)
);
```

**Alternatives Considered**:
- Поле last_daily_bonus_at в users: Нет истории бонусов
- Проверка по credit_transactions: Медленнее, нет гарантии уникальности

---

### 4. Transaction Type Strategy

**Decision**: String enum в коде, VARCHAR(20) в БД

**Rationale**:
- Гибкость: новые типы без миграций
- Читаемость: понятные значения в БД
- Валидация: Pydantic enum или Literal

**Types**:
| Type | Description | Amount |
|------|-------------|--------|
| signup | Стартовый бонус | + |
| daily_bonus | Ежедневный бонус | + |
| referral_bonus | Бонус за приглашение | + |
| purchase | Покупка кредитов | + |
| refund | Возврат | + |
| generation | Использование на генерацию | - |
| rollover | Списание при rollover | - |
| admin_adjustment | Ручная корректировка | ± |

**Alternatives Considered**:
- PostgreSQL ENUM: Требует миграции для новых типов
- Integer codes: Нечитаемо в БД

---

### 5. Related User for Referrals

**Decision**: Добавить поле `related_user_id` в CreditTransaction

**Rationale**:
- Связывает реферальный бонус с приглашённым пользователем
- Полезно для аналитики и аудита
- Nullable — используется только для referral_bonus

**Implementation**:
```python
related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
```

---

### 6. Rollover Processing Strategy

**Decision**: Batch processing с индивидуальными транзакциями

**Rationale**:
- Каждый пользователь обрабатывается в отдельной транзакции
- Сбой одного не влияет на остальных
- Можно легко реализовать retry для failed users

**Implementation Pattern**:
```python
async def process_monthly_rollover(db: AsyncSession):
    # Get all users with credits > 0
    stmt = select(User.id, User.credits, User.plan).where(User.credits > 0)
    result = await db.execute(stmt)
    users = result.all()

    for user_id, credits, plan in users:
        limit = get_rollover_limit(plan)
        if credits > limit:
            try:
                await deduct_credits(
                    user_id=user_id,
                    amount=credits - limit,
                    transaction_type="rollover",
                    db=db
                )
            except Exception as e:
                logger.error(f"Rollover failed for user {user_id}: {e}")
```

**Performance**: 100k users × 10ms/user = ~17 minutes (acceptable)

---

## Existing Code Analysis

### CreditTransaction Model (app/users/models.py)

Существующая модель:
- ✅ id, user_id, amount, balance_after, transaction_type, description, project_id, created_at
- ❌ Отсутствует related_user_id (нужно для referrals)
- ❌ Находится в users module (нужно перенести в credits module)

### Migration Status

- ✅ credit_transactions table: Migration exists (a1b2c3d4e5f6)
- ❌ daily_bonuses table: Migration needed
- ❌ related_user_id column: Migration needed

---

## Conclusion

Все технические вопросы решены. Готово к Phase 1 (Design & Contracts).
