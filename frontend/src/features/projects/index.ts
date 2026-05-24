/**
 * Projects Feature - Public API
 *
 * Exports components, hooks, stores, types, and API for project management.
 */

// Components
export {
  CodeViewer,
  DangerZone,
  DeleteProjectDialog,
  EnvVarEditor,
  FileTree,
  LogsViewer,
  OverviewTab,
  ProjectActionMenu,
  ProjectCard,
  ProjectDetailHeader,
  ProjectEmptyState,
  ProjectListRow,
  ProjectNoResults,
  ProjectSettings,
  ProjectsList,
  ProjectTabs,
  ProjectToolbar,
} from "./components"

// Hooks
export {
  useProjects,
  useProject,
  useRecentProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useDeploy,
} from "./hooks"

export type {
  DeployState,
} from "./hooks"

// Stores
export { useProjectsStore } from "./stores"

// API (re-export entity API + deploy)
export {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  deployProject,
  getDeploymentStatus,
  stopDeployment,
  projectQueryKeys,
} from "./api"

export type {
  DeployConfig,
  DeployResult,
} from "./api"

// Types & Schemas
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
  ProjectFilter,
  ProjectSort,
  ViewMode,
} from "./types"

export {
  createProjectSchema,
  updateProjectSchema,
} from "./types"
