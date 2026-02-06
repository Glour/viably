# Tasks: Design System & Foundation

**Input**: Design documents from `/specs/008-design-system/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/components.md, quickstart.md

**Tests**: Not requested in feature specification. Quality gates: `type-check`, `build`, `lint`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US4)
- Paths relative to `frontend/` directory

---

## Phase 0: Planning (Executor Assignment)

**Purpose**: Prepare for implementation by analyzing requirements and assigning executors.

- [x] P001 Analyze all tasks and identify required agent types and capabilities
- [x] P002 Create missing agents using meta-agent-v3 (launch N calls in single message), then ask user restart
- [x] P003 Assign executors to all tasks: MAIN (trivial only), existing agents (100% match), or specific agent names
- [x] P004 Resolve research tasks: simple (solve with tools now), complex (create prompts in research/)

**Rules**:
- **MAIN executor**: ONLY for trivial tasks (1-2 line fixes, simple imports, single npm install)
- **Existing agents**: ONLY if 100% capability match
- **Agent creation**: Launch all meta-agent-v3 calls in single message for parallel execution
- **After P002**: Must restart claude-code before proceeding to P003

**Artifacts**:
- Updated tasks.md with [EXECUTOR: name] annotations
- .claude/agents/{domain}/{type}/{name}.md (if new agents created)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Next.js project with all dependencies and configuration.

- [x] T001 Initialize Next.js 16 project in `frontend/` directory: `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"`. Remove existing `frontend/README.md` before init. Verify `npm run dev` works.
- [x] T002 Install additional dependencies: `motion next-themes class-variance-authority clsx tailwind-merge lucide-react zustand @tanstack/react-query` and devDependency `tw-animate-css`
- [x] T003 Initialize shadcn/ui: `npx shadcn@latest init` with options: style new-york, base-color zinc, CSS variables true. Verify `components.json` created.
- [x] T004 Configure TypeScript strict mode in `tsconfig.json`: ensure `"strict": true`, add path aliases `@/*` -> `./*`
- [x] T005 [P] Create PostCSS config in `postcss.config.mjs` with `@tailwindcss/postcss` plugin per Tailwind v4 setup
- [x] T006 [P] Create `.env.example` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ENVIRONMENT` per quickstart.md
- [x] T007 [P] Add npm scripts to `package.json`: `"type-check": "tsc --noEmit"` (verify existing `dev`, `build`, `lint` scripts are correct)
- [x] T008 Verify setup: run `npm run dev`, `npm run build`, `npm run type-check`, `npm run lint` -- all must pass

-> Artifacts: [package.json](frontend/package.json), [tsconfig.json](frontend/tsconfig.json), [components.json](frontend/components.json), [globals.css](frontend/app/globals.css), [postcss.config.mjs](frontend/postcss.config.mjs), [.env.example](frontend/.env.example), [lib/utils.ts](frontend/lib/utils.ts)

**Checkpoint**: Project initialized, all tooling works. Ready for design tokens.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Design tokens, typography, and utility functions that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T009 Create design tokens in `app/globals.css`: oklch color variables for light (:root) and dark (.dark) themes per data-model.md. Include shadcn/ui standard tokens + brand-specific tokens (--primary-hover, --primary-light, --primary-subtle, --primary-glow, --gradient-main/warm/cool, --success, --warning, --info). Add `@custom-variant dark (&:is(.dark *))`. Add `@theme inline` block mapping CSS vars to Tailwind colors. Add `@layer base` with border/outline/body defaults.
- [ ] T010 Create font declarations in `app/fonts.ts`: Space Grotesk (variable --font-heading, subsets latin+cyrillic, weight 600-700), Inter (variable --font-body, subsets latin+cyrillic, weight 400-500), JetBrains Mono (variable --font-code, subsets latin, weight 400-500). Export font objects. Add font CSS variables to `@theme inline` in `app/globals.css`: `--font-heading`, `--font-body`, `--font-code`.
- [ ] T011 Configure root layout in `app/layout.tsx`: import fonts from `app/fonts.ts`, apply font CSS variables to `<html>` className, wrap children in ThemeProvider from next-themes (attribute="class", defaultTheme="system", enableSystem=true, storageKey="viably-theme"), add `suppressHydrationWarning` to `<html>`, set metadata (title "Viably", description). Set `<body>` className to `font-body antialiased`.
- [ ] T012 [P] Create `lib/utils.ts` with `cn()` helper function (clsx + tailwind-merge pattern per research.md R7)
- [ ] T013 [P] Create `types/index.ts` with shared TypeScript types: NavItem interface (label, href, icon), SidebarState interface (isOpen, toggle, open, close)
- [ ] T014 [P] Create `lib/animations.ts` with motion animation variants: fadeInUp (hidden/visible), shimmerGradient, springConfig (stiffness 300, damping 30), and reducedMotion media query check helper
- [ ] T015 [P] Create sidebar zustand store in `stores/sidebar.ts`: isOpen boolean, toggle/open/close actions per data-model.md SidebarState
- [ ] T016 Create placeholder `app/page.tsx` that redirects to `/dashboard` (or renders "Viably" heading temporarily)
- [ ] T017 Verify foundational: run `npm run build` and `npm run type-check` -- all must pass

**Checkpoint**: Design tokens, fonts, theme provider, utilities in place. Components can now use tokens.

---

## Phase 3: User Story 1 - Consistent Visual Language (Priority: P1)

**Goal**: Unified design tokens (colors, spacing, typography) that resolve correctly in both light and dark themes.

**Independent Test**: Open `/dev/components` page that renders all color swatches, font styles, and spacing scales. Each token must resolve correctly in both themes.

**FR Coverage**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008

### Implementation for User Story 1

- [ ] T018 [US1] Create theme toggle component in `components/ui/theme-toggle.tsx`: "use client" component using useTheme from next-themes, Button ghost/icon variant, Sun/Moon icons from lucide-react. Shows Moon in light mode, Sun in dark mode. Handles mounted state to avoid hydration mismatch.
- [ ] T019 [US1] Create component preview page at `app/dev/components/page.tsx`: render all design tokens (color swatches grid with token name + value + visual swatch for both themes), typography samples (heading H1-H4 in Space Grotesk, body text in Inter, code in JetBrains Mono), spacing scale visual blocks, shadow samples, border-radius samples. Include ThemeToggle at top of page. Page title "Design System Preview". Use Russian labels for user-facing text.
- [ ] T020 [US1] Verify US1: open `http://localhost:3000/dev/components`, toggle between light/dark, verify all tokens resolve in both modes. Run `npm run build`.

**Checkpoint**: User Story 1 complete - all design tokens visible and theme-switchable.

---

## Phase 4: User Story 2 - Reusable UI Components (Priority: P1)

**Goal**: Pre-built Button, Card, Input, Badge components following the design system, viewable on `/dev/components`.

**Independent Test**: Visit `/dev/components` and verify each component renders in all variants and states in both themes.

**FR Coverage**: FR-009, FR-010, FR-011, FR-012, FR-013, FR-014

### Implementation for User Story 2

- [ ] T021 [P] [US2] Add Button component via shadcn CLI `npx shadcn@latest add button` then customize `components/ui/button.tsx` per contracts/components.md: default variant uses gradient-main background with white text and hover translateY(-2px) + glow shadow; add loading prop with spinner; ensure border-radius 12px; all 5 variants (default, secondary, ghost, destructive, outline); all 4 sizes (sm, default, lg, icon); focus-visible ring with primary color; min touch target 44px on mobile; 300ms transition.
- [ ] T022 [P] [US2] Add Card component via shadcn CLI `npx shadcn@latest add card` then customize `components/ui/card.tsx` per contracts/components.md: border-radius 16px; hover animation (translateY(-4px), shadow increase, gradient top border line via ::before pseudo-element, opacity 0->1); transition 400ms cubic-bezier(0.4, 0, 0.2, 1); CardTitle uses font-heading class.
- [ ] T023 [P] [US2] Add Input component via shadcn CLI `npx shadcn@latest add input` then customize `components/ui/input.tsx` per contracts/components.md: border-radius 12px; border 1.5px; focus state with border-primary + box-shadow 0 0 0 4px primary-subtle; transition 300ms; height 40px default.
- [ ] T024 [P] [US2] Add Badge component via shadcn CLI `npx shadcn@latest add badge` then customize `components/ui/badge.tsx` per contracts/components.md: border-radius 100px (pill); font-size 13px; font-weight 600; add custom variants success (emerald bg/text) and warning (amber bg/text) in addition to default shadcn variants.
- [ ] T025 [US2] Update `/dev/components` page (`app/dev/components/page.tsx`) to render all components: Button (all variants, sizes, disabled, loading states), Card (default, hover demo), Input (default, focus, disabled, with placeholder), Badge (all variants). Show each in a labeled section with variant name.
- [ ] T026 [US2] Verify US2: open `/dev/components`, verify all components render correctly in both themes, keyboard focus indicators visible on Tab navigation. Run `npm run build` and `npm run type-check`.

**Checkpoint**: User Story 2 complete - all base components functional and preview-able.

---

## Phase 5: User Story 3 - Application Shell & Navigation (Priority: P2)

**Goal**: Navbar with logo, tabs, credits badge, theme toggle, user avatar. Responsive layout with mobile hamburger menu.

**Independent Test**: Open app, click through nav tabs, verify active state, toggle theme, test mobile hamburger.

**FR Coverage**: FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-025, FR-026, FR-027, FR-028

### Implementation for User Story 3

- [ ] T027 [US3] Create Navbar component in `components/layout/navbar.tsx` per contracts/components.md: sticky top-0 z-50; glass-blur background (backdrop-filter blur(24px) saturate(180%), bg-background/80); max-w-[1280px] container mx-auto px-6; Left: logo ("V" with gradient text + "Viably" in Space Grotesk 700); Center: nav tabs (Дашборд, Шаблоны, Проекты) using NavItem type from types/, active tab highlighted with primary color + subtle bg, use `usePathname()` for active detection; Right: credits Badge (Gem icon + "150", gradient bg), ThemeToggle, user avatar placeholder (circle with User icon). `<nav>` with `aria-label="Основная навигация"`, active tab `aria-current="page"`. Keyboard navigable.
- [ ] T028 [US3] Add mobile responsive behavior to Navbar: hamburger menu button (Menu icon) visible at <768px (md breakpoint), nav tabs hidden at <768px. Mobile menu: full-width overlay below navbar with nav items stacked vertically, `aria-expanded` on hamburger, close on nav item click or Escape key, focus trap within open menu.
- [ ] T029 [US3] Create MainLayout component in `components/layout/main-layout.tsx` per contracts/components.md: wrapper div min-h-screen bg-background; Navbar at top; main content area as `<main>` with flex; content div flex-1 max-w-[1280px] mx-auto px-6 py-8; optional sidebar prop renders Sidebar before content.
- [ ] T030 [US3] Create Sidebar component in `components/layout/sidebar.tsx` per contracts/components.md: width 280px (collapsible to 0); surface bg; right border 1px; transition 300ms; collapse/expand button with ChevronLeft/ChevronRight icon; uses sidebar zustand store from `stores/sidebar.ts`; mobile: full-width overlay with backdrop, auto-close on route change. Accessible: aria-label, keyboard operable.
- [ ] T031 [US3] Create stub pages for navigation targets: `app/dashboard/page.tsx` ("Дашборд" heading), `app/templates/page.tsx` ("Шаблоны" heading), `app/projects/page.tsx` ("Проекты" heading). Each wrapped in MainLayout. Update `app/page.tsx` to redirect to `/dashboard`.
- [ ] T032 [US3] Verify US3: navigate between tabs (active state updates), theme toggle works, mobile hamburger opens/closes, sidebar toggles, glass blur visible on scroll. Run `npm run build` and `npm run type-check`.

**Checkpoint**: User Story 3 complete - full navigation shell functional.

---

## Phase 6: User Story 4 - Delightful Micro-Animations (Priority: P3)

**Goal**: Glow orbs, shimmer loading, fade-in-up scroll animation. All disabled with prefers-reduced-motion.

**Independent Test**: Observe glow orbs follow mouse, shimmer on loading skeleton, fade-in on scroll. Enable "Reduce motion" in OS -- all animations must stop.

**FR Coverage**: FR-021, FR-022, FR-023, FR-024

### Implementation for User Story 4

- [ ] T033 [P] [US4] Create GlowOrbs component in `components/ui/glow-orbs.tsx` per contracts/components.md: "use client"; 3 orbs (primary #7C3AED, blue #2563EB, cyan #06B6D4); fixed position z-[-1]; each orb: absolute positioned div with blur(80px), size 200-400px, opacity 0.08 (light) / 0.15 (dark via dark: modifier); float animation 8s ease-in-out infinite translateY(+/-10px) via CSS or motion animate; mouse tracking via motion useSpring with 0.8s response time; use `useMotionValue` and `useSpring` from `motion/react`. Check prefers-reduced-motion: if enabled, render static orbs without animation.
- [ ] T034 [P] [US4] Create Shimmer component in `components/ui/shimmer.tsx` per contracts/components.md: muted background rounded-md; gradient sweep animation (transparent -> muted-foreground/10 -> transparent) moving left-to-right; animation 1.5s linear infinite via CSS keyframes or motion; accept width/height/className props. Check prefers-reduced-motion: if enabled, static muted background only.
- [ ] T035 [P] [US4] Create FadeInUp component in `components/motion/fade-in-up.tsx` per contracts/components.md: "use client"; uses `useInView` from `motion/react` with `{ once: true, margin: "-100px" }`; wraps children in `motion.div` with initial `{ opacity: 0, y: 20 }` and animate to `{ opacity: 1, y: 0 }` when in view; duration 0.5s; accept delay prop. Check prefers-reduced-motion: if enabled, render children immediately without animation wrapper.
- [ ] T036 [US4] Add animation utility CSS classes to `app/globals.css`: `.animate-float` (8s ease-in-out infinite translateY), `.animate-glow-pulse` (box-shadow pulse), `.animate-shimmer` (gradient sweep). Wrap ALL animation keyframes in `@media (prefers-reduced-motion: no-preference)` so they are disabled when reduce-motion is active.
- [ ] T037 [US4] Update `/dev/components` page to include animation demos section: GlowOrbs background, Shimmer loading placeholders (3 lines), FadeInUp wrapped content blocks. Add note about reduced-motion behavior.
- [ ] T038 [US4] Verify US4: glow orbs follow mouse with delay, shimmer sweeps on skeleton, sections fade in on scroll. Enable "Reduce motion" in OS accessibility -- verify ALL animations stop. Run `npm run build` and `npm run type-check`.

**Checkpoint**: User Story 4 complete - all animations working with accessibility support.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility audit, and cleanup.

- [ ] T039 Run full quality gate: `npm run type-check && npm run build && npm run lint` -- all must pass with zero errors
- [ ] T040 Verify WCAG 2.1 AA contrast ratios: inspect all text/background combinations in both themes on `/dev/components` page, ensure 4.5:1 for normal text, 3:1 for large text. Fix any violations.
- [ ] T041 Verify keyboard navigation: Tab through all interactive elements on `/dev/components` and nav pages, ensure focus indicators visible on every focusable element. Test Enter/Space activation on buttons, Escape closes mobile menu.
- [ ] T042 Verify responsive layout: check 320px, 768px, 1024px, 1280px+ viewports. Ensure no overflow, hamburger menu works on mobile, content centered on desktop.
- [ ] T043 [P] Verify edge cases from spec.md: font fallback (disable custom fonts in DevTools), rapid theme toggle (no flicker), viewport <320px (no overlap).
- [ ] T044 Run quickstart.md validation: follow setup steps as new developer, verify all 12 checklist items pass.
- [ ] T045 Clean up any TODO comments, unused imports, console.log statements. Ensure no hardcoded color values (all via CSS variables or Tailwind classes).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────┐
                                                   │
Phase 2 (Foundational) ◄─────────────────────────┘
         │
         │ BLOCKS ALL USER STORIES
         ▼
┌────────┴────────┬──────────────┬──────────────┐
│                 │              │              │
▼                 ▼              ▼              ▼
Phase 3 (US1)   Phase 4 (US2)   Phase 5 (US3)   Phase 6 (US4)
Tokens Preview  Components     Navigation     Animations
P1              P1             P2             P3
│                 │              │              │
└────────┬────────┴──────────────┴──────────────┘
         │
         ▼
Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (Tokens Preview)**: Can start after Foundational (Phase 2). Creates theme toggle + preview page base.
- **US2 (Components)**: Depends on US1 completion (needs preview page + theme toggle). Updates `/dev/components`.
- **US3 (Navigation)**: Can start after US1 (needs theme toggle). Independent of US2.
- **US4 (Animations)**: Can start after US2 (updates `/dev/components` page). Independent of US3.

### Recommended Sequential Order (Single Developer)

Phase 1 -> Phase 2 -> Phase 3 (US1) -> Phase 4 (US2) -> Phase 5 (US3) -> Phase 6 (US4) -> Phase 7

### Parallel Opportunities

**Within Phase 1**:
- T005 + T006 + T007 can run in parallel (different files)

**Within Phase 2**:
- T012 + T013 + T014 + T015 can run in parallel (different files)

**Within Phase 4 (US2)**:
- T021 + T022 + T023 + T024 can run in parallel (different component files)

**Within Phase 6 (US4)**:
- T033 + T034 + T035 can run in parallel (different component files)

**Across Phases (Two developers)**:
- Dev A: Phase 1 -> Phase 2 (tokens, fonts, layout) -> US1 -> US2
- Dev B: Phase 2 (utils, types, store) -> US3 -> US4 -> Phase 7

---

## Parallel Example: Phase 2 Utilities

```bash
# Launch all utility tasks in parallel (different files):
Task: "Create lib/utils.ts with cn() helper"
Task: "Create types/index.ts with shared TypeScript types"
Task: "Create lib/animations.ts with motion variants"
Task: "Create stores/sidebar.ts with zustand store"
```

## Parallel Example: User Story 2 Components

```bash
# Launch all component customizations in parallel (different files):
Task: "Customize Button component in components/ui/button.tsx"
Task: "Customize Card component in components/ui/card.tsx"
Task: "Customize Input component in components/ui/input.tsx"
Task: "Customize Badge component in components/ui/badge.tsx"
```

## Parallel Example: User Story 4 Animations

```bash
# Launch all animation components in parallel (different files):
Task: "Create GlowOrbs in components/ui/glow-orbs.tsx"
Task: "Create Shimmer in components/ui/shimmer.tsx"
Task: "Create FadeInUp in components/motion/fade-in-up.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Tokens + Preview)
4. Complete Phase 4: User Story 2 (Base Components)
5. **STOP and VALIDATE**: All components render in both themes on `/dev/components`
6. Subsequent modules (auth, dashboard) can start building

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. US1 (Tokens) -> Tokens visible in preview -> **Foundation v0.1**
3. US2 (Components) -> Components usable -> **Foundation v0.2** (MVP for other modules!)
4. US3 (Navigation) -> App shell complete -> **Foundation v0.3**
5. US4 (Animations) -> Polish complete -> **Foundation v1.0**

### Suggested MVP Scope

**US1 + US2 is the minimal viable design system**. Auth screens, dashboard, and other modules need tokens and components (US1+US2) but don't need navigation (US3) or animations (US4).

---

## Task Summary

| Phase | Tasks | Stories | Parallel Opportunities |
|-------|-------|---------|----------------------|
| Setup | 8 (T001-T008) | - | 3 |
| Foundational | 9 (T009-T017) | - | 4 |
| US1 Tokens | 3 (T018-T020) | US1 | 0 |
| US2 Components | 6 (T021-T026) | US2 | 4 |
| US3 Navigation | 6 (T027-T032) | US3 | 0 |
| US4 Animations | 6 (T033-T038) | US4 | 3 |
| Polish | 7 (T039-T045) | - | 1 |
| **Total** | **45** | **4** | **15** |

---

## Notes

- [P] tasks = different files, no dependencies
- No tests requested -- quality via type-check + build + lint
- Commit after each task or logical group
- All user-facing text in Russian (Дашборд, Шаблоны, Проекты)
- Component names and code in English
- Primary color: #7C3AED (purple)
- Stop at any checkpoint to validate story independently
- `/dev/components` is development-only route (exclude in production build if needed)
