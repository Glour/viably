/**
 * Projects API - Public exports
 *
 * Re-exports entity API + feature-specific operations (deploy)
 */

// Re-export entity API for convenience
export {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  projectQueryKeys,
} from "@/entities/project"

// Feature-specific deploy API
export {
  deployProject,
  getDeploymentStatus,
  stopDeployment,
} from "./deploy-api"

export type {
  DeployConfig,
  DeployResult,
} from "./deploy-api"
