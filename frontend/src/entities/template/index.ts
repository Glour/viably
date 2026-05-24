/**
 * Template Entity - Public API
 *
 * Exports types, hooks, schemas, and API functions for template management.
 */

// Types
export type {
  ApiTemplate,
  ApiTemplateDetail,
  TemplateFilters,
} from "./types"

// Re-export Template from shared types for backward compatibility
export type { Template, TemplateCategory } from "@/shared/types"

// Schemas
export { templateFilterSchema } from "./schemas"
export type { TemplateFilterFormData } from "./schemas"

// API functions (for direct use if needed)
export { fetchTemplates, fetchTemplate } from "./api"

// React Query hooks (primary interface)
export { useTemplates, useTemplate, templateQueryKeys } from "./hooks"
