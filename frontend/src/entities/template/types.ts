/**
 * Template Entity Types
 *
 * Domain types for templates and template catalog.
 */

/**
 * API version of Template (matches backend)
 */
export interface ApiTemplate {
  id: string
  name: string
  slug: string
  description: string
  category: string
  creditCost: number
  previewImageUrl: string | null
  features: string[]
  tags: string[]
  usageCount: number
  createdAt: string
}

/**
 * API version of Template Detail (includes config schema)
 */
export interface ApiTemplateDetail extends ApiTemplate {
  configSchema: Record<string, unknown> | null
  exampleConfig: Record<string, unknown> | null
  onboardingPrompt: string | null
}

/**
 * Template filters for list queries
 */
export interface TemplateFilters {
  category?: string
  search?: string
}
