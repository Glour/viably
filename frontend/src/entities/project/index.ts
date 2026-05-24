/**
 * Project Entity - Public API
 *
 * Exports types, hooks, schemas, and API functions for project management.
 */

// Types
export type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectFilters,
  ProjectStatus,
  BackendProjectStatus,
} from "./types"

// Schemas
export {
  createProjectSchema,
  updateProjectSchema,
} from "./schemas"
export type {
  CreateProjectFormData,
  UpdateProjectFormData,
} from "./schemas"

// API functions (for direct use if needed)
export {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
} from "./api"

// React Query hooks (primary interface)
export {
  useRecentProjects,
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectQueryKeys,
} from "./hooks"
