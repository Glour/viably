# Implementation Plan: Templates Gallery

**Branch**: `011-templates-gallery` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-templates-gallery/spec.md`

## Summary

Галерея шаблонов ботов — клиентский модуль Next.js с 6 mock-шаблонами, поиском с debounce, фильтрами-вкладками (pill tabs), адаптивной сеткой карточек с hover-анимациями, детальной страницей шаблона с проверкой кредитов. Полностью client-side для MVP, без новых зависимостей — всё на существующем стеке (Next.js 16, Zustand 5, Tailwind v4, shadcn/ui, Motion).

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Node.js 18+
**Primary Dependencies**: Next.js 16.1.6, Zustand 5.x, Tailwind CSS v4, shadcn/ui (radix-ui), Motion 12.33, Lucide React
**Storage**: N/A (mock data в коде, без localStorage)
**Testing**: `npm run type-check` (tsc --noEmit), `npm run build`, `npm run lint`
**Target Platform**: Web (desktop + tablet + mobile, 320px — 2560px)
**Project Type**: Web application (frontend-only module)
**Performance Goals**: UI отклик < 100мс, debounce 300мс на поиске
**Constraints**: Нет новых зависимостей, клиентская фильтрация (6 элементов)
**Scale/Scope**: 2 страницы, ~8 новых компонентов/файлов, 1 модификация существующего файла types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | PASS | Исследован весь frontend: types, stores, API, components, hooks, layout |
| II. Single Source of Truth | PASS | Типы в `types/index.ts`, данные в `lib/data/templates.ts` |
| III. Library-First Development | PASS | Проверено: нет библиотек >70% покрытия для debounce (7 строк). Все остальное — существующий стек |
| IV. Code Reuse & DRY | PASS | Reuse: MainLayout, FadeInUp, Card, Badge, Button, Input, Shimmer, cn() |
| V. Strict Type Safety | PASS | Все типы в types/index.ts, strict mode, no `any` |
| VI. Atomic Task Execution | PASS | 13 атомарных задач, каждая независимо тестируема |
| VII. Quality Gates | PASS | type-check + build + lint перед каждым коммитом |
| VIII. Progressive Specification | PASS | spec → plan → tasks → implement |
| IX. Error Handling | PASS | Union types для API responses, empty state для фильтрации |
| X. Observability | N/A | Клиентский MVP, нет серверной логики |
| XI. Accessibility | PASS | Keyboard navigation, ARIA labels, focus management, prefers-reduced-motion |

**Gate result: PASS** — Нет нарушений.

### Post-Design Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| II. Single Source of Truth | PASS | Типы централизованы, mock data в одном файле |
| III. Library-First | PASS | useDebounce = 7 строк custom, всё остальное — existing libraries |
| IV. Code Reuse | PASS | Максимальное переиспользование существующих компонентов |
| V. Type Safety | PASS | Контракт типов определён в contracts/templates-api.md |

## Project Structure

### Documentation (this feature)

```text
specs/011-templates-gallery/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity model
├── quickstart.md        # Phase 1: implementation guide
├── contracts/
│   └── templates-api.md # Phase 1: API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   └── templates/
│       ├── page.tsx                    # Gallery page (MODIFY existing stub)
│       └── [slug]/
│           └── page.tsx                # Template detail page (NEW)
├── components/
│   └── templates/
│       ├── template-card.tsx           # Card component (NEW)
│       ├── template-detail.tsx         # Detail view component (NEW)
│       ├── search-bar.tsx              # Search input with icon (NEW)
│       ├── filter-tabs.tsx             # Pill-style filter tabs (NEW)
│       └── empty-state.tsx             # No results / not found state (NEW)
├── hooks/
│   └── use-debounce.ts                # Debounce value hook (NEW)
├── lib/
│   ├── api/
│   │   └── templates.ts               # Mock API functions (NEW)
│   └── data/
│       └── templates.ts               # Static mock data — 6 templates (NEW)
├── stores/
│   └── templates.ts                   # Zustand store with filtering (NEW)
└── types/
    └── index.ts                       # Add Template types (MODIFY)
```

**Structure Decision**: Frontend-only module. Следует существующей структуре проекта: типы в `types/`, stores в `stores/`, компоненты сгруппированы по домену в `components/templates/`, страницы в `app/templates/`. Данные в `lib/data/`, mock API в `lib/api/`.

## Complexity Tracking

> Нет нарушений — таблица не заполняется.
