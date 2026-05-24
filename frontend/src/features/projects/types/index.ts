/**
 * Projects Types - Public exports
 *
 * Re-exports entity types + feature-specific types
 */

// Re-export entity types
export type {
  ApiProject,
  ProjectsPaginated,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectFilters,
  ProjectStatus,
  BackendProjectStatus,
  CreateProjectFormData,
  UpdateProjectFormData,
} from "@/entities/project"

// Re-export entity schemas
export {
  createProjectSchema,
  updateProjectSchema,
} from "@/entities/project"

// Feature-specific UI types
export type ProjectFilter = "all" | "deployed" | "generated" | "draft" | "failed"
export type ProjectSort = "newest" | "oldest" | "name"
export type ViewMode = "grid" | "list"
