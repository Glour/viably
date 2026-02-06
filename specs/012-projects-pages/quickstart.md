# Quickstart: Projects List & Detail Pages

**Branch**: `012-projects-pages` | **Date**: 2026-02-06

## Prerequisites

- Node.js 18+
- Frontend dev server running (`cd frontend && npm run dev`)

## New Dependencies

```bash
cd frontend
npm install @monaco-editor/react
npx shadcn@latest add dropdown-menu tabs dialog select switch alert-dialog tooltip
```

## File Structure

```
frontend/
├── types/index.ts                      # Add Project types (extend existing)
├── stores/projects.ts                  # Zustand store
├── lib/
│   ├── api/projects.ts                 # Mock API functions
│   └── data/projects.ts               # Mock project data
├── components/projects/
│   ├── project-card.tsx                # Grid view card
│   ├── project-list-row.tsx            # List view row
│   ├── project-toolbar.tsx             # Search + filter + sort + view toggle
│   ├── project-empty-state.tsx         # Empty state (no projects)
│   ├── project-no-results.tsx          # No search results state
│   ├── project-action-menu.tsx         # Action menu (⋮) dropdown
│   ├── project-detail-header.tsx       # Detail page header
│   ├── project-tabs.tsx                # Tab navigation wrapper
│   ├── overview-tab.tsx                # Overview tab content
│   ├── code-viewer.tsx                 # Code tab: Monaco + file tree
│   ├── file-tree.tsx                   # Recursive file tree component
│   ├── logs-viewer.tsx                 # Logs tab: terminal-style viewer
│   ├── project-settings.tsx            # Settings tab wrapper
│   ├── env-var-editor.tsx              # Environment variables editor
│   └── danger-zone.tsx                 # Danger zone section
├── app/projects/
│   ├── page.tsx                        # Projects list page (replace stub)
│   └── [id]/
│       └── page.tsx                    # Project detail page
└── components/ui/
    ├── dropdown-menu.tsx               # shadcn (new)
    ├── tabs.tsx                        # shadcn (new)
    ├── dialog.tsx                      # shadcn (new)
    ├── select.tsx                      # shadcn (new)
    ├── switch.tsx                      # shadcn (new)
    ├── alert-dialog.tsx                # shadcn (new)
    └── tooltip.tsx                     # shadcn (new)
```

## Development Order

1. **Types & Data** — types, mock data, API, store
2. **List Page** — toolbar, project card, list row, empty states
3. **Detail Page** — header, tabs, overview tab
4. **Code Tab** — file tree, Monaco editor
5. **Logs Tab** — terminal viewer
6. **Settings Tab** — env vars editor, danger zone

## Key Patterns (from codebase)

```typescript
// Page structure
"use client"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"

export default function ProjectsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <FadeInUp delay={0}>{/* Header */}</FadeInUp>
        <FadeInUp delay={0.1}>{/* Toolbar */}</FadeInUp>
        <FadeInUp delay={0.15}>{/* Content */}</FadeInUp>
      </div>
    </MainLayout>
  )
}
```

```typescript
// Store pattern
import { create } from "zustand"
export const useProjectsStore = create<ProjectsStoreState>((set, get) => ({
  projects: [],
  isLoading: false,
  loadProjects: async () => {
    set({ isLoading: true })
    const res = await getProjects()
    set({ projects: res.success ? res.projects : [], isLoading: false })
  },
  getFilteredProjects: () => {
    const { projects, searchQuery, filter, sort } = get()
    // filter + sort logic
  },
}))
```

## Verification

```bash
cd frontend
npm run build    # Type-check + build
```
