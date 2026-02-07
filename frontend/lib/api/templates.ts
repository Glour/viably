import { api, parseApiError } from "./client"
import { mapTemplate, mapTemplateDetail } from "./mappers"
import type { ApiTemplate, ApiTemplateDetail } from "@/types"

export async function fetchTemplates(
  params?: { category?: string; search?: string },
  signal?: AbortSignal
): Promise<ApiTemplate[]> {
  try {
    const searchParams: Record<string, string> = {}
    if (params?.category) searchParams.category = params.category
    if (params?.search) searchParams.search = params.search

    const response = await api
      .get("templates", { searchParams, signal })
      .json<{ data: { templates: Record<string, unknown>[] } }>()

    return response.data.templates.map(mapTemplate)
  } catch (error) {
    return await parseApiError(error)
  }
}

export async function fetchTemplate(
  slugOrId: string,
  signal?: AbortSignal
): Promise<ApiTemplateDetail> {
  try {
    const response = await api
      .get(`templates/${slugOrId}`, { signal })
      .json<{ data: Record<string, unknown> }>()

    return mapTemplateDetail(response.data)
  } catch (error) {
    return await parseApiError(error)
  }
}
