/**
 * Project download and deploy API helpers.
 * Legacy generation functions removed — use conversations WebSocket instead.
 */
import { api } from "@/shared/api/client"

/**
 * Download generated project as ZIP
 * GET /api/projects/{id}/download
 */
export async function downloadProjectZip(projectId: string): Promise<void> {
  const response = await api.get(`projects/${projectId}/download`)
  const blob = await response.blob()
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `project-${projectId}.zip`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Start deployment of generated project
 * POST /api/projects/{id}/deploy
 */
export async function startDeploy(
  projectId: string,
  envVariables: Record<string, string>
): Promise<{ id: string; status: string }> {
  return api.post(`projects/${projectId}/deploy`, {
    json: { platform: "docker", env_variables: envVariables },
  }).json()
}
