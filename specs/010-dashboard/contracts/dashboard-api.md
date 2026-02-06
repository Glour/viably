# Dashboard API Contracts

**Feature Branch**: `010-dashboard`
**Date**: 2026-02-06
**Note**: Для MVP все данные — mock. Контракты описывают будущие API endpoints и текущие mock функции.

## Mock Functions (MVP)

### getUserProfile

Возвращает профиль текущего пользователя для dashboard.

**Signature**: `getUserProfile(): Promise<UserProfileResponse>`

**Response**:
```typescript
type UserProfileResponse =
  | { success: true; user: UserProfile }
  | { success: false; error: string }

interface UserProfile {
  id: string
  name: string
  email: string
  plan: "free" | "pro" | "business"
  credits: number
  projectsCount: number
  projectsLimit: number
  deployedCount: number
}
```

**Mock Data**:
```json
{
  "success": true,
  "user": {
    "id": "usr_1",
    "name": "Алексей",
    "email": "alex@example.com",
    "plan": "pro",
    "credits": 150,
    "projectsCount": 3,
    "projectsLimit": 10,
    "deployedCount": 2
  }
}
```

---

### getRecentProjects

Возвращает до 3 последних проектов пользователя.

**Signature**: `getRecentProjects(): Promise<RecentProjectsResponse>`

**Response**:
```typescript
type RecentProjectsResponse =
  | { success: true; projects: ProjectSummary[] }
  | { success: false; error: string }

interface ProjectSummary {
  id: string
  name: string
  emoji: string
  status: "deployed" | "ready" | "draft" | "failed"
  updatedAt: string // ISO 8601
}
```

**Mock Data**:
```json
{
  "success": true,
  "projects": [
    {
      "id": "proj_1",
      "name": "Магазин цветов",
      "emoji": "🌸",
      "status": "deployed",
      "updatedAt": "2026-02-06T10:30:00Z"
    },
    {
      "id": "proj_2",
      "name": "Поддержка клиентов",
      "emoji": "💬",
      "status": "ready",
      "updatedAt": "2026-02-05T14:00:00Z"
    },
    {
      "id": "proj_3",
      "name": "Тестовый бот",
      "emoji": "🤖",
      "status": "draft",
      "updatedAt": "2026-02-04T09:15:00Z"
    }
  ]
}
```

---

### claimDailyBonus

Получение ежедневного бонуса. Для MVP — локальная операция в zustand store.

**Signature**: `claimDailyBonus(): void` (synchronous, store action)

**State Change**:
```typescript
// Before
{ claimedToday: false, streak: 3, lastClaimedDate: "2026-02-05" }

// After
{ claimedToday: true, streak: 4, lastClaimedDate: "2026-02-06", todayReward: 5, nextReward: 5 }
```

**Streak milestone (7 дней)**:
```typescript
{ claimedToday: true, streak: 7, todayReward: 10, nextReward: 10 }
```

## Zustand Store Contracts

### Dashboard Store

```typescript
interface DashboardState {
  user: UserProfile | null
  projects: ProjectSummary[]
  isLoading: boolean
  loadDashboard: () => Promise<void>
}
```

### Daily Bonus Store (with persist)

```typescript
interface DailyBonusState {
  claimedToday: boolean
  lastClaimedDate: string | null
  streak: number
  todayReward: number
  nextReward: number
  claim: () => void
  checkStreak: () => void // Called on page load to validate streak
}
```

## Navigation Contracts

| Action | Source | Destination |
|--------|--------|-------------|
| Создать проект | Welcome card button | `/projects/new` |
| Пополнить кредиты | Welcome card link | `/credits` |
| Открыть проект | Project card click | `/projects/{id}` |
| Все проекты | Section header link | `/projects` |
| Создать по шаблону | Quick action card click | `/projects/new?template={slug}` |
| Создать первый проект | Empty state button | `/projects/new` |
