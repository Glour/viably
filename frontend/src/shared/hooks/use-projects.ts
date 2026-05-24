import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/shared/api/query-keys"
import {
  fetchProjects,
  fetchProject,
  createProject,
  deleteProject,
  updateProject,
} from "@/features/projects/api"
import { trackProjectCreated } from "@/shared/config/analytics-helpers"
import { useAuthStore } from "@/features/auth/stores"
import type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/shared/types"

// --------------------------------------------------------------------------
// Queries
// --------------------------------------------------------------------------

export function useRecentProjects(limit = 3) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery<ApiProject[]>({
    queryKey: queryKeys.projects.recent,
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
          perPage: filters?.perPage,
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
      trackProjectCreated(data.id, variables.templateId ?? undefined)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

/** T035: Delete a project by id. */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      // Snapshot previous value
      const previous = queryClient.getQueryData<ProjectsPaginated>(queryKeys.projects.all())
      // Optimistically remove the project
      queryClient.setQueriesData<ProjectsPaginated>({ queryKey: ["projects"] }, (old) => {
        if (!old) return old
        return { ...old, items: old.items.filter((p) => p.id !== deletedId) }
      })
      return { previous }
    },
    onError: (_err, _id, context: any) => {
      // Rollback
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.projects.all(), context.previous)
      }
    },
    onSettled: () => {
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
