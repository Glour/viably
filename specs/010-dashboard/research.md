# Research: Dashboard

**Feature Branch**: `010-dashboard`
**Date**: 2026-02-06

## Library Decisions

### Count-Up Animation

**Decision**: Custom hook `useCountUp` (~15 строк)
**Rationale**: Простейший `requestAnimationFrame` цикл с easing, не превышает порог в 20 строк. Библиотека `react-countup` (6.5.0, 1.2M weekly downloads) — overkill для 3 числовых полей с одним easing-режимом.
**Alternatives considered**:
- `react-countup` — популярна, но тянет `countup.js` как зависимость, избыточна для MVP
- `use-count-up` — последнее обновление 4 года назад, не подходит

### Relative Time Formatting

**Decision**: Custom utility `formatRelativeTime` (~15 строк)
**Rationale**: Нужен только формат "X минут/часов/дней назад" на русском языке. Для этого достаточно простой функции с Intl.RelativeTimeFormat (нативный API браузера). Библиотеки избыточны.
**Alternatives considered**:
- `timeago.js` (1KB) — хороша, но локализация требует плагина
- `react-timeago` — live updating не нужен, проекты не меняют время на лету
- `date-fns/formatDistanceToNow` — потребовала бы новую зависимость

### Confetti / Claim Animation

**Decision**: CSS `glow-pulse` анимация (уже есть в globals.css)
**Rationale**: В спецификации указано "confetti-lite или glow pulse". Анимация `glow-pulse` уже определена в дизайн-системе (`@keyframes glow-pulse`). Для MVP достаточно.
**Alternatives considered**:
- `react-confetti-explosion` — CSS-only, лёгкая, но добавляет зависимость без необходимости
- `canvas-confetti` — overkill для одного элемента

### Daily Bonus State Persistence

**Decision**: Zustand store с localStorage persist middleware
**Rationale**: MVP не имеет бэкенда для daily bonus. Zustand уже установлен (^5.0.11). Persist middleware — встроенная часть zustand, не требует дополнительных зависимостей.
**Alternatives considered**:
- Чистый localStorage — нет реактивности, потребовалось бы ручное обновление UI
- React Query — нет серверного API для MVP

## Codebase Pattern Decisions

### State Management

**Decision**: Создать `stores/dashboard.ts` (mock user data + dashboard state) и `stores/daily-bonus.ts` (bonus state с persist)
**Rationale**: Паттерн уже установлен (`stores/sidebar.ts`): zustand store, типы в `types/index.ts`.

### Mock Data

**Decision**: Создать `lib/api/dashboard.ts` с mock функциями, аналогично `lib/api/auth.ts`
**Rationale**: Существующий паттерн mock API (async функции с delay, discriminated union responses).

### Component Structure

**Decision**: Компоненты в `components/dashboard/` (welcome-card, quick-actions, recent-projects, daily-bonus)
**Rationale**: Спецификация явно указывает файлы. Паттерн `components/{domain}/` уже используется (`components/auth/`, `components/layout/`, `components/ui/`).

### Animations

**Decision**: Использовать существующий `FadeInUp` компонент с нарастающим delay, motion variants из `lib/animations.ts`
**Rationale**: Полностью покрывает FR-017, FR-018. Компонент уже поддерживает reduced motion.

## Resolved Unknowns

| Unknown | Resolution | Source |
|---------|-----------|--------|
| Auth state для user data | Создать mock auth store, нет существующего auth store | Исследование кодовой базы |
| Persistence daily bonus | Zustand persist → localStorage | Паттерн приложения (клиентский MVP) |
| Routing для шаблонов | `/projects/new?template={slug}` — согласно спецификации | Spec |
| Responsive breakpoints | Tailwind v4 defaults (sm:640, md:768, lg:1024) | Tailwind v4 docs |
| Skeleton loading | Существующий Shimmer компонент | `components/ui/shimmer.tsx` |
