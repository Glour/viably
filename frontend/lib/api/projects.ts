import type {
  ProjectsResponse,
  ProjectResponse,
  DeleteProjectResponse,
  DuplicateProjectResponse,
  ToggleStatusResponse,
} from "@/types"
import { PROJECTS } from "@/lib/data/projects"

export async function getProjects(): Promise<ProjectsResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  return {
    success: true,
    projects: PROJECTS,
  }
}

export async function getProjectById(
  id: string
): Promise<ProjectResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const project = PROJECTS.find((p) => p.id === id)

  if (!project) {
    return { success: false, error: "Project not found" }
  }

  return { success: true, project }
}

export async function deleteProject(
  id: string
): Promise<DeleteProjectResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const project = PROJECTS.find((p) => p.id === id)

  if (!project) {
    return { success: false, error: "Project not found" }
  }

  return { success: true }
}

export async function duplicateProject(
  id: string
): Promise<DuplicateProjectResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const project = PROJECTS.find((p) => p.id === id)

  if (!project) {
    return { success: false, error: "Project not found" }
  }

  const newProjectId = `proj_${Date.now()}`

  return { success: true, projectId: newProjectId }
}

export async function toggleProjectStatus(
  id: string,
  action: "start" | "stop"
): Promise<ToggleStatusResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const project = PROJECTS.find((p) => p.id === id)

  if (!project) {
    return { success: false, error: "Project not found" }
  }

  const newStatus = action === "start" ? "deployed" : "stopped"

  return { success: true, newStatus }
}
