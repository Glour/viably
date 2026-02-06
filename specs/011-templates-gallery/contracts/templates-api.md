# API Contracts: Templates Gallery (Mock)

**Feature**: 011-templates-gallery
**Date**: 2026-02-06
**Type**: Client-side mock API (no backend integration for MVP)

## Functions

### getTemplates()

Загрузить все доступные шаблоны.

```
Function: getTemplates()
Returns: TemplatesResponse
Delay: 800ms (mock)

TemplatesResponse =
  | { success: true; templates: Template[] }
  | { success: false; error: string }
```

### getTemplateBySlug(slug: string)

Получить один шаблон по slug.

```
Function: getTemplateBySlug(slug: string)
Returns: TemplateResponse
Delay: 500ms (mock)

TemplateResponse =
  | { success: true; template: Template }
  | { success: false; error: string }

Error case: slug not found → { success: false, error: "Template not found" }
```

### createProjectFromTemplate(templateSlug: string)

Создать проект из шаблона (mock для MVP).

```
Function: createProjectFromTemplate(templateSlug: string)
Returns: CreateProjectResponse
Delay: 1200ms (mock)

CreateProjectResponse =
  | { success: true; projectId: string; redirectUrl: string }
  | { success: false; error: string }

Error cases:
  - Insufficient credits → { success: false, error: "Insufficient credits" }
  - Template not found → { success: false, error: "Template not found" }

Success: { success: true, projectId: "proj_new_1", redirectUrl: "/projects/proj_new_1/generate" }
```

## Type Contracts

### Response Types (добавить в types/index.ts)

```typescript
// Templates Gallery types

export type TemplateCategory = "telegram_bot"

export type ConfigFieldType = "text" | "textarea" | "select" | "multiselect" | "number"

export interface ConfigField {
  name: string
  label: string
  type: ConfigFieldType
  required: boolean
  placeholder?: string
  options?: string[]
}

export interface Template {
  slug: string
  name: string
  emoji: string
  description: string
  category: TemplateCategory
  creditCost: number
  features: string[]
  tags: string[]
  configFields: ConfigField[]
  isPopular: boolean
}

export type FilterTab = "all" | "telegram" | "popular" | "cheap"

export type TemplatesResponse =
  | { success: true; templates: Template[] }
  | { success: false; error: string }

export type TemplateResponse =
  | { success: true; template: Template }
  | { success: false; error: string }

export type CreateProjectResponse =
  | { success: true; projectId: string; redirectUrl: string }
  | { success: false; error: string }

// Templates Store types

export interface TemplatesStoreState {
  templates: Template[]
  searchQuery: string
  activeTab: FilterTab
  isLoading: boolean
  loadTemplates: () => Promise<void>
  setSearchQuery: (query: string) => void
  setActiveTab: (tab: FilterTab) => void
  resetFilters: () => void
  getFilteredTemplates: () => Template[]
  getTemplateBySlug: (slug: string) => Template | undefined
}
```

## Navigation Contract

| Action | Route | Method |
|--------|-------|--------|
| View gallery | `/templates` | GET (page) |
| View template detail | `/templates/[slug]` | GET (page) |
| Back to gallery | `/templates` | Link (client-side) |
| Create project | `/projects/{id}/generate` | Redirect after mock API |
| Top up credits | `/settings` | Link |
