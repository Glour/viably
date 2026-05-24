/**
 * Projects Feature Hook
 *
 * Main hook for projects operations.
 * Uses entity hooks + feature-specific logic.
 */

import {
  useProjects as useProjectsEntity,
  useProject as useProjectEntity,
  useCreateProject as useCreateProjectEntity,
  useUpdateProject as useUpdateProjectEntity,
  useDeleteProject as useDeleteProjectEntity,
  useRecentProjects as useRecentProjectsEntity,
} from "@/entities/project"

/**
 * Hook for fetching paginated projects list
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param filters - Optional filters (status, page, perPage)
 */
export function useProjects(
  isAuthenticated: boolean,
  filters?: { status?: string; page?: number; perPage?: number }
) {
  return useProjectsEntity(isAuthenticated, filters)
}

/**
 * Hook for fetching single project
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param id - Project ID
 */
export function useProject(isAuthenticated: boolean, id: string) {
  return useProjectEntity(isAuthenticated, id)
}

/**
 * Hook for fetching recent projects
 *
 * @param isAuthenticated - Whether user is authenticated
 * @param limit - Number of recent projects to fetch
 */
export function useRecentProjects(isAuthenticated: boolean, limit = 3) {
  return useRecentProjectsEntity(isAuthenticated, limit)
}

/**
 * Hook for creating project
 *
 * @param onSuccess - Optional success callback
 */
export function useCreateProject(onSuccess?: (project: unknown, variables: unknown) => void) {
  return useCreateProjectEntity(onSuccess)
}

/**
 * Hook for updating project
 */
export function useUpdateProject() {
  return useUpdateProjectEntity()
}

/**
 * Hook for deleting project
 */
export function useDeleteProject() {
  return useDeleteProjectEntity()
}
