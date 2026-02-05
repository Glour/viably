# Implementation Plan: Credits Module

**Branch**: `003-credits-module` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-credits-module/spec.md`

## Summary

Модуль управления кредитной экономикой: атомарные операции списания/начисления кредитов, ежедневные бонусы по тарифным планам, реферальные бонусы и месячный rollover с лимитами. Основан на существующей модели CreditTransaction и интегрируется с Users Module.

## Technical Context

**Language/Version**: Python 3.12+
**Primary Dependencies**: FastAPI 0.109+, SQLAlchemy 2.0+ (async), Pydantic 2.5+
**Storage**: PostgreSQL (async via asyncpg), SQLite (tests via aiosqlite)
**Testing**: pytest 8.0+, pytest-asyncio 0.23+, httpx 0.26+
**Target Platform**: Linux server (Docker)
**Project Type**: Web application (backend only for this module)
**Performance Goals**: <500ms p99 для операций с кредитами, обработка 100k пользователей за 1 час при rollover
**Constraints**: Атомарность операций (SELECT FOR UPDATE), нулевая вероятность отрицательного баланса
**Scale/Scope**: ~10k-100k пользователей, ~1M транзакций/месяц

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | ✅ PASS | Изучен существующий код: CreditTransaction в users/models.py, миграция существует |
| II. Single Source of Truth | ✅ PASS | CreditTransaction переносится в credits/models.py как единственный источник |
| III. Library-First Development | ✅ PASS | APScheduler для cron-задач (проверено в research.md) |
| IV. Code Reuse & DRY | ✅ PASS | Переиспользуется Base, get_db, auth deps из существующих модулей |
| V. Strict Type Safety | ✅ PASS | Все функции с type hints, Pydantic schemas |
| VI. Atomic Task Execution | ✅ PASS | Каждая задача независимо тестируема и коммитируема |
| VII. Quality Gates | ✅ PASS | mypy + pytest обязательны перед коммитом |
| VIII. Progressive Specification | ✅ PASS | spec.md → plan.md → tasks.md → implement |

## Project Structure

### Documentation (this feature)

```text
specs/003-credits-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── credits/                    # NEW: Credits module
│   │   ├── __init__.py            # Module exports
│   │   ├── models.py              # CreditTransaction, DailyBonus
│   │   ├── schemas.py             # Pydantic schemas
│   │   ├── service.py             # Business logic
│   │   ├── routes.py              # FastAPI endpoints
│   │   └── cron.py                # Scheduled jobs (rollover)
│   ├── auth/                      # Existing: User model, deps
│   ├── users/                     # Existing: User endpoints
│   │   └── models.py              # MODIFY: Remove CreditTransaction (move to credits)
│   └── main.py                    # MODIFY: Register credits router, start scheduler
├── alembic/versions/
│   └── xxx_add_daily_bonuses.py   # NEW: Daily bonus table migration
└── tests/
    └── test_credits.py            # NEW: Credits module tests
```

**Structure Decision**: Используется существующая структура web application (backend/).
- Credits module создаётся как отдельный пакет `app/credits/`
- CreditTransaction перемещается из `app/users/models.py` в `app/credits/models.py`
- Добавляется таблица daily_bonuses для отслеживания полученных бонусов

## Complexity Tracking

> Нет нарушений Constitution — таблица пустая

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Key Decisions

1. **Atomic Operations**: SELECT FOR UPDATE для блокировки записи пользователя при изменении баланса
2. **Daily Bonus Tracking**: Отдельная таблица daily_bonuses с unique constraint (user_id, bonus_date)
3. **Cron Jobs**: APScheduler для месячного rollover (1-го числа в 00:00 UTC)
4. **Transaction Types**: signup, daily_bonus, referral_bonus, purchase, refund, generation, rollover, admin_adjustment
5. **Related User**: Поле related_user_id добавляется в CreditTransaction для связи реферальных бонусов
