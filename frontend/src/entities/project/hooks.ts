/**
 * Project Entity React Query Hooks
 *
 * React Query hooks for project data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchProjects,
  fetchProject,
  createProject,
  deleteProject,
  updateProject,
} from "./api"
import type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectFilters,
} from "./types"

/**
 * Query keys for project-related queries
 */
export const projectQueryKeys = {
  all: (filters?: ProjectFilters) => ["projects", filters] as const,
  recent: ["projects", "recent"] as const,
  detail: (id: string) => ["projects", id] as const,
}

/**
 * Fetch recent projects (limited number)
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param limit - Number of recent projects to fetch
 */
export function useRecentProjects(isAuthenticated: boolean, limit = 3) {
  return useQuery<ApiProject[]>({
    queryKey: projectQueryKeys.recent,
    queryFn: async ({ signal }) => {
      const result = await fetchProjects(
        { page: 1, perPage: limit },
        signal,
      )
      return result.items
    },
    enabled: isAuthenticated,
  })
}

/**
 * Fetch paginated project list with optional filters
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param filters - Optional filters (status, page, perPage)
 */
export function useProjects(isAuthenticated: boolean, filters?: ProjectFilters) {
  return useQuery<ProjectsPaginated>({
    queryKey: projectQueryKeys.all(filters),
    queryFn: ({ signal }) => fetchProjects(filters, signal),
    enabled: isAuthenticated,
  })
}

/**
 * Fetch single project detail
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param id - Project ID
 */
export function useProject(isAuthenticated: boolean, id: string) {
  return useQuery<ApiProject>({
    queryKey: projectQueryKeys.detail(id),
    queryFn: ({ signal }) => fetchProject(id, signal),
    enabled: isAuthenticated && !!id,
  })
}

/**
 * Create new project mutation
 *
 * @param onSuccess - Optional callback to run on successful creation (e.g., track analytics)
 */
export function useCreateProject(onSuccess?: (project: ApiProject, variables: CreateProjectPayload) => void) {
  const queryClient = useQueryClient()

  return useMutation<ApiProject, Error, CreateProjectPayload>({
    mutationFn: createProject,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onSuccess?.(data, variables)
    },
  })
}

/**
 * Update project mutation
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation<
    ApiProject,
    Error,
    { id: string; data: UpdateProjectPayload }
  >({
    mutationFn: ({ id, data }) => updateProject(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/**
 * Delete project mutation
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
