/**
 * Template Entity API
 *
 * API calls for template data management.
 */

import { api, parseApiError } from "@/shared/api/client"
import type { ApiTemplate, ApiTemplateDetail, TemplateFilters } from "./types"

/**
 * Map backend template response to ApiTemplate
 */
function mapTemplate(raw: Record<string, unknown>): ApiTemplate {
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: raw.slug as string,
    description: raw.description as string,
    category: raw.category as string,
    creditCost: raw.credit_cost as number,
    previewImageUrl: (raw.preview_image_url as string | null) ?? null,
    features: (raw.features as string[]) ?? [],
    tags: (raw.tags as string[]) ?? [],
    usageCount: (raw.usage_count as number) ?? 0,
    createdAt: raw.created_at as string,
  }
}

/**
 * Map backend template detail response to ApiTemplateDetail
 */
function mapTemplateDetail(raw: Record<string, unknown>): ApiTemplateDetail {
  return {
    ...mapTemplate(raw),
    configSchema: (raw.config_schema as Record<string, unknown> | null) ?? null,
    exampleConfig: (raw.example_config as Record<string, unknown> | null) ?? null,
    onboardingPrompt: (raw.onboarding_prompt as string | null) ?? null,
  }
}

/**
 * Generate example config from JSON Schema defaults
 */
function generateExampleConfig(schema: Record<string, unknown>): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined

  if (!properties) return config

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.default !== undefined) {
      config[key] = prop.default
    } else if (prop.type === "string") {
      config[key] = ""
    } else if (prop.type === "number") {
      config[key] = 0
    } else if (prop.type === "boolean") {
      config[key] = false
    } else if (prop.type === "array") {
      config[key] = []
    } else if (prop.type === "object") {
      config[key] = {}
    }
  }

  return config
}

/**
 * Fetch templates with optional filters
 */
export async function fetchTemplates(
  params?: TemplateFilters,
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

/**
 * Fetch single template by slug or ID
 */
export async function fetchTemplate(
  slugOrId: string,
  signal?: AbortSignal
): Promise<ApiTemplateDetail> {
  try {
    const response = await api
      .get(`templates/${slugOrId}`, { signal })
      .json<{ data: Record<string, unknown> }>()

    const template = mapTemplateDetail(response.data)

    // Generate example_config from config_schema defaults if not provided
    if (!template.exampleConfig && template.configSchema) {
      template.exampleConfig = generateExampleConfig(template.configSchema)
    }

    return template
  } catch (error) {
    return await parseApiError(error)
  }
}
