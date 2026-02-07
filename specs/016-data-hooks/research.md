# Research: Data Hooks (React Query Integration)

**Feature Branch**: `016-data-hooks`
**Date**: 2026-02-07

---

## R1: TanStack Query v5 — Library Selection

**Decision**: Использовать `@tanstack/react-query` v5 (latest: 5.90.x)

**Rationale**:
- Де-факто стандарт для серверного состояния в React
- Полная совместимость с React 19 и Next.js 16 App Router
- 3.5M+ npm downloads/week, активно поддерживается
- TypeScript-first, strict типизация
- Встроенные оптимистичные обновления, infinite queries, devtools

**Alternatives considered**:
- `swr` (Vercel) — менее функционален (нет mutation management, нет infinite queries из коробки)
- `zustand` only — текущий подход, нет кэширования, нет дедупликации запросов
- Custom hooks — слишком много boilerplate, изобретение велосипеда

**Library**: `@tanstack/react-query ^5.90.0`, `@tanstack/react-query-devtools ^5.90.0`

---

## R2: Интеграция ky + React Query

**Decision**: Использовать существующий ky instance (`frontend/lib/api/client.ts`) как transport для queryFn/mutationFn

**Rationale**:
- ky уже настроен с auth interceptors, token refresh, error handling
- ky автоматически бросает ошибки на 4xx/5xx — совместимо с React Query error handling
- Не нужно менять API клиент, только оборачивать вызовы в hooks
- Передавать `signal` (AbortSignal) в ky для поддержки отмены запросов

**Pattern**:
```typescript
// queryFn получает signal от React Query → передаёт в ky
useQuery({
  queryKey: queryKeys.user.me,
  queryFn: ({ signal }) => api.get('api/users/me', { signal }).json(),
})
```

---

## R3: Соотношение Zustand и React Query

**Decision**: React Query для серверного состояния (data fetching/caching), Zustand только для клиентского UI-состояния

**Rationale**:
- React Query управляет: загрузкой данных, кэшированием, инвалидацией, оптимистичными обновлениями
- Zustand остаётся для: viewMode (grid/list), searchQuery, filter, sort, activeTab — чистый UI state
- Auth store (zustand) сохраняется для управления auth flow (login/logout/tokens)
- Dashboard store, settings store, projects store, templates store — **постепенно упрощаются**: data-fetching логика мигрирует в React Query hooks

**Migration strategy**:
1. Создать React Query hooks рядом с существующими stores
2. В компонентах заменить `store.loadX()` + `store.data` на `useX()` hook
3. Оставить в stores только UI-state (filters, viewMode, etc.)
4. Не удалять stores сразу — удалить data-fetching части после полной миграции

---

## R4: API Response Mapping — snake_case → camelCase

**Decision**: Использовать существующие mapper-функции из `client.ts` и создать новые для каждой сущности

**Rationale**:
- Backend возвращает `snake_case` (Python convention)
- Frontend использует `camelCase` (TypeScript convention)
- `mapUserResponse()` уже существует в `client.ts`
- Нужны аналогичные mappers для templates, projects, credits

**Pattern**: Mapper функции в `lib/api/mappers.ts`

---

## R5: Расхождения API с исходной спецификацией

**Decision**: Реализовать hooks только для существующих API эндпоинтов. Отсутствующие эндпоинты — mock заглушки с TODO.

**Findings**:

| Эндпоинт из спецификации | Статус на бэкенде | Решение |
|---------------------------|-------------------|---------|
| `GET /api/users/me` | Реализован | Hook |
| `PATCH /api/users/me` | Реализован | Hook |
| `POST /api/users/me/password` | НЕ реализован | Пропустить (P3, не блокирует) |
| `GET /api/credits/balance` | Реализован | Hook |
| `GET /api/credits/transactions` | Реализован (offset/limit) | Hook (адаптировать пагинацию) |
| `GET /api/credits/daily-bonus` | Реализован | Hook |
| `POST /api/credits/daily-bonus` | Реализован | Hook |
| `POST /api/credits/purchase` | НЕ реализован | Пропустить |
| `GET /api/templates` | Реализован | Hook |
| `GET /api/templates/{id}` | Реализован (id или slug) | Hook |
| `POST /api/projects` | Реализован | Hook |
| `GET /api/projects` | Реализован (page/per_page) | Hook |
| `GET /api/projects/{id}` | Реализован (включает код+логи) | Hook |
| `PATCH /api/projects/{id}` | Реализован | Hook |
| `DELETE /api/projects/{id}` | Реализован | Hook |
| `POST /api/projects/{id}/duplicate` | НЕ реализован | Пропустить |
| `PATCH /api/projects/{id}/env` | НЕ реализован | Пропустить |
| `GET /api/projects/{id}/code` | НЕ нужен (код в project detail) | Не создавать |
| `GET /api/projects/{id}/logs` | НЕ нужен (логи в project detail) | Не создавать |

**Note**: Статусы проектов на бэкенде: `draft`, `generating`, `ready`, `deploying`, `deployed`, `error`. Фронтенд использует: `draft`, `generating`, `generated`, `deployed`, `failed`, `stopped`. Нужен маппинг.

---

## R6: Next.js 16 App Router + QueryClientProvider

**Decision**: Создать `app/providers.tsx` (client component) с QueryClientProvider, обернуть children в root layout

**Rationale**:
- QueryClient создаётся один раз на клиенте (не на каждый render)
- SSR streaming/hydration не нужен для этого проекта (данные загружаются на клиенте после auth)
- DevTools подключаются только в development

**Pattern**:
```typescript
// app/providers.tsx — 'use client'
// Создаёт QueryClient singleton, оборачивает в QueryClientProvider
// app/layout.tsx — оборачивает children в <Providers>
```

---

## R7: Offset-based Infinite Query для транзакций

**Decision**: Использовать `useInfiniteQuery` с offset/limit пагинацией вместо cursor-based

**Rationale**:
- Backend `/api/credits/transactions` использует `offset`/`limit` (не курсоры)
- `getNextPageParam` вычисляет следующий offset: `lastPage.meta.offset + lastPage.meta.limit`
- `hasNextPage` определяется по `offset + limit < total`

---

## R8: Project Status Mapping

**Decision**: Создать маппинг статусов backend → frontend в `lib/api/mappers.ts`

| Backend Status | Frontend Status |
|----------------|----------------|
| `draft` | `draft` |
| `generating` | `generating` |
| `ready` | `generated` |
| `deploying` | `generating` (или новый) |
| `deployed` | `deployed` |
| `error` | `failed` |

**Note**: Статус `stopped` отсутствует на бэкенде. На фронтенде он использовался в mock данных. Пока игнорируем.
