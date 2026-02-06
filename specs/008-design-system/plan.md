# Implementation Plan: Design System & Foundation

**Branch**: `008-design-system` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-design-system/spec.md`

## Summary

Создание frontend фундамента проекта Viably: дизайн-система с токенами (цвета, типографика, отступы, тени), поддержкой light/dark тем, базовыми UI-компонентами (Button, Card, Input, Badge), layout-системой (navbar, sidebar, main content), и утилитами анимаций (glow orbs, shimmer, fade-in-up). Frontend — Next.js 16 с App Router, Tailwind CSS v4, shadcn/ui, motion (framer-motion).

**Technical Approach**: Greenfield frontend проект. shadcn/ui как основа компонентов с кастомизацией под наш бренд (purple #7C3AED). CSS variables для design tokens, next-themes для переключения тем, motion для анимаций. Mock data без бэкенд-интеграции.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Node.js 18+
**Primary Dependencies**: Next.js 16.x, Tailwind CSS v4.1, shadcn/ui (latest CLI), motion (ex framer-motion), next-themes 0.4.6, class-variance-authority 0.7.1, clsx 2.1.1, tailwind-merge 3.4.0, lucide-react, zustand 5.x
**Storage**: localStorage (theme preference), N/A для БД
**Testing**: TypeScript type-check (`tsc --noEmit`), ESLint, `next build`
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 versions), mobile 320px+
**Project Type**: Web application (frontend only)
**Performance Goals**: LCP <2.5s, theme switch <300ms, 60fps animations
**Constraints**: WCAG 2.1 AA contrast, min 44px touch targets, prefers-reduced-motion support
**Scale/Scope**: MVP, mock data, 4 base components, navbar + sidebar layout, 3 animation utilities

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | PASS | Изучены frontend README, docs/frontend/, существующие спеки, backend patterns |
| II. Single Source of Truth | PASS | Design tokens в globals.css, компоненты в components/ui/, типы в types/ |
| III. Library-First Development | PASS | shadcn/ui, next-themes, motion, CVA, tailwind-merge — все готовые библиотеки |
| IV. Code Reuse & DRY | PASS | shadcn/ui как база, cn() утилита, переиспользуемые layout компоненты |
| V. Strict Type Safety | PASS | TypeScript strict mode, explicit prop types для компонентов |
| VI. Atomic Task Execution | PLAN | 6 задач: setup, tokens, typography, components, layout, animations |
| VII. Quality Gates | PLAN | type-check + build + lint перед каждым коммитом |
| VIII. Progressive Specification | PASS | Spec -> Plan -> Tasks -> Implement |
| IX. Error Handling | PLAN | Graceful degradation для шрифтов, анимаций, JS-disabled |
| X. Observability | N/A | Frontend MVP, mock data, нет серверной логики |
| XI. Accessibility | PASS | WCAG 2.1 AA, keyboard nav, screen reader labels, reduced motion |

**Post-Design Re-check**: All gates passed

## Project Structure

### Documentation (this feature)

```text
specs/008-design-system/
├── plan.md              # This file
├── research.md          # Phase 0: library decisions
├── data-model.md        # Phase 1: design tokens schema, component interfaces
├── quickstart.md        # Phase 1: developer setup guide
├── contracts/
│   └── components.md    # Phase 1: component API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── globals.css          # Design tokens (CSS variables), Tailwind imports
│   ├── layout.tsx           # Root layout (ThemeProvider, fonts, metadata)
│   ├── page.tsx             # Home redirect
│   ├── fonts.ts             # Font declarations (Space Grotesk, Inter, JetBrains Mono)
│   └── dev/
│       └── components/
│           └── page.tsx     # Component preview page (dev only)
├── components/
│   ├── ui/                  # Base UI components (shadcn/ui customized)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── glow-orbs.tsx    # Animated background orbs
│   │   └── shimmer.tsx      # Loading skeleton shimmer
│   ├── layout/
│   │   ├── navbar.tsx       # Sticky glass navbar
│   │   ├── main-layout.tsx  # Page wrapper (navbar + content)
│   │   └── sidebar.tsx      # Collapsible sidebar
│   └── motion/
│       └── fade-in-up.tsx   # Scroll-triggered fade animation
├── lib/
│   ├── utils.ts             # cn() helper (clsx + tailwind-merge)
│   └── animations.ts        # Animation config/variants for motion
├── stores/
│   └── theme.ts             # Theme state (zustand, optional beyond next-themes)
├── types/
│   └── index.ts             # Shared TypeScript types
├── public/
│   └── images/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json          # shadcn/ui config
└── .env.example
```

**Structure Decision**: Frontend-only структура в директории `frontend/`. Next.js 16 App Router с `app/` директорией. Компоненты организованы по назначению: `ui/` (базовые), `layout/` (структурные), `motion/` (анимации).

## Complexity Tracking

*No violations -- all principles pass*

## Design Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research | [research.md](./research.md) | Complete |
| Data Model | [data-model.md](./data-model.md) | Complete |
| Component Contracts | [contracts/components.md](./contracts/components.md) | Complete |
| Quickstart | [quickstart.md](./quickstart.md) | Complete |

## Implementation Components

### 1. Project Setup
- Next.js 16 initialization with App Router
- Tailwind CSS v4.1 + PostCSS configuration
- shadcn/ui initialization (new-york style, zinc base, CSS variables)
- TypeScript strict mode
- ESLint configuration

### 2. Design Tokens
- CSS custom properties in globals.css (light + dark)
- oklch color space for shadcn/ui compatibility
- Custom brand tokens (purple primary #7C3AED, gradients)
- Tailwind @theme inline mapping
- Spacing, shadow, border-radius, transition tokens

### 3. Typography
- Space Grotesk (headings, weight 600-700)
- Inter (body text, weight 400-500)
- JetBrains Mono (code, weight 400-500)
- next/font/google with CSS variables
- Tailwind fontFamily extension

### 4. Base Components (shadcn/ui customized)
- Button: primary (gradient), secondary, ghost, danger variants
- Card: hover elevation + gradient top border
- Input: focus ring with primary color
- Badge: primary, success, warning, neutral variants
- All: theme-aware, accessible, keyboard-navigable

### 5. Layout System
- Navbar: sticky, glass-blur, logo + tabs + credits + avatar
- Main Layout: max-width 1280px, centered, responsive
- Sidebar: collapsible, 280-360px, for generation/settings pages
- Mobile: hamburger menu at <768px

### 6. Animation Utilities
- Glow Orbs: decorative blur circles, mouse-following (motion)
- Shimmer: gradient sweep skeleton loading
- Fade-in-up: scroll-triggered with useInView (motion)
- prefers-reduced-motion: disable all animations

## Next Steps

Run `/speckit.tasks` to generate atomic tasks from this plan.
