# Quickstart: Templates Gallery

**Feature**: 011-templates-gallery
**Date**: 2026-02-06

## Prerequisites

- Node.js 18+
- Frontend dev server (`cd frontend && npm run dev`)
- Existing design system (008-design-system) implemented
- Dashboard module (010-dashboard) implemented (for UserProfile/credits in store)

## File Map

```
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
│       ├── search-bar.tsx              # Search input (NEW)
│       ├── filter-tabs.tsx             # Filter pill tabs (NEW)
│       └── empty-state.tsx             # No results state (NEW)
├── hooks/
│   └── use-debounce.ts                # Debounce hook (NEW)
├── lib/
│   ├── api/
│   │   └── templates.ts               # Mock API functions (NEW)
│   └── data/
│       └── templates.ts               # Mock template data (NEW)
├── stores/
│   └── templates.ts                   # Zustand store (NEW)
└── types/
    └── index.ts                       # Add Template types (MODIFY)
```

## Implementation Order

1. **Types** — добавить Template, ConfigField, FilterTab и store/response типы в `types/index.ts`
2. **Mock Data** — создать `lib/data/templates.ts` с 6 шаблонами
3. **Mock API** — создать `lib/api/templates.ts` с getTemplates, getTemplateBySlug, createProjectFromTemplate
4. **Debounce Hook** — создать `hooks/use-debounce.ts`
5. **Store** — создать `stores/templates.ts` с фильтрацией
6. **Template Card** — создать `components/templates/template-card.tsx`
7. **Search Bar** — создать `components/templates/search-bar.tsx`
8. **Filter Tabs** — создать `components/templates/filter-tabs.tsx`
9. **Empty State** — создать `components/templates/empty-state.tsx`
10. **Gallery Page** — модифицировать `app/templates/page.tsx`
11. **Template Detail** — создать `components/templates/template-detail.tsx`
12. **Detail Page** — создать `app/templates/[slug]/page.tsx`
13. **Polish** — hover-анимации, a11y, responsive проверка

## Key Patterns to Follow

### Store Pattern (from dashboard.ts)
```typescript
import { create } from "zustand"
import type { TemplatesStoreState } from "@/types"
export const useTemplatesStore = create<TemplatesStoreState>((set, get) => ({ ... }))
```

### Mock API Pattern (from lib/api/dashboard.ts)
```typescript
export async function getTemplates(): Promise<TemplatesResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return { success: true, templates: [...] }
}
```

### Page Pattern (from dashboard/page.tsx)
```typescript
"use client"
import { useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
```

### Animation Pattern
- `FadeInUp` с staggered delays (0, 0.1, 0.2...)
- CSS transitions для hover: `transition-all duration-400`
- Gradient line: `opacity-0 group-hover:opacity-100`

## Verification Commands

```bash
cd frontend
npm run type-check    # TypeScript compilation
npm run build         # Next.js build
npm run lint          # ESLint
```
