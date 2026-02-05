# Data Model: Credits Module

**Branch**: `003-credits-module` | **Date**: 2026-02-05

## Entity Relationship Diagram

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id: UUID (PK)       │
│ credits: INTEGER    │◄──────────────────────────────────┐
│ plan: VARCHAR(20)   │                                   │
│ ...                 │                                   │
└─────────────────────┘                                   │
          │                                               │
          │ 1:N                                           │
          ▼                                               │
┌─────────────────────────────────┐                       │
│      credit_transactions        │                       │
├─────────────────────────────────┤                       │
│ id: UUID (PK)                   │                       │
│ user_id: UUID (FK → users.id)   │───────────────────────┤
│ amount: INTEGER                 │                       │
│ balance_after: INTEGER          │                       │
│ transaction_type: VARCHAR(20)   │                       │
│ description: VARCHAR(255)       │                       │
│ project_id: UUID (nullable)     │                       │
│ related_user_id: UUID (FK)      │───────────────────────┘
│ metadata: JSONB                 │      (for referrals)
│ created_at: TIMESTAMPTZ         │
└─────────────────────────────────┘
          │
          │ (user_id)
          │
          ▼
┌─────────────────────────────────┐
│        daily_bonuses            │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ user_id: UUID (FK → users.id)   │
│ credits_awarded: INTEGER        │
│ bonus_date: DATE                │
│ created_at: TIMESTAMPTZ         │
├─────────────────────────────────┤
│ UNIQUE(user_id, bonus_date)     │
└─────────────────────────────────┘
```

## Entities

### CreditTransaction

Запись каждой операции с кредитами пользователя.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default uuid4 | Уникальный идентификатор транзакции |
| user_id | UUID | FK → users.id, NOT NULL, INDEX | Владелец транзакции |
| amount | INTEGER | NOT NULL | Сумма: положительная для начисления, отрицательная для списания |
| balance_after | INTEGER | NOT NULL | Баланс после операции (денормализация для быстрого отображения) |
| transaction_type | VARCHAR(20) | NOT NULL, INDEX | Тип операции |
| description | VARCHAR(255) | NULL | Описание операции |
| project_id | UUID | NULL | Связь с проектом (для generation) |
| related_user_id | UUID | FK → users.id, NULL | Связанный пользователь (для referral_bonus) |
| metadata | JSONB | DEFAULT {} | Дополнительные данные |
| created_at | TIMESTAMPTZ | DEFAULT NOW(), INDEX | Время создания |

**Transaction Types**:
- `signup` — стартовый бонус при регистрации
- `daily_bonus` — ежедневный бонус
- `referral_bonus` — бонус за приглашение
- `purchase` — покупка кредитов
- `refund` — возврат
- `generation` — использование на генерацию контента
- `rollover` — списание при месячном rollover
- `admin_adjustment` — ручная корректировка администратором

**Indexes**:
- `ix_credit_transactions_user_id` — поиск по пользователю
- `ix_credit_transactions_created_at` — сортировка по времени
- `ix_credit_transactions_user_created` — составной индекс для пагинации

---

### DailyBonus

Запись полученного ежедневного бонуса (один на пользователя в день).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default uuid4 | Уникальный идентификатор |
| user_id | UUID | FK → users.id, NOT NULL | Получатель бонуса |
| credits_awarded | INTEGER | NOT NULL | Количество начисленных кредитов |
| bonus_date | DATE | NOT NULL, INDEX | Дата бонуса (UTC) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Время создания записи |

**Constraints**:
- `UNIQUE(user_id, bonus_date)` — один бонус на пользователя в день

---

## Business Rules

### Daily Bonus Amounts by Plan

| Plan | Daily Bonus | Rollover Limit |
|------|-------------|----------------|
| free | 0 | 0 |
| starter | 3 | 200 |
| pro | 10 | 600 |
| business | 20 | 2000 |

### Referral Bonus

- Фиксированная сумма: **5 кредитов**
- Начисляется referrer при регистрации referee
- Связывается через `related_user_id`

---

## Validation Rules

### CreditTransaction

1. `amount` ≠ 0
2. `transaction_type` ∈ {signup, daily_bonus, referral_bonus, purchase, refund, generation, rollover, admin_adjustment}
3. `balance_after` ≥ 0 (после операции)
4. При `transaction_type = generation`: `amount < 0`
5. При `transaction_type = referral_bonus`: `related_user_id` NOT NULL

### DailyBonus

1. `credits_awarded` > 0
2. `bonus_date` ≤ текущая дата (UTC)
3. Уникальность (user_id, bonus_date) обеспечивается constraint

---

## State Transitions

### User Credits Balance

```
┌──────────────────────────────────────────────────────────────────┐
│                      User Balance State                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │ credits = N │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Credit Operations (Atomic)                  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ ADD (+): signup, daily_bonus, referral_bonus,           │    │
│  │          purchase, refund, admin_adjustment(+)          │    │
│  │                                                          │    │
│  │ DEDUCT (-): generation, rollover, admin_adjustment(-)   │    │
│  └──────┬──────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │ credits = M │  where M = N + amount                           │
│  │ (M ≥ 0)     │  Invariant: balance never negative              │
│  └─────────────┘                                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Daily Bonus Claim

```
┌─────────────────┐     Check plan      ┌──────────────────┐
│ Bonus Available │ ───────────────────►│ Plan has bonus?  │
└─────────────────┘                     └────────┬─────────┘
                                                 │
                          ┌──────────────────────┼───────────────────────┐
                          │ No                   │                       │ Yes
                          ▼                      │                       ▼
                   ┌──────────────┐              │         ┌────────────────────┐
                   │ Error 400:   │              │         │ Check daily_bonuses│
                   │ Plan doesn't │              │         │ for today          │
                   │ include bonus│              │         └──────────┬─────────┘
                   └──────────────┘              │                    │
                                                 │      ┌─────────────┼─────────────┐
                                                 │      │ Already     │             │ Not
                                                 │      │ claimed     │             │ claimed
                                                 │      ▼             │             ▼
                                                 │ ┌────────────┐     │    ┌─────────────────┐
                                                 │ │ Error 409: │     │    │ Award credits   │
                                                 │ │ Already    │     │    │ + Create record │
                                                 │ │ claimed    │     │    └─────────────────┘
                                                 │ └────────────┘     │
                                                 │                    │
                                                 └────────────────────┘
```

---

## Migration Plan

### Migration 1: Add related_user_id to credit_transactions

```sql
ALTER TABLE credit_transactions
ADD COLUMN related_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE credit_transactions
ADD COLUMN metadata JSONB DEFAULT '{}';
```

### Migration 2: Create daily_bonuses table

```sql
CREATE TABLE daily_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credits_awarded INTEGER NOT NULL,
    bonus_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_bonus UNIQUE(user_id, bonus_date)
);

CREATE INDEX ix_daily_bonuses_user_id ON daily_bonuses(user_id);
CREATE INDEX ix_daily_bonuses_bonus_date ON daily_bonuses(bonus_date);
```
