# Research: Design System & Foundation

**Feature Branch**: `008-design-system`
**Date**: 2026-02-06

## Research Questions

### R1. Frontend Framework: Next.js Version

**Decision**: Next.js 16.x (latest stable)

**Rationale**:
- Next.js 16.1 — стабильная версия (релиз Dec 2025)
- React 19 support (required), Turbopack stable
- React Compiler стабилен — автоматическая мемоизация
- Turbopack по умолчанию для dev и build — значительно быстрее Webpack
- ~14.7M weekly downloads, активная поддержка Vercel

**Alternatives considered**:
- Next.js 14 (указан в frontend/README.md) — устарел, Next.js 16 уже stable
- Next.js 15 — промежуточная версия, 16 предпочтительнее
- Vite + React — нет SSR из коробки, нет App Router, меньше экосистема

**Library**: `next@latest` (16.x), `react@latest` (19.x), `react-dom@latest` (19.x)

---

### R2. CSS Framework: Tailwind CSS Version

**Decision**: Tailwind CSS v4.1

**Rationale**:
- 5x быстрее full builds, 100x быстрее incremental builds
- Упрощённая настройка — zero configuration
- @theme directive для CSS variables (вместо tailwind.config.ts)
- oklch color space — perceptually uniform
- Modern CSS features: cascade layers, @property, color-mix()
- Полная совместимость с Next.js 16

**Alternatives considered**:
- Tailwind CSS v3.4 (указан в frontend/README.md) — устарел, v4 stable с апреля 2025
- CSS Modules — нет utility-first подхода, больше кода
- styled-components — runtime CSS-in-JS, хуже производительность с RSC

**Breaking changes от v3**:
- Конфигурация через CSS @theme вместо tailwind.config.ts
- PostCSS плагин: `@tailwindcss/postcss` вместо `tailwindcss`
- Импорт: `@import "tailwindcss"` вместо `@tailwind base/components/utilities`
- tailwind-merge v3.4.0 для совместимости с v4

**Library**: `tailwindcss@latest` (v4.1), `@tailwindcss/postcss`, `tailwind-merge@^3.4.0`

---

### R3. UI Component Library

**Decision**: shadcn/ui (latest CLI) с Radix UI

**Rationale**:
- Компоненты копируются в проект (полный контроль)
- Кастомизация через CSS variables
- Unified Radix UI package (Feb 2026) — одна зависимость вместо множества @radix-ui/react-*
- new-york стиль — более чёткий, подходит для SaaS
- 1729+ code snippets в документации, активная разработка

**Alternatives considered**:
- Ant Design — тяжёлый bundle, менее гибкая кастомизация
- Chakra UI — runtime CSS-in-JS, хуже совместимость с RSC
- Headless UI — меньше готовых компонентов
- MUI — Material Design aesthetic, не подходит под бренд

**Initialization**: `npx shadcn@latest init` → style: new-york, base-color: zinc, CSS variables: true

**Library**: `shadcn@latest` (CLI), `radix-ui` (unified package)

---

### R4. Dark Mode / Theme Switching

**Decision**: next-themes 0.4.6

**Rationale**:
- ~4.87M weekly downloads, де-факто стандарт для Next.js
- "Perfect dark mode in 2 lines of code"
- Поддержка system preference, localStorage persistence
- Нет flash of unstyled content (инжектирует скрипт в <head>)
- `attribute="class"` — совместимо с Tailwind dark: variant
- shadcn/ui рекомендует next-themes для theming

**Compatibility Note**: Последний релиз ~1 год назад (0.4.6). Используется в тысячах Next.js проектов. Если возникнут проблемы с Next.js 16, альтернатива — custom ThemeProvider (15-20 строк).

**Alternatives considered**:
- Custom ThemeProvider — работает, но next-themes решает edge cases (SSR flicker, system preference, persistence)
- CSS-only prefers-color-scheme — нет ручного переключения

**Library**: `next-themes@^0.4.6`

---

### R5. Animation Library

**Decision**: motion (ex framer-motion)

**Rationale**:
- Framer Motion ребрендинг в "Motion" — новый пакет, активная разработка
- ~18M monthly downloads, самая популярная React animation library
- `useInView` для scroll-triggered animations
- Spring physics для glow orb mouse tracking
- Layout animations для smooth transitions
- Совместимость с React 19 и Next.js 16

**Import change**: `import { motion } from "motion/react"` (вместо `framer-motion`)

**Alternatives considered**:
- CSS animations only — недостаточно для mouse-following glow orbs
- GSAP — тяжелее, коммерческая лицензия для некоторых features
- react-spring — менее популярен, меньше документации
- anime.js — не React-native, нет hooks

**Library**: `motion@latest`

---

### R6. Component Variant Management

**Decision**: class-variance-authority (CVA) 0.7.1

**Rationale**:
- ~7-13M weekly downloads, стандарт для shadcn/ui
- Type-safe variant definitions
- Zero runtime overhead
- Идеальная интеграция с Tailwind CSS

**Alternatives considered**:
- Stitches variants — deprecated
- Custom if/else className logic — не type-safe, verbose

**Library**: `class-variance-authority@^0.7.1`

---

### R7. Utility Libraries

**Decision**: clsx 2.1.1 + tailwind-merge 3.4.0

**Rationale**:
- clsx (239 bytes) — conditional className construction, ~20M+ weekly downloads
- tailwind-merge — intelligent Tailwind class merging, ~10M+ weekly downloads
- Вместе используются в `cn()` utility (shadcn/ui pattern)

**cn() pattern**:
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Library**: `clsx@^2.1.1`, `tailwind-merge@^3.4.0`

---

### R8. Typography / Font Loading

**Decision**: next/font/google с Space Grotesk, Inter, JetBrains Mono

**Rationale**:
- next/font/google — встроен в Next.js, zero layout shift
- Шрифты самохостятся (скачиваются при build), нет внешних запросов
- CSS variables для интеграции с Tailwind

**Font assignments**:
- Space Grotesk → `--font-heading` → headings (weight 600-700, letter-spacing -0.03em)
- Inter → `--font-body` → body text (weight 400-500)
- JetBrains Mono → `--font-code` → code blocks (weight 400-500)

**Alternatives considered**:
- fontsource — хорошо, но next/font встроен и оптимизирован
- @font-face manual — больше boilerplate, нет CLS protection

---

### R9. State Management

**Decision**: zustand 5.x для client state, TanStack Query v5 для server state (в будущих модулях)

**Rationale**:
- zustand: ~14.4M weekly downloads, minimal boilerplate, no providers
- Для design system нужен только theme state (и то покрыт next-themes)
- Sidebar state (open/closed) — zustand store
- TanStack Query v5 — подготовить QueryProvider, использовать в следующих модулях

**Scope для 008**: Только zustand для sidebar/UI state. next-themes для theme. TanStack Query install но без использования.

**Library**: `zustand@^5.0.0`, `@tanstack/react-query@^5.0.0`

---

### R10. Icons

**Decision**: lucide-react

**Rationale**:
- Рекомендован shadcn/ui
- Tree-shakeable (только используемые иконки в bundle)
- Consistent design language
- ~10M+ weekly downloads

**Library**: `lucide-react@latest`

---

## Dependencies Summary

**New (to install)**:
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^16.0.0 | Framework |
| react | ^19.0.0 | UI library |
| react-dom | ^19.0.0 | React DOM |
| tailwindcss | ^4.1.0 | CSS framework |
| @tailwindcss/postcss | latest | PostCSS integration |
| motion | latest | Animations |
| next-themes | ^0.4.6 | Theme switching |
| class-variance-authority | ^0.7.1 | Component variants |
| clsx | ^2.1.1 | Conditional classes |
| tailwind-merge | ^3.4.0 | Class merging |
| lucide-react | latest | Icons |
| zustand | ^5.0.0 | Client state |
| @tanstack/react-query | ^5.0.0 | Server state (future) |

**Development**:
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.0.0 | Type checking |
| @types/react | latest | React types |
| @types/react-dom | latest | React DOM types |
| eslint | latest | Linting |
| eslint-config-next | latest | Next.js ESLint rules |
| tw-animate-css | latest | shadcn/ui animation utilities |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| next-themes incompatible с Next.js 16 | Medium | Fallback: custom ThemeProvider (15-20 строк) |
| Tailwind v4 breaking changes | Low | tailwind-merge v3.4 уже совместим, shadcn/ui поддерживает v4 |
| shadcn/ui Radix migration | Low | Используем unified radix-ui package с самого начала |
| motion package transition | Low | Новые imports из `motion/react`, документация актуальна |
| Шрифт не загрузился | Low | System font fallbacks (sans-serif, monospace) |
