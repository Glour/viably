import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import {
  fetchProjects,
  fetchProject,
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/api/projects"
import { trackProjectCreated } from "@/lib/analytics"
import { useAuthStore } from "@/stores/auth"
import type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/types"

// --------------------------------------------------------------------------
// Queries
// --------------------------------------------------------------------------

export function useRecentProjects(limit = 3) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<ApiProject[]>({
    queryKey: queryKeys.projects.recent,
    queryFn: async ({ signal }) => {
      const result = await fetchProjects(
        { page: 1, per_page: limit },
        signal,
      )
      return result.items
    },
    enabled: isAuthenticated,
  })
}

/** T033: Paginated project list with optional filters. */
export function useProjects(filters?: {
  status?: string
  page?: number
  perPage?: number
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<ProjectsPaginated>({
    queryKey: queryKeys.projects.all(filters),
    queryFn: ({ signal }) =>
      fetchProjects(
        {
          status: filters?.status,
          page: filters?.page,
          per_page: filters?.perPage,
        },
        signal,
      ),
    enabled: isAuthenticated,
  })
}

/** T034: Single project detail. */
export function useProject(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<ApiProject>({
    queryKey: queryKeys.projects.detail(id),
    queryFn: ({ signal }) => fetchProject(id, signal),
    enabled: isAuthenticated && !!id,
  })
}

// --------------------------------------------------------------------------
// Mutations
// --------------------------------------------------------------------------

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation<ApiProject, Error, CreateProjectPayload>({
    mutationFn: createProject,
    onSuccess: (data, variables) => {
      trackProjectCreated(data.id, variables.templateId)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/** T035: Delete a project by id. */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/** T036: Partially update a project. */
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
        queryKey: queryKeys.projects.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
