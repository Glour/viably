# Research: API Client & Auth Flow

**Feature**: 015-api-client-auth
**Date**: 2026-02-07

## R-001: HTTP Client Library

**Decision**: `ky` v1.x

**Rationale**:
- Fetch-based — нативная совместимость с Next.js 16 (caching, revalidation, Server Components)
- 3.3 KB gzipped (vs 11.7 KB у axios)
- TypeScript-first с отличным type inference
- Встроенные hooks: `beforeRequest`, `afterResponse`, `beforeRetry` — покрывают 401 → refresh → retry
- 2.5M+ weekly downloads, активно поддерживается (Sindre Sorhus)
- Нативная поддержка timeout, retry, JSON parsing

**Alternatives considered**:
- **axios**: 84M downloads, но XMLHttpRequest-based → несовместим с Next.js fetch caching, 3.5× больше бандл, не работает в Server Components без `"use client"`
- **wretch**: Хороший API, но 97K downloads — слишком мало для production-зависимости
- **native fetch wrapper**: 0 KB, но требует 100+ строк ручного кода для interceptors, retry, timeout

**Library**: ky v1.x, MIT license

## R-002: Token Storage Strategy

**Decision**: localStorage для access token и refresh token

**Rationale**:
- Бэкенд возвращает токены в JSON body (`{ data: { access_token, refresh_token } }`), не устанавливает httpOnly cookies
- Для httpOnly cookies нужна серверная прослойка (Next.js API route), что добавляет unnecessary complexity для MVP
- localStorage доступен из клиентского кода для подстановки в Authorization header
- Для middleware (proxy.ts) — дублируем наличие сессии в обычном cookie (не httpOnly) как flag-cookie

**Security mitigation**:
- Access token живёт 15 минут — короткое окно атаки при XSS
- Refresh token ротируется при каждом использовании — одноразовый
- CSP headers настроены на бэкенде (Content-Security-Policy: default-src 'none')
- Все формы защищены Zod-валидацией

**Alternatives considered**:
- **httpOnly cookies через Next.js API proxy**: Безопаснее, но требует создания API route `/api/auth/proxy` для каждого auth endpoint. Overkill для MVP — можно мигрировать позже
- **Session-based auth**: Потребует переписать бэкенд. Вне scope

## R-003: Auth State Management

**Decision**: Zustand store (`useAuthStore`) — НЕ React Context

**Rationale**:
- Весь проект использует Zustand для state management (dashboard, generation, projects, templates, settings stores)
- Zustand не требует Provider wrapper → проще интеграция
- Можно подписываться на отдельные slices (selector) → меньше re-renders
- `getState()` доступен вне React (из interceptors, middleware)
- Паттерн уже отработан в проекте: `create<StateInterface>((set, get) => ({...}))`

**Alternatives considered**:
- **React Context + Provider**: Требует оборачивать layout в Provider, вызывает re-render всего дерева при изменении state. Используется только для theme (next-themes) — другой паттерн
- **Zustand + React Context гибрид**: Излишняя сложность, Zustand singleton достаточен

## R-004: Next.js 16 Middleware (proxy.ts)

**Decision**: Использовать существующий `proxy.ts` с минимальными изменениями

**Rationale**:
- Next.js 16 deprecated `middleware.ts` в пользу `proxy.ts` (Node.js runtime, не Edge)
- Файл `proxy.ts` уже существует в проекте с базовой route protection
- Proxy проверяет cookie `session` — нужно переключить на `access_token` cookie
- Proxy НЕ может читать localStorage → нужен flag-cookie, устанавливаемый при login

**Approach**:
- При login: сохраняем токены в localStorage + устанавливаем cookie `viably_session=1` (не httpOnly, просто flag)
- proxy.ts проверяет наличие cookie `viably_session` для роутинга
- Реальная валидация токена — на клиенте (AuthStore при mount) и на бэкенде (каждый запрос)

**Alternatives considered**:
- **JWT декодирование в proxy**: Возможно в Node.js runtime, но добавляет latency к каждому запросу. Не стоит для MVP — бэкенд и так валидирует

## R-005: Response Format Mapping

**Decision**: Создать utility-функцию `unwrapApiResponse()` для маппинга `{ data: {...} }` → клиентские типы

**Rationale**:
- Бэкенд оборачивает все ответы в `{ data: {...} }` wrapper
- Фронтенд использует паттерн `{ success: true, data } | { success: false, error }` (discriminated union)
- ky hooks (`afterResponse`) идеально подходят для трансформации ответа
- Единая точка маппинга → не нужно менять каждый API-вызов

**Alternatives considered**:
- **Менять каждый API endpoint индивидуально**: Много boilerplate, легко забыть
- **Менять бэкенд формат**: Вне scope, затрагивает все модули

## R-006: User Type Alignment

**Decision**: Обновить frontend `UserProfile` тип до полного соответствия с backend `UserResponse`

**Rationale**:
- Backend возвращает: id (UUID), email, full_name, avatar_url, plan, credits, referral_code, is_verified, created_at, last_login_at
- Frontend имеет: id, name, email, plan, credits, projectsCount, projectsLimit, deployedCount
- Расхождение: name vs full_name, отсутствующие поля (avatar_url, is_verified, referral_code, created_at, last_login_at)
- projectsCount/projectsLimit/deployedCount — вычисляемые поля, не приходят из auth endpoint

**Approach**:
- Создать `AuthUser` тип, точно маппящийся на backend UserResponse
- Обновить `UserProfile` для dashboard (может расширять AuthUser + computed fields)
- Типы auth-ответов: `AuthResponse`, `TokenResponse`
