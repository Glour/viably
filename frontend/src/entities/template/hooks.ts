/**
 * Template Entity React Query Hooks
 *
 * React Query hooks for template data fetching.
 */

import { useQuery } from "@tanstack/react-query"
import { fetchTemplates, fetchTemplate } from "./api"
import type { ApiTemplate, ApiTemplateDetail, TemplateFilters } from "./types"

/**
 * Query keys for template-related queries
 */
export const templateQueryKeys = {
  all: (filters?: TemplateFilters) => ["templates", filters] as const,
  detail: (slugOrId: string) => ["templates", slugOrId] as const,
}

/**
 * Fetch templates list with optional filters
 *
 * Templates are cached for 30 minutes due to infrequent changes.
 *
 * @param filters - Optional filters (category, search)
 */
export function useTemplates(filters?: TemplateFilters) {
  return useQuery<ApiTemplate[]>({
    queryKey: templateQueryKeys.all(filters),
    queryFn: ({ signal }) => fetchTemplates(filters, signal),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  })
}

/**
 * Fetch single template detail by slug or ID
 *
 * @param slugOrId - Template slug or ID
 */
export function useTemplate(slugOrId: string) {
  return useQuery<ApiTemplateDetail>({
    queryKey: templateQueryKeys.detail(slugOrId),
    queryFn: ({ signal }) => fetchTemplate(slugOrId, signal),
    staleTime: 30 * 60 * 1000,
    enabled: !!slugOrId,
  })
}
