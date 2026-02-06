# Implementation Plan: Settings Pages

**Branch**: `014-settings-pages` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-settings-pages/spec.md`

## Summary

Build the settings module — four settings pages (Profile, Billing/Credits, Plan, Theme) accessible via a sidebar layout. Profile page: avatar upload with drag-and-drop preview, name editing, password change with strength indicator. Billing page: credit balance display with gradient text, buy credits modal with packages, transaction history with filters and infinite scroll. Plan page: current plan card with usage stats, plan comparison grid. Theme page: radio cards with previews for Light/Dark/System themes. Sidebar navigation on desktop, horizontal tabs on mobile. All data is mock for MVP.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3
**Primary Dependencies**: Next.js 16.1.6, Tailwind CSS v4, shadcn/ui (radix-ui), motion 12.33, zustand 5.x, react-hook-form 7.71+, zod 4.3+, next-themes 0.4.6, lucide-react, sonner 2.0.7
**Storage**: localStorage (theme via next-themes), in-memory state (zustand)
**Testing**: Type-check (`tsc --noEmit`), build (`next build`)
**Target Platform**: Web (desktop + mobile responsive, breakpoint md=768px)
**Project Type**: Web application (frontend-only, Next.js App Router)
**Performance Goals**: Section navigation <1s (SC-001), theme change <500ms (SC-006), modal open <500ms (SC-005)
**Constraints**: No backend integration for MVP, all data mocked, no new npm packages needed
**Scale/Scope**: 4 new pages, 1 layout, ~11 new components, 1 new store, 1 new API module, 1 new data module, 1 new validation module, 0 new npm packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Full codebase exploration done: read all existing components, stores, types, patterns, layouts, validations |
| II. Single Source of Truth | PASS | All new types go to `types/index.ts`, reuse existing `UserProfile`, `NavItem`. Validations in `lib/validations/settings.ts` |
| III. Library-First | PASS | No new libraries needed — existing stack covers all requirements (research.md R-001) |
| IV. Code Reuse & DRY | PASS | Reusing PasswordStrength, MainLayout, Navbar, Form, Dialog, Card, Badge, Tabs, FadeInUp + shared hooks |
| V. Strict Type Safety | PASS | All types defined in data-model.md, no `any` usage planned |
| VI. Atomic Task Execution | PASS | Tasks designed as independent, committable units |
| VII. Quality Gates | PASS | Type-check + build before every commit |
| VIII. Progressive Specification | PASS | Spec → Plan → Tasks flow followed |
| IX. Error Handling | PASS | Typed response unions for all API calls, toast notifications for success/error |
| X. Observability | N/A | Frontend-only, no server-side logging needed for MVP |
| XI. Accessibility | PASS | Keyboard nav in sidebar/tabs, ARIA labels, min 44px mobile tap targets, reduced motion support, theme contrast checks |

**Post-Phase 1 re-check**: All gates still pass. No violations needed.

## Project Structure

### Documentation (this feature)

```text
specs/014-settings-pages/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: library decisions, codebase reuse analysis
├── data-model.md        # Phase 1: types, state, transitions
├── quickstart.md        # Phase 1: setup & dev workflow
├── contracts/
│   └── settings-api.md  # Phase 1: API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/(main)/settings/
│   ├── layout.tsx                          # Settings layout with sidebar nav
│   ├── page.tsx                            # Redirect to /settings/profile
│   ├── profile/
│   │   └── page.tsx                        # Profile settings page
│   ├── billing/
│   │   └── page.tsx                        # Billing & credits page
│   ├── plan/
│   │   └── page.tsx                        # Plan settings page
│   └── theme/
│       └── page.tsx                        # Theme settings page
├── components/settings/
│   ├── settings-sidebar.tsx                # Sidebar nav (desktop) + tabs (mobile)
│   ├── profile-info-form.tsx               # Name + avatar form
│   ├── change-password-form.tsx            # Password change + strength indicator
│   ├── credit-balance-card.tsx             # Balance display + buy button
│   ├── buy-credits-modal.tsx               # Credit packages modal
│   ├── transaction-history.tsx             # Transaction list + filters
│   ├── transaction-row.tsx                 # Single transaction row
│   ├── current-plan-card.tsx               # Current plan info card
│   ├── plan-comparison.tsx                 # All plans comparison grid
│   ├── plan-card.tsx                       # Individual plan pricing card
│   └── theme-selector.tsx                  # Theme radio cards with previews
├── lib/
│   ├── api/settings.ts                     # Mock API functions
│   ├── data/settings.ts                    # Mock data (transactions, plans, packages)
│   └── validations/settings.ts             # Zod schemas (profile, password, credits)
├── stores/
│   └── settings.ts                         # Zustand settings store
└── types/
    └── index.ts                            # New types appended
```

**Structure Decision**: Follows existing frontend project structure. New components in `components/settings/` (parallel to `components/projects/`, `components/templates/`, `components/generation/`). New pages in App Router at `app/(main)/settings/` using nested layout pattern. Store, API, data, and validation modules follow established patterns.

## Component Architecture

```
layout.tsx (Settings Layout)
├── MainLayout (reused)
│   └── Navbar (reused, already has Settings navigation)
│
├── SettingsSidebar [desktop: sidebar | mobile: horizontal tabs]
│   ├── Profile link (icon: User)
│   ├── Billing link (icon: CreditCard)
│   ├── Plan link (icon: Crown)
│   └── Theme link (icon: Palette)
│
└── {children} ← page content

profile/page.tsx
├── FadeInUp
│   └── ProfileInfoForm
│       ├── Avatar upload (circle, click/drag-drop)
│       ├── Name input (react-hook-form + zod)
│       ├── Email (readonly, grayed)
│       └── Save Changes button (loading state + toast)
│
└── FadeInUp
    └── ChangePasswordForm
        ├── Current password input
        ├── New password input
        ├── PasswordStrength (reused from auth)
        ├── Confirm password input
        └── Update Password button (loading state + toast)

billing/page.tsx
├── FadeInUp
│   └── CreditBalanceCard
│       ├── Balance (JetBrains Mono, gradient text)
│       ├── Plan badge
│       ├── Daily bonus info (streak)
│       └── Buy Credits button → opens BuyCreditsModal
│
├── BuyCreditsModal (Dialog)
│   ├── Package cards (50/100/250 credits)
│   ├── Custom amount input
│   └── Payment method (placeholder)
│
└── FadeInUp
    └── TransactionHistory
        ├── Filter tabs (All / Earned / Spent / Purchased)
        └── Transaction list
            └── TransactionRow (per entry)
                ├── Amount (green +, red -)
                ├── Description
                └── Relative timestamp

plan/page.tsx
├── FadeInUp
│   └── CurrentPlanCard
│       ├── Plan name + gradient badge
│       ├── Features list
│       ├── Usage stats (projects, credits)
│       └── Renewal date
│
└── FadeInUp
    └── PlanComparison
        └── PlanCard (per plan)
            ├── Plan name + price
            ├── Features list
            ├── Current plan highlight
            └── Upgrade/Downgrade button | Contact Us

theme/page.tsx
└── FadeInUp
    └── ThemeSelector
        ├── Radio Card: Light (preview + description)
        ├── Radio Card: Dark (preview + description)
        └── Radio Card: System (preview + description)
```

## Dependency Graph (task ordering)

```
[Types]          [Mock Data]        [Validations]
    │                 │                    │
    └────────┬────────┘                    │
             │                             │
        [Settings Store]                   │
             │                             │
        [API Layer] ←──────────────────────┘
             │
    ┌────────┼────────────────────────┐
    │        │                        │
[Settings Sidebar]                    │
    │                                 │
[Settings Layout + Redirect]          │
    │                                 │
    ├────────────────────┐            │
    │                    │            │
[Profile Forms]    [Billing Components]    [Plan Components]    [Theme Selector]
    │                    │                       │                    │
[Profile Page]     [Billing Page]          [Plan Page]         [Theme Page]
    │                    │                       │                    │
    └────────────────────┴───────────────────────┴────────────────────┘
                                   │
                          [Navbar Integration]
                                   │
                          [Mobile Adaptation]
```

## Key Design Decisions

### 1. Settings Layout with Nested Routes

**Decision**: Use Next.js `app/(main)/settings/layout.tsx` with nested page routes.
**Rationale**: Standard App Router pattern. Sidebar renders in layout, content changes per route. Each settings section is a separate URL (`/settings/profile`, `/settings/billing`, etc.), enabling direct linking and browser back/forward navigation.

### 2. Sidebar Desktop / Tabs Mobile

**Decision**: Single `SettingsSidebar` component that renders sidebar on `md:` and above, horizontal tabs below.
**Rationale**: Matches the spec requirement. Uses responsive Tailwind classes (`hidden md:block` for sidebar, `md:hidden` for tabs). Reuses shadcn `Tabs` component for mobile.

### 3. Separate Store for Settings

**Decision**: New `useSettingsStore` instead of extending `useDashboardStore`.
**Rationale**: Dashboard store handles summary data for the dashboard page. Settings store handles detailed profile editing, transaction history, and plan management — different concerns with different loading patterns. Keeps stores focused.

### 4. Reuse PasswordStrength from Auth

**Decision**: Reuse `components/auth/password-strength.tsx` in change password form.
**Rationale**: Identical functionality needed. Component is already well-built with ARIA labels and 4-level scoring. No modifications required.

### 5. Avatar Upload: Native Approach

**Decision**: Use native `<input type="file" accept="image/*">` with drag-and-drop events.
**Rationale**: Only single file upload needed. Client-side preview via `FileReader.readAsDataURL()`. File type and size validation in Zod-like check before preview. <20 lines of code, no library needed.

### 6. Transaction History: Infinite Scroll

**Decision**: Simple "load more" button (not IntersectionObserver) for MVP.
**Rationale**: Mock data is limited (20-30 entries). A simple "Load More" button at the bottom is sufficient and simpler than IntersectionObserver. Can upgrade to true infinite scroll when connecting to real backend.

### 7. Theme Settings: next-themes Direct Integration

**Decision**: Theme page calls `useTheme()` from `next-themes` directly, no store needed.
**Rationale**: Theme state is already managed by `next-themes` with localStorage persistence. Adding it to a zustand store would create unnecessary duplication. The theme page is purely a UI wrapper around `setTheme()`.

### 8. Route Group: (main)

**Decision**: Place settings under `app/(main)/settings/` route group.
**Rationale**: Settings pages share the main layout (Navbar + content area) with dashboard, templates, and projects. The `(main)` route group is the existing pattern for authenticated app pages. Note: if `(main)` group doesn't exist yet, it will be created as part of the layout task.
