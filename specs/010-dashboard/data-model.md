# Data Model: Dashboard

**Feature Branch**: `010-dashboard`
**Date**: 2026-02-06

## Entities

### UserProfile

Данные авторизованного пользователя для отображения на dashboard.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Уникальный идентификатор пользователя |
| name | string | Отображаемое имя (макс. отображение ~30 символов с truncate) |
| email | string | Email пользователя |
| plan | "free" \| "pro" \| "business" | Текущий тарифный план |
| credits | number | Текущий баланс кредитов (>= 0) |
| projectsCount | number | Количество созданных проектов |
| projectsLimit | number | Лимит проектов по плану |
| deployedCount | number | Количество развёрнутых проектов |

**Источник для MVP**: Mock data в zustand store

---

### ProjectSummary

Краткая информация о проекте для отображения в списке недавних.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Уникальный идентификатор проекта |
| name | string | Название проекта |
| emoji | string | Emoji-иконка проекта |
| status | ProjectStatus | Текущий статус |
| updatedAt | string (ISO 8601) | Время последнего обновления |

**ProjectStatus** (enum):
- `deployed` — Развёрнут и работает
- `ready` — Готов к развёртыванию
- `draft` — В процессе создания
- `failed` — Ошибка развёртывания

**Отображение статусов**:

| Status | Emoji | Label | Badge Variant |
|--------|-------|-------|---------------|
| deployed | - | Deployed | success |
| ready | - | Ready | warning |
| draft | - | Draft | secondary |
| failed | - | Failed | destructive |

---

### DailyBonusState

Состояние ежедневного бонуса пользователя. Персистится в localStorage.

| Field | Type | Description |
|-------|------|-------------|
| claimedToday | boolean | Получен ли бонус сегодня |
| lastClaimedDate | string \| null | Дата последнего получения (YYYY-MM-DD) |
| streak | number | Количество дней подряд (0-7+) |
| todayReward | number | Количество кредитов за сегодня (5 base) |
| nextReward | number | Количество кредитов за завтра |

**Бизнес-правила**:
- Базовый бонус: 5 кредитов
- Серия 7 дней: множитель x2 (10 кредитов)
- Прогресс-бар: streak / 7 (от 0% до 100%)
- Серия прерывается, если пропущен день (lastClaimedDate не вчера)

---

### TemplateShortcut

Быстрое действие — шаблон для создания проекта.

| Field | Type | Description |
|-------|------|-------------|
| slug | string | URL-slug шаблона |
| name | string | Отображаемое название |
| emoji | string | Emoji-иконка |
| badge | string | Текст бейджа |
| href | string | Ссылка для навигации |

**Зафиксированные данные для MVP**:

| slug | name | emoji | badge |
|------|------|-------|-------|
| shop-bot | Shop Bot | - | Самый популярный |
| faq-bot | FAQ Bot | - | Быстрый старт |

## State Transitions

### Daily Bonus Claim Flow

```
NOT_CLAIMED → (user clicks "Получить") → CLAIMING → CLAIMED
                                            ↓
                                      (glow-pulse animation)
                                            ↓
                                    (update streak counter)
                                            ↓
                                    (persist to localStorage)
```

### Streak Reset Logic

```
On page load:
  IF lastClaimedDate === today → claimedToday = true
  ELSE IF lastClaimedDate === yesterday → claimedToday = false (streak preserved)
  ELSE → streak = 0, claimedToday = false (streak reset)
```

## Relationships

```
UserProfile 1──* ProjectSummary (user owns projects)
UserProfile 1──1 DailyBonusState (user has bonus state)
TemplateShortcut ── standalone (fixed data, no user relation)
```
