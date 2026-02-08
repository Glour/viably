import type {
  ProjectFile,
  TemplateResponse,
} from "@/types"
import { TEMPLATES } from "@/lib/data/templates"
import { downloadZip } from "client-zip"

/**
 * Recursively flatten the file tree into a flat array of file entries only
 */
function flattenFiles(files: ProjectFile[]): ProjectFile[] {
  const result: ProjectFile[] = []

  function traverse(items: ProjectFile[]) {
    for (const item of items) {
      if (item.type === "file") {
        result.push(item)
      }
      if (item.children) {
        traverse(item.children)
      }
    }
  }

  traverse(files)
  return result
}

/**
 * Download generated code as a ZIP file
 * Uses client-zip to create a browser download of the file tree
 */
export async function downloadGeneratedCode(
  files: ProjectFile[]
): Promise<void> {
  // Flatten the recursive tree structure into a flat list of files
  const flatFiles = flattenFiles(files)

  if (flatFiles.length === 0) {
    throw new Error("No files to download")
  }

  // Create ZIP blob using client-zip
  const blob = await downloadZip(
    flatFiles.map((file) => ({
      name: file.path,
      input: file.content || "",
    }))
  ).blob()

  // Trigger browser download
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "bot-code.zip"
  link.click()

  // Clean up object URL
  URL.revokeObjectURL(link.href)
}

/**
 * Get template for a project
 * Mock implementation: returns the first template from the templates array
 */
export async function getTemplateForProject(
  _projectId: string
): Promise<TemplateResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // In production, this would look up the template used for this project
  // For mock, we return the first template
  if (TEMPLATES.length === 0) {
    return {
      success: false,
      error: "No templates available",
    }
  }

  return {
    success: true,
    template: TEMPLATES[0],
  }
}

// ============================================================================
// WebSocket Generation API Integration (Module 017)
// ============================================================================

import { api } from "./client"

/**
 * Start AI code generation for a project
 *
 * POST /api/projects/{id}/generate
 *
 * @param projectId - Project UUID
 * @param params - Generation configuration
 * @returns Project ID and status
 *
 * @throws {ApiError} on HTTP errors (401, 403, 404, 402 insufficient credits)
 */
export async function startGeneration(
  projectId: string,
  params: {
    template_id: string
    name: string
    description?: string
    features?: string[]
  }
): Promise<{ project_id: string; status: string }> {
  return api.post(`projects/${projectId}/generate`, {
    json: params,
  }).json()
}

/**
 * Get generated code files for a project
 *
 * GET /api/projects/{id}/code
 *
 * @param projectId - Project UUID
 * @returns Generated code files
 *
 * @throws {ApiError} on HTTP errors (404, 400 if not generated yet)
 */
export async function getProjectCode(
  projectId: string
): Promise<{
  files: Array<{
    path: string
    content: string
    language: string
  }>
}> {
  return api.get(`projects/${projectId}/code`).json()
}

/**
 * Download generated code as ZIP archive
 *
 * GET /api/projects/{id}/download
 *
 * @param projectId - Project UUID
 * @returns ZIP blob download
 *
 * @throws {ApiError} on HTTP errors (404, 400 if not generated yet)
 */
export async function downloadProjectZip(
  projectId: string
): Promise<void> {
  const response = await api.get(`projects/${projectId}/download`)

  // Get blob from response
  const blob = await response.blob()

  // Trigger browser download
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `project-${projectId}.zip`
  link.click()

  // Clean up
  URL.revokeObjectURL(link.href)
}

/**
 * Start deployment of generated project to Railway
 *
 * POST /api/projects/{id}/deploy
 *
 * @param projectId - Project UUID
 * @param envVariables - Environment variables for deployment
 * @returns Deploy ID and status
 *
 * @throws {ApiError} on HTTP errors (400, 409 if no code or already deploying)
 */
export async function startDeploy(
  projectId: string,
  envVariables: Record<string, string>
): Promise<{ deploy_id: string; status: string }> {
  return api.post(`projects/${projectId}/deploy`, {
    json: {
      platform: "railway",
      env_variables: envVariables,
    },
  }).json()
}

/**
 * Cancel ongoing generation
 *
 * POST /api/projects/{id}/cancel-generation
 *
 * @param projectId - Project UUID
 * @returns Credits refunded
 *
 * @throws {ApiError} on HTTP errors (404 if no active generation)
 */
export async function cancelGeneration(
  projectId: string
): Promise<{ creditsRefunded: number }> {
  const response = await api.post(`projects/${projectId}/cancel-generation`).json<{
    data: { credits_refunded: number }
  }>()
  return { creditsRefunded: response.data.credits_refunded }
}
