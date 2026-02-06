# Implementation Plan: Projects List & Detail Pages

**Branch**: `012-projects-pages` | **Date**: 2026-02-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-projects-pages/spec.md`

## Summary

Frontend module for managing user bot projects: a list page with grid/list views, search/filter/sort, and a detail page with 4 tabs (Overview, Code, Logs, Settings). MVP uses mock data, following established patterns from 011-templates-gallery. The code viewer uses Monaco Editor; all other components are custom.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2.3
**Primary Dependencies**: Next.js 16.1.6, Zustand 5.x, shadcn/ui (new-york), Motion 12.33, Tailwind CSS v4, lucide-react, @monaco-editor/react 4.7.0
**Storage**: N/A (mock data in code, no localStorage)
**Testing**: Build verification (`npm run build`)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (frontend only)
**Performance Goals**: Page render < 2s with 50 mock projects
**Constraints**: MVP with mock data, no backend API integration
**Scale/Scope**: ~20 new files, 6 user stories, 26 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Context-First | PASS | Codebase explored: templates-gallery pattern identified as blueprint |
| II. Single Source of Truth | PASS | Types in types/index.ts, extending existing ProjectStatus |
| III. Library-First | PASS | Monaco Editor chosen over custom; shadcn/ui components over custom dropdowns/tabs |
| IV. Code Reuse & DRY | PASS | Reusing MainLayout, FadeInUp, Shimmer, useDebounce, Badge, Card, Button, Input |
| V. Strict Type Safety | PASS | All types defined in data-model.md, discriminated unions for API responses |
| VI. Atomic Task Execution | PASS | Tasks decomposed into atomic units (see quickstart.md dev order) |
| VII. Quality Gates | PASS | Build verification after each task |
| VIII. Progressive Specification | PASS | Spec → Plan → Tasks → Implement |
| IX. Error Handling | PASS | Toast notifications for mock API errors |
| X. Observability | N/A | Frontend MVP, no logging infrastructure needed |
| XI. Accessibility | PASS | shadcn/ui provides ARIA attributes; keyboard navigation via Radix primitives |

**Post-Phase 1 Re-check**: All gates still pass. No violations found.

## Project Structure

### Documentation (this feature)

```text
specs/012-projects-pages/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output: library decisions
├── data-model.md        # Phase 1 output: entity definitions
├── quickstart.md        # Phase 1 output: setup guide
├── contracts/
│   └── api.md           # Phase 1 output: mock API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
frontend/
├── types/index.ts                      # Extended with Project types
├── stores/projects.ts                  # Zustand projects store
├── lib/
│   ├── api/projects.ts                 # Mock API functions
│   └── data/projects.ts               # Mock project data (6-8 projects)
├── hooks/use-debounce.ts               # Existing (reused)
├── components/
│   ├── projects/                       # NEW: all project components
│   │   ├── project-card.tsx            # Grid view card
│   │   ├── project-list-row.tsx        # List view row
│   │   ├── project-toolbar.tsx         # Search + filters + sort + view toggle
│   │   ├── project-empty-state.tsx     # No projects empty state
│   │   ├── project-no-results.tsx      # No search results
│   │   ├── project-action-menu.tsx     # ⋮ dropdown menu
│   │   ├── project-detail-header.tsx   # Detail page header
│   │   ├── project-tabs.tsx            # Tab navigation
│   │   ├── overview-tab.tsx            # Overview content
│   │   ├── code-viewer.tsx             # Monaco + file tree
│   │   ├── file-tree.tsx               # Recursive file tree
│   │   ├── logs-viewer.tsx             # Terminal-style logs
│   │   ├── project-settings.tsx        # Settings wrapper
│   │   ├── env-var-editor.tsx          # Env vars key-value editor
│   │   └── danger-zone.tsx             # Danger zone section
│   ├── ui/                             # Extended with new shadcn components
│   │   ├── dropdown-menu.tsx           # NEW (shadcn)
│   │   ├── tabs.tsx                    # NEW (shadcn)
│   │   ├── dialog.tsx                  # NEW (shadcn)
│   │   ├── select.tsx                  # NEW (shadcn)
│   │   ├── switch.tsx                  # NEW (shadcn)
│   │   ├── alert-dialog.tsx            # NEW (shadcn)
│   │   └── tooltip.tsx                 # NEW (shadcn)
│   ├── layout/main-layout.tsx          # EXISTING (reused)
│   └── motion/fade-in-up.tsx           # EXISTING (reused)
├── app/
│   └── projects/
│       ├── page.tsx                    # REPLACE stub with full list page
│       └── [id]/
│           └── page.tsx                # NEW: detail page
└── package.json                        # Add @monaco-editor/react
```

**Structure Decision**: Frontend-only web application. Follows existing Next.js App Router structure with domain-organized components (`components/projects/`). All new files go into established directories. Existing stub `app/projects/page.tsx` is replaced.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

## Key Design Decisions

### 1. ProjectStatus Extension

The existing `ProjectStatus` type (`"deployed" | "ready" | "draft" | "failed"`) needs to be extended to 6 statuses. The `"ready"` status maps to `"generated"`, and we add `"generating"` and `"stopped"`.

**Approach**: Update the existing type in `types/index.ts`. The dashboard's `ProjectSummary` will also benefit from the extended type. If this causes conflicts in dashboard components, the dashboard badge mapping will need a minor update.

### 2. Monaco Editor Loading Strategy

Monaco is loaded dynamically from CDN (~1.2MB). The `@monaco-editor/react` library handles this with a built-in loading state.

**Approach**: Use the `loading` prop to show a Shimmer skeleton while Monaco loads. Wrap in `"use client"` boundary. Always use `vs-dark` theme regardless of app theme.

### 3. View Mode Responsive Default

On mobile (< 640px), list view is the default. On desktop, grid view is default.

**Approach**: Initialize `viewMode` in the store based on `window.innerWidth` check (with SSR guard). User can override by toggling.

### 4. Tab Navigation

Tabs use URL search params (`?tab=overview`) for bookmarkability.

**Approach**: Use Next.js `useSearchParams` + `useRouter` for shallow navigation. Default to `overview` when no param. shadcn `Tabs` component with `value` controlled by search param.

### 5. Badge Variants Extension

Need 2 new badge variants: `info` (blue, for Generating with pulse) and `neutral-dark` (for Stopped).

**Approach**: Add variants to existing `components/ui/badge.tsx` CVA config.
