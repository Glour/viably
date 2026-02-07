import { api, parseApiError } from "./client"
import {
  mapProject,
  mapProjectsPaginated,
  toCreateProjectPayload,
  toUpdateProjectPayload,
} from "./mappers"
import type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/types"

export async function fetchProjects(
  params?: { status?: string; page?: number; per_page?: number },
  signal?: AbortSignal
): Promise<ProjectsPaginated> {
  try {
    const searchParams: Record<string, string | number> = {}
    if (params?.status) searchParams.status = params.status
    if (params?.page) searchParams.page = params.page
    if (params?.per_page) searchParams.per_page = params.per_page

    const response = await api
      .get("projects", { searchParams, signal })
      .json<Record<string, unknown>>()

    return mapProjectsPaginated(response)
  } catch (error) {
    return await parseApiError(error)
  }
}

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

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  try {
    const response = await api
      .post("projects", { json: toCreateProjectPayload(payload) })
      .json<Record<string, unknown>>()

    return mapProject(response)
  } catch (error) {
    return await parseApiError(error)
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await api.delete(`projects/${id}`)
  } catch (error) {
    return await parseApiError(error)
  }
}

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
