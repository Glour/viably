# Research: Templates Gallery

**Feature**: 011-templates-gallery
**Date**: 2026-02-06

## Research Questions

### RQ-1: Debounce hook — useDebounce

**Decision**: Написать минимальный кастомный хук `useDebounce` (7-10 строк).

**Rationale**: Проект уже содержит паттерн кастомных хуков (`hooks/use-count-up.ts`, `hooks/use-reduced-motion.ts`). Хук debounce — менее 20 строк, не требует библиотеки. Все существующие хуки проекта самописные.

**Alternatives considered**:
- `usehooks-ts` (use-debounce-value) — overhead целой библиотеки для одного хука
- `use-debounce` npm — 300+ downloads/week, но лишняя зависимость для 7 строк кода
- `@tanstack/react-query` debounce — уже установлен, но не используется в проекте

### RQ-2: Клиентская фильтрация — подход

**Decision**: Локальная фильтрация через `Array.filter()` в zustand store computed (derived state).

**Rationale**: 6 шаблонов — нет необходимости в серверной фильтрации или виртуализации. Zustand store хранит массив шаблонов + состояние фильтров, геттер возвращает отфильтрованный список. Соответствует паттерну `useDashboardStore`.

**Alternatives considered**:
- React Query + server filtering — overengineering для 6 элементов
- `use-fuse` (Fuse.js) — fuzzy search не нужен для точного совпадения по 6 элементам
- URL search params (nuqs) — не нужна синхронизация с URL для MVP

### RQ-3: Адаптивная сетка — breakpoints

**Decision**: Использовать Tailwind CSS responsive breakpoints, как в существующих компонентах.

**Rationale**: Проект уже использует `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` в dashboard. Spec указывает 3/2/1 колонки. Tailwind v4 breakpoints:
- `sm`: 640px (2 колонки)
- `md`: 768px (не используем, промежуточный)
- `lg`: 1024px (3 колонки)

**Grid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`

### RQ-4: Hover-анимация карточки

**Decision**: CSS transitions через Tailwind + CSS-переменные для градиентной линии. Без motion library для hover (только CSS).

**Rationale**: Проект уже использует CSS transitions в Card компоненте (`-translate-y-1`, shadow transitions). Hover-эффекты лучше делать на CSS для производительности. Motion library используется только для viewport-based анимаций (FadeInUp).

**Implementation approach**:
- `transition-all duration-400` на карточке
- `hover:-translate-y-1 hover:shadow-lg`
- Градиентная линия: `opacity-0 group-hover:opacity-100 transition-opacity duration-400`
- Border: `hover:border-[var(--primary-subtle)]`

### RQ-5: Навигация на детальную страницу

**Decision**: Next.js dynamic route `app/templates/[slug]/page.tsx` + `next/link`.

**Rationale**: Проект уже использует file-based routing Next.js. Шаблоны идентифицируются по slug (spec entity). `next/link` для client-side navigation без full page reload.

### RQ-6: Проверка кредитов для кнопки "Создать проект"

**Decision**: Использовать существующий `useDashboardStore` для получения `user.credits`, сравнить с `template.creditCost`.

**Rationale**: Dashboard store уже загружает `UserProfile` с полем `credits: number`. Нет необходимости в отдельном store для кредитов на MVP. При реальной интеграции — замена на API вызов.

### RQ-7: Структура файлов компонентов

**Decision**: Следовать существующему паттерну `components/{domain}/`.

**Rationale**: Проект использует `components/dashboard/`, `components/auth/`, `components/layout/`. Для templates gallery:

```
components/templates/
├── template-card.tsx
├── template-detail.tsx
├── search-bar.tsx
├── filter-tabs.tsx
└── empty-state.tsx
```

### RQ-8: Mock data — расположение

**Decision**: `lib/data/templates.ts` для статических данных шаблонов, `lib/api/templates.ts` для mock API функций.

**Rationale**: Spec указывает `lib/data/templates.ts`. API mock следует паттерну `lib/api/dashboard.ts`. Разделение: data = константы, api = async функции с задержкой.

## Library Decisions Summary

| Functionality | Decision | Library | Reason |
|--------------|----------|---------|--------|
| Debounce | Custom hook | — | <20 lines, project pattern |
| Client filtering | Array.filter | — | 6 items, trivial logic |
| Grid layout | Tailwind CSS | (existing) | Already used throughout |
| Hover animations | CSS transitions | (existing) | Performance, project pattern |
| Routing | Next.js | (existing) | File-based routing |
| State management | Zustand | (existing) | Project standard |
| UI components | shadcn/ui | (existing) | Card, Badge, Button, Input |
| Animations | Motion | (existing) | FadeInUp pattern |

**No new dependencies required.** All functionality achievable with existing project stack.
