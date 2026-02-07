# Implementation Plan: Data Hooks (React Query Integration)

**Branch**: `016-data-hooks` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-data-hooks/spec.md`

## Summary

Интеграция TanStack Query v5 в Next.js 16 фронтенд для замены mock данных на реальный API. Создание React Query hooks для всех сущностей (users, templates, projects, credits) с кэшированием, оптимистичными обновлениями и error handling. Существующие Zustand stores упрощаются до UI-state (фильтры, viewMode), data-fetching мигрирует в React Query hooks.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3, Node.js 18+
**Primary Dependencies**: Next.js 16.1.6, `@tanstack/react-query` ^5.90.0 (NEW), ky ^1.14.3, zustand ^5.0.11, zod ^4.3.6, sonner ^2.0.7
**Storage**: N/A (client-side caching via React Query, tokens in localStorage)
**Testing**: Build validation (`npm run build`, `npm run type-check`)
**Target Platform**: Web (Modern browsers)
**Project Type**: Web application (frontend-only changes)
**Performance Goals**: Instant navigation between cached pages (<100ms), optimistic updates <100ms
**Constraints**: No breaking changes to existing components, backward compatible with mock data during migration
**Scale/Scope**: ~20 new/modified files in frontend, 4 hook modules, 1 provider, API function updates, type updates, 7 page integrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First Development | PASS | Full codebase exploration completed — all stores, types, API functions, components analyzed |
| II. Single Source of Truth | PASS | Query keys in single file, types in `types/index.ts`, mappers in `lib/api/mappers.ts` |
| III. Library-First Development | PASS | Using `@tanstack/react-query` v5 (3.5M+ npm downloads/week) instead of custom cache |
| IV. Code Reuse & DRY | PASS | Existing ky client reused, existing types extended, mapper patterns shared |
| V. Strict Type Safety | PASS | Full TypeScript, no `any`, typed hooks with generics |
| VI. Atomic Task Execution | PASS | Each task = 1 file group, independently testable |
| VII. Quality Gates | PASS | type-check + build after each task |
| VIII. Progressive Specification | PASS | Spec → Plan → Tasks → Implement flow followed |
| IX. Error Handling | PASS | Typed ApiError, user-facing toast messages, error states in UI |
| X. Observability | N/A | Client-side feature, no server logging needed |
| XI. Accessibility | PASS | Loading skeletons, error states with retry buttons, no a11y regressions |

**Post-design re-check**: All gates PASS. No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/016-data-hooks/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: library selection, API gaps, migration strategy
├── data-model.md        # Phase 1: entities, query keys, cache config, invalidation matrix
├── quickstart.md        # Phase 1: setup & usage guide
├── contracts/
│   ├── query-keys.ts    # Query key convention contract
│   ├── hooks-api.ts     # Public hooks interface contract
│   └── api-functions.ts # Raw API function signatures
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── layout.tsx                    # UPDATE: wrap with Providers
│   └── providers.tsx                 # NEW: QueryClientProvider + existing providers
├── lib/
│   ├── api/
│   │   ├── client.ts                # EXISTING: ky instance (no changes)
│   │   ├── auth.ts                  # EXISTING: auth API (no changes)
│   │   ├── tokens.ts               # EXISTING: token management (no changes)
│   │   ├── mappers.ts              # NEW: snake_case → camelCase mappers
│   │   ├── query-client.ts         # NEW: QueryClient config
│   │   ├── query-keys.ts           # NEW: query key conventions
│   │   ├── users.ts                # NEW: user API functions (replaces getCurrentUser in auth.ts)
│   │   ├── credits.ts              # NEW: credits API functions
│   │   ├── templates.ts            # UPDATE: real API calls (replace mock)
│   │   ├── projects.ts             # UPDATE: real API calls (replace mock)
│   │   ├── dashboard.ts            # DELETE: replaced by hooks combining user+projects+templates
│   │   └── settings.ts             # UPDATE: real API calls (replace mock)
│   └── hooks/
│       ├── use-user.ts             # NEW: useCurrentUser, useUpdateProfile
│       ├── use-credits.ts          # NEW: useCreditBalance, useDailyBonusStatus, useClaimDailyBonus, useCreditTransactions
│       ├── use-templates.ts        # NEW: useTemplates, useTemplate
│       └── use-projects.ts         # NEW: useProjects, useProject, useRecentProjects, useCreateProject, useDeleteProject, useUpdateProject
├── stores/
│   ├── auth.ts                     # KEEP: auth flow (login/logout/tokens)
│   ├── dashboard.ts                # SIMPLIFY: remove data fetching, keep only if UI state needed
│   ├── projects.ts                 # SIMPLIFY: keep UI state (filter, sort, viewMode, searchQuery), remove data fetching
│   ├── templates.ts                # SIMPLIFY: keep UI state (searchQuery, activeTab), remove data fetching
│   ├── settings.ts                 # SIMPLIFY: keep UI state (transactionFilter), remove data fetching
│   ├── generation.ts               # KEEP: complex generation flow (not part of this feature)
│   └── daily-bonus.ts              # DELETE: replaced by useCreditBalance + useClaimDailyBonus hooks
├── types/
│   └── index.ts                    # UPDATE: add CreditBalance, DailyBonusInfo, TransactionsPaginated, etc.
├── components/
│   ├── dashboard/
│   │   ├── welcome-card.tsx        # UPDATE: useCurrentUser + useCreditBalance
│   │   ├── quick-actions.tsx       # UPDATE: useTemplates
│   │   ├── recent-projects.tsx     # UPDATE: useRecentProjects
│   │   └── daily-bonus.tsx         # UPDATE: useDailyBonusStatus + useClaimDailyBonus
│   ├── layout/
│   │   └── main-layout.tsx         # UPDATE: useCurrentUser + useCreditBalance (navbar)
│   └── ...                         # Other components updated as needed
└── app/
    ├── dashboard/page.tsx          # UPDATE: remove store loading, hooks self-fetch
    ├── templates/
    │   ├── page.tsx                # UPDATE: useTemplates with filters
    │   └── [slug]/page.tsx         # UPDATE: useTemplate + useCreateProject
    ├── projects/
    │   ├── page.tsx                # UPDATE: useProjects with filters
    │   └── [id]/page.tsx           # UPDATE: useProject
    └── (main)/settings/
        ├── profile/page.tsx        # UPDATE: useCurrentUser + useUpdateProfile
        └── billing/page.tsx        # UPDATE: useCreditTransactions + useCreditBalance
```

**Structure Decision**: Frontend-only changes. Web application structure preserved. Backend is not modified. New files are created in `lib/api/` (API functions, query infrastructure) and `lib/hooks/` (React Query hooks). Existing stores are simplified, not deleted entirely.

## Complexity Tracking

> No constitution violations detected. All changes follow existing patterns.
