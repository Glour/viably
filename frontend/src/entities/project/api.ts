/**
 * Project Entity API
 *
 * API calls for project data management.
 */

import { api, parseApiError } from "@/shared/api/client"
import type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectFilters,
  ProjectStatus,
  BackendProjectStatus,
} from "./types"

/**
 * Map backend project status to frontend status
 */
const STATUS_MAP: Record<BackendProjectStatus, ProjectStatus> = {
  draft: "draft",
  generating: "generating",
  ready: "generated",
  deploying: "generating",
  deployed: "deployed",
  error: "failed",
}

function mapProjectStatus(status: string): ProjectStatus {
  return STATUS_MAP[status as BackendProjectStatus] ?? "draft"
}

/**
 * Map backend project response to ApiProject
 */
function mapProject(raw: Record<string, unknown>): ApiProject {
  const generatedCodeRaw = raw.generated_code as Record<string, unknown> | null
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    name: raw.name as string,
    description: (raw.description as string | null) ?? null,
    templateId: raw.template_id as string,
    config: (raw.config as Record<string, unknown>) ?? {},
    status: mapProjectStatus(raw.status as string),
    isPublic: (raw.is_public as boolean) ?? false,
    createdAt: raw.created_at as string,
    updatedAt: (raw.updated_at as string | null) ?? null,
    generatedCode: generatedCodeRaw
      ? {
          files: (generatedCodeRaw.files as Record<string, string>) ?? {},
          entryPoint: (generatedCodeRaw.entry_point as string) ?? "main.py",
          runtime: (generatedCodeRaw.runtime as string) ?? "python3.11",
        }
      : null,
    generationLogs: (raw.generation_logs as string | null) ?? null,
    aiModelUsed: (raw.ai_model_used as string | null) ?? null,
    errorMessage: (raw.error_message as string | null) ?? null,
    deployedUrl: (raw.deployed_url as string | null) ?? null,
    deployPlatform: (raw.deploy_platform as string | null) ?? null,
    generatedAt: (raw.generated_at as string | null) ?? null,
    deployedAt: (raw.deployed_at as string | null) ?? null,
  }
}

/**
 * Map paginated projects response
 */
function mapProjectsPaginated(raw: Record<string, unknown>): ProjectsPaginated {
  const items = raw.items as Record<string, unknown>[] | undefined
  return {
    items: Array.isArray(items) ? items.map(mapProject) : [],
    total: (raw.total as number) ?? 0,
    page: (raw.page as number) ?? 1,
    perPage: (raw.per_page as number) ?? 20,
    pages: (raw.pages as number) ?? 1,
  }
}

/**
 * Convert CreateProjectPayload to backend format (snake_case)
 */
function toCreateProjectPayload(data: CreateProjectPayload): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    template_id: data.templateId,
    config: data.config,
    allow_empty: data.allowEmpty || false,
  }
}

/**
 * Convert UpdateProjectPayload to backend format (snake_case)
 */
function toUpdateProjectPayload(data: UpdateProjectPayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.description !== undefined) payload.description = data.description
  if (data.config !== undefined) payload.config = data.config
  if (data.isPublic !== undefined) payload.is_public = data.isPublic
  return payload
}

/**
 * Fetch projects with optional filters
 */
export async function fetchProjects(
  params?: ProjectFilters,
  signal?: AbortSignal
): Promise<ProjectsPaginated> {
  try {
    const searchParams: Record<string, string | number> = {}
    if (params?.status) searchParams.status = params.status
    if (params?.page) searchParams.page = params.page
    if (params?.perPage) searchParams.per_page = params.perPage

    const response = await api
      .get("projects", { searchParams, signal })
      .json<Record<string, unknown>>()

    return mapProjectsPaginated(response)
  } catch (error) {
    return await parseApiError(error)
  }
}

/**
 * Fetch single project by ID
 */
export async function fetchProject(
  id: string,
  signal?: AbortSignal
): Promise<ApiProject> {
  try {
    const response = await api
      .get(`projects/${id}`, { signal })
      .json<Record<string, unknown>>()

    return mapProject(response)
  } catch (error) {
    return await parseApiError(error)
  }
}

/**
 * Create new project
 */
export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  try {
    const backendPayload = toCreateProjectPayload(payload)
    console.log("[API] Creating project with payload:", backendPayload)

    const response = await api
      .post("projects", { json: backendPayload })
      .json<Record<string, unknown>>()

    console.log("[API] Project created successfully:", response)
    return mapProject(response)
  } catch (error) {
    console.error("[API] Failed to create project:", error)
    return await parseApiError(error)
  }
}

/**
 * Update existing project
 */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload
): Promise<ApiProject> {
  try {
    const response = await api
      .patch(`projects/${id}`, { json: toUpdateProjectPayload(payload) })
      .json<Record<string, unknown>>()

    return mapProject(response)
  } catch (error) {
    return await parseApiError(error)
  }
}

/**
 * Delete project by ID
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await api.delete(`projects/${id}`)
  } catch (error) {
    return await parseApiError(error)
  }
}
