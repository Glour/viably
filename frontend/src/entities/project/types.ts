/**
 * Project Entity Types
 *
 * Domain types for projects and related data.
 */

export type ProjectStatus = "draft" | "generating" | "generated" | "deployed" | "failed" | "stopped"
export type BackendProjectStatus = "draft" | "generating" | "ready" | "deploying" | "deployed" | "error"

/**
 * API version of Project (matches backend)
 */
export interface ApiProject {
  id: string
  userId: string
  name: string
  description: string | null
  templateId: string
  config: Record<string, unknown>
  status: ProjectStatus
  isPublic: boolean
  createdAt: string
  updatedAt: string | null
  generatedCode: {
    files: Record<string, string>
    entryPoint: string
    runtime: string
  } | null
  generationLogs: string | null
  aiModelUsed: string | null
  errorMessage: string | null
  deployedUrl: string | null
  deployPlatform: string | null
  generatedAt: string | null
  deployedAt: string | null
}

/**
 * Paginated projects response
 */
export interface ProjectsPaginated {
  items: ApiProject[]
  total: number
  page: number
  perPage: number
  pages: number
}

/**
 * Create project payload
 */
export interface CreateProjectPayload {
  name: string
  description?: string
  templateId: string | null
  config: Record<string, unknown>
  allowEmpty?: boolean
}

/**
 * Update project payload
 */
export interface UpdateProjectPayload {
  name?: string
  description?: string
  config?: Record<string, unknown>
  isPublic?: boolean
}

/**
 * Project filters for list queries
 */
export interface ProjectFilters {
  status?: string
  page?: number
  perPage?: number
}
