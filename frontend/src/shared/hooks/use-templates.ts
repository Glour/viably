import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/shared/api/query-keys"
import { fetchTemplates, fetchTemplate } from "@/features/templates/api"
import type { ApiTemplate, ApiTemplateDetail } from "@/shared/types"

export function useTemplates(filters?: { category?: string; search?: string }) {
  return useQuery<ApiTemplate[]>({
    queryKey: queryKeys.templates.all(filters),
    queryFn: ({ signal }) => fetchTemplates(filters, signal),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  })
}

export function useTemplate(slugOrId: string) {
  return useQuery<ApiTemplateDetail>({
    queryKey: queryKeys.templates.detail(slugOrId),
    queryFn: ({ signal }) => fetchTemplate(slugOrId, signal),
    staleTime: 30 * 60 * 1000,
    enabled: !!slugOrId,
  })
}
