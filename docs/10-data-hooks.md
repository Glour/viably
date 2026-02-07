# Integration Module: Data Hooks (React Query)

## Описание
React Query hooks для всех API сущностей: users, templates, projects, credits. Замена mock data на реальный API. Кэширование, оптимистичные обновления, error handling.

## Зависимости
- 09-api-client-auth (axios instance, auth)
- Frontend 03-dashboard, 04-templates, 05-projects (компоненты готовы, используют mock)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 2 дня

---

## Задачи

### Task 1: React Query Setup
**Файл:** `lib/api/query-client.ts`, `app/providers.tsx`
**Описание:** Настройка TanStack Query

```typescript
// QueryClient config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 минут
      gcTime: 10 * 60 * 1000,        // 10 минут (бывший cacheTime)
      retry: 1,                       // 1 retry на ошибку
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Providers wrapper (app/providers.tsx):
// <QueryClientProvider> + <AuthProvider> + <ThemeProvider>
```

**Query Keys Convention:**
```typescript
export const queryKeys = {
  user: {
    me: ['user', 'me'] as const,
    credits: ['user', 'credits'] as const,
  },
  templates: {
    all: ['templates'] as const,
    detail: (slug: string) => ['templates', slug] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    recent: ['projects', 'recent'] as const,
  },
  credits: {
    balance: ['credits', 'balance'] as const,
    transactions: ['credits', 'transactions'] as const,
    dailyBonus: ['credits', 'daily-bonus'] as const,
  },
} as const;
```

**Acceptance Criteria:**
- [ ] QueryClientProvider в root layout
- [ ] Стандартные настройки (staleTime, retry)
- [ ] Query keys convention файл

### Task 2: User & Credits Hooks
**Файл:** `lib/hooks/use-user.ts`, `lib/hooks/use-credits.ts`
**Описание:** Hooks для текущего пользователя и кредитов

```typescript
// === User Hooks ===

function useCurrentUser() → { user, isLoading, error }
// GET /api/users/me
// Используется в navbar, dashboard, settings

function useUpdateProfile() → mutation
// PATCH /api/users/me { full_name, avatar_url }
// onSuccess → invalidate user.me

function useUpdatePassword() → mutation
// POST /api/users/me/password { current_password, new_password }

// === Credits Hooks ===

function useCreditBalance() → { credits, plan, dailyBonus, isLoading }
// GET /api/credits/balance
// Возвращает: { amount, plan_name, daily_bonus_claimed, streak_days }

function useCreditTransactions(filters?) → { transactions, isLoading, fetchNextPage }
// GET /api/credits/transactions?type=&page=&limit=
// Infinite query для пагинации

function useClaimDailyBonus() → mutation
// POST /api/credits/daily-bonus
// onSuccess → invalidate credits.balance + credits.dailyBonus
// Toast: "🎁 +5 кредитов получено!"

function usePurchaseCredits() → mutation
// POST /api/credits/purchase { package_id }
// onSuccess → invalidate credits.balance
```

**Acceptance Criteria:**
- [ ] useCurrentUser возвращает данные пользователя
- [ ] useCreditBalance для navbar badge и dashboard
- [ ] useClaimDailyBonus с оптимистичным обновлением UI
- [ ] Transactions с пагинацией (infinite query)
- [ ] Все mutations invalidate нужные queries

### Task 3: Templates Hooks
**Файл:** `lib/hooks/use-templates.ts`
**Описание:** Hooks для шаблонов

```typescript
function useTemplates(filters?) → { templates, isLoading, error }
// GET /api/templates?category=&sort=
// staleTime: 30 минут (шаблоны меняются редко)

function useTemplate(slug: string) → { template, isLoading, error }
// GET /api/templates/{slug}
// Включает config_schema для формы

function usePopularTemplates() → { templates, isLoading }
// GET /api/templates?sort=popular&limit=2
// Для dashboard quick actions
```

**Acceptance Criteria:**
- [ ] useTemplates с фильтрацией по category
- [ ] useTemplate для detail page
- [ ] Длинный staleTime (шаблоны статичные)

### Task 4: Projects Hooks
**Файл:** `lib/hooks/use-projects.ts`
**Описание:** Hooks для проектов (CRUD + generation + deploy)

```typescript
// === List & Detail ===

function useProjects(filters?) → { projects, isLoading, error }
// GET /api/projects?status=&sort=&search=&page=&limit=
// Фильтры: status, sort (newest/oldest/name), search

function useProject(id: string) → { project, isLoading, error }
// GET /api/projects/{id}
// Включает: config, generated_code, deployment_info

function useRecentProjects(limit = 3) → { projects, isLoading }
// GET /api/projects?sort=updated&limit=3
// Для dashboard

// === Mutations ===

function useCreateProject() → mutation
// POST /api/projects { name, template_id, config }
// onSuccess → invalidate projects.all → navigate to /projects/{id}/generate
// Returns: { id, name, status: 'draft' }

function useDeleteProject() → mutation
// DELETE /api/projects/{id}
// Confirmation required before calling
// onSuccess → invalidate projects.all → toast "Проект удалён"

function useDuplicateProject() → mutation
// POST /api/projects/{id}/duplicate
// onSuccess → invalidate projects.all → navigate to new project

function useUpdateProjectEnv() → mutation
// PATCH /api/projects/{id}/env { env_variables }
// Для settings tab

// === Code ===

function useProjectCode(id: string) → { files, isLoading }
// GET /api/projects/{id}/code
// Returns: Array<{ path, content, language }>
// Для Monaco editor

function useProjectLogs(id: string) → { logs, isLoading }
// GET /api/projects/{id}/logs?limit=100
// Для logs tab
```

**Acceptance Criteria:**
- [ ] CRUD hooks для projects
- [ ] Фильтрация, сортировка, поиск
- [ ] useProjectCode для Monaco editor
- [ ] Все mutations invalidate корректные queries
- [ ] Optimistic update для delete (удаляет из списка сразу)

### Task 5: Подключение Dashboard к реальным данным
**Файлы:** Обновление `components/dashboard/*.tsx`
**Описание:** Замена mock data на hooks

**Welcome Card:**
- `useCurrentUser()` → name, plan
- `useCreditBalance()` → credits amount
- `useProjects()` → count, deployed count

**Quick Actions:**
- `usePopularTemplates()` → 2 карточки

**Recent Projects:**
- `useRecentProjects(3)` → карточки проектов
- Empty state если projects.length === 0

**Daily Bonus:**
- `useCreditBalance()` → streak, claimed status
- `useClaimDailyBonus()` → claim button

**Acceptance Criteria:**
- [ ] Dashboard показывает реальные данные
- [ ] Loading skeletons пока данные грузятся
- [ ] Error states если API недоступен
- [ ] Claim daily bonus работает

### Task 6: Подключение Templates Gallery
**Файлы:** Обновление `app/(main)/templates/page.tsx`, `[slug]/page.tsx`
**Описание:** Замена mock templates на API

**Gallery:**
- `useTemplates(filters)` → карточки
- Search: debounced query parameter
- Filters: передаются в API

**Detail:**
- `useTemplate(slug)` → полная информация
- `useCreditBalance()` → проверка хватает ли credits
- `useCreateProject()` → кнопка "Создать проект"

**Acceptance Criteria:**
- [ ] Gallery загружает шаблоны из API
- [ ] Search и filters работают
- [ ] Detail page показывает config fields
- [ ] "Создать проект" создаёт проект и редиректит

### Task 7: Подключение Projects List
**Файлы:** Обновление `app/(main)/projects/page.tsx`, `[id]/page.tsx`
**Описание:** Замена mock projects на API

**List:**
- `useProjects(filters)` с search/filter/sort
- `useDeleteProject()` для action menu
- `useDuplicateProject()` для action menu

**Detail:**
- `useProject(id)` → overview
- `useProjectCode(id)` → code tab
- `useProjectLogs(id)` → logs tab
- `useUpdateProjectEnv()` → settings tab

**Acceptance Criteria:**
- [ ] Projects list из API с фильтрами
- [ ] Project detail с табами
- [ ] Code viewer загружает реальный код
- [ ] Delete/duplicate работают
