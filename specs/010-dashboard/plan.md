# Implementation Plan: Dashboard

**Branch**: `010-dashboard` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-dashboard/spec.md`

## Summary

Dashboard — главная страница после входа в Viably. Включает welcome card с персональным приветствием и статистикой аккаунта (count-up анимация), секцию быстрых действий (шаблоны Shop Bot / FAQ Bot), список недавних проектов (до 3 карточек + empty state), карточку daily bonus со streak-системой и прогресс-баром. Все секции появляются с staggered fadeInUp анимацией. MVP работает на mock data без бэкенда.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3
**Primary Dependencies**: Next.js 16.1.6, Tailwind CSS v4, shadcn/ui (new-york), motion 12.33, zustand 5.x, lucide-react
**Storage**: localStorage (daily bonus persist), mock data в zustand store
**Testing**: `npm run type-check` (tsc --noEmit), `npm run build`, `npm run lint`
**Target Platform**: Web (desktop + mobile, 320px — 2560px)
**Project Type**: Web application (frontend-only для этого модуля)
**Performance Goals**: 60fps анимации, <2s загрузка dashboard, <100ms interaction response
**Constraints**: Client-side only (no backend integration for MVP), mock data
**Scale/Scope**: 1 страница, 4 секции, 2 zustand stores, 4 компонента, 2 утилиты

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Исследована кодовая база: stores, components, patterns, CSS tokens |
| II. Single Source of Truth | PASS | Типы в types/index.ts, токены в globals.css |
| III. Library-First | PASS | Исследованы react-countup, timeago.js, react-confetti. Все отклонены — custom код <20 строк в каждом случае |
| IV. Code Reuse & DRY | PASS | Переиспользуются: FadeInUp, MainLayout, Card, Badge, Button, Shimmer, animations.ts |
| V. Strict Type Safety | PASS | strict mode, все типы явные, no `any` |
| VI. Atomic Task Execution | PASS | Каждая задача — 1 компонент/утилита, независимо тестируема |
| VII. Quality Gates | PASS | type-check + build + lint перед коммитом |
| VIII. Progressive Spec | PASS | spec → plan → tasks → implement |
| IX. Error Handling | PASS | Loading/error states, skeleton UI |
| X. Observability | N/A | Frontend-only, no server logging |
| XI. Accessibility | PASS | reduced motion support, keyboard nav, semantic HTML, ARIA labels |

**Post-Phase 1 Re-check**: PASS — все решения соответствуют конституции, нет нарушений.

## Project Structure

### Documentation (this feature)

```text
specs/010-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output — library decisions
├── data-model.md        # Phase 1 output — entity definitions
├── quickstart.md        # Phase 1 output — dev setup guide
├── contracts/
│   └── dashboard-api.md # Phase 1 output — API contracts & store contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   └── dashboard/
│       └── page.tsx                    # MODIFY: Dashboard page assembly
├── components/
│   └── dashboard/
│       ├── welcome-card.tsx            # NEW: Welcome card + stat cards
│       ├── quick-actions.tsx           # NEW: Template shortcut cards
│       ├── recent-projects.tsx         # NEW: Project grid + empty state
│       └── daily-bonus.tsx             # NEW: Bonus card + streak + progress
├── hooks/
│   └── use-count-up.ts                # NEW: Count-up animation hook
├── lib/
│   ├── api/
│   │   └── dashboard.ts               # NEW: Mock API functions
│   └── utils/
│       └── format-relative-time.ts     # NEW: Relative time formatter
├── stores/
│   ├── dashboard.ts                    # NEW: User + projects state
│   └── daily-bonus.ts                  # NEW: Bonus state (persist)
└── types/
    └── index.ts                        # MODIFY: Add dashboard types
```

**Structure Decision**: Frontend-only модуль. Все новые файлы в `frontend/` следуя существующей структуре: компоненты в `components/{domain}/`, стейт в `stores/`, мок в `lib/api/`, утилиты в `lib/utils/`, типы в `types/`.

## Key Design Decisions

### 1. Custom useCountUp vs react-countup

**Decision**: Custom hook (~15 строк)
**Why**: requestAnimationFrame + easeOutCubic. Библиотека react-countup — 16KB bundle для функционала, реализуемого за 15 строк. Порог Library-First: >20 строк.

### 2. formatRelativeTime vs timeago.js

**Decision**: Custom utility с Intl.RelativeTimeFormat (~15 строк)
**Why**: Нативный браузерный API, русская локализация бесплатно. Без зависимости.

### 3. Daily Bonus — zustand persist vs чистый localStorage

**Decision**: Zustand с persist middleware
**Why**: Реактивность (UI обновляется автоматически), консистентный паттерн с sidebar store, persist — встроенная часть zustand.

### 4. Claim Animation — glow-pulse vs confetti

**Decision**: CSS glow-pulse (уже в globals.css)
**Why**: Zero dependencies, уже в дизайн-системе, визуально достаточно для MVP.

### 5. Mock Data — в store vs отдельный API файл

**Decision**: Mock API в `lib/api/dashboard.ts`, store вызывает эти функции
**Why**: Паттерн из `lib/api/auth.ts`. При подключении реального API достаточно заменить функции в одном файле.

## Implementation Order

```
T01: Types & Interfaces          ← foundation, blocks all
T02: Mock API                    ← depends on T01
T03: Dashboard Store             ← depends on T01, T02
T04: Daily Bonus Store           ← depends on T01
T05: useCountUp Hook             ← independent utility
T06: formatRelativeTime          ← independent utility
T07: Welcome Card                ← depends on T03, T05
T08: Recent Projects             ← depends on T03, T06
T09: Quick Actions               ← depends on T01
T10: Daily Bonus Component       ← depends on T04
T11: Dashboard Page Assembly     ← depends on T07-T10
T12: Responsive & Polish         ← depends on T11
```

**Parallelization**:
- T05, T06 — параллельно (независимые утилиты)
- T07, T08, T09, T10 — параллельно (независимые компоненты, разные stores)
- T01 → T02 → T03/T04 → T07-T10 → T11 → T12 (critical path)

## Complexity Tracking

Нет нарушений конституции — таблица пуста.
