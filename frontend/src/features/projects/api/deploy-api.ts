/**
 * Projects Feature - Deploy API
 *
 * API functions for project deployment operations.
 */

import { api, parseApiError } from "@/shared/api/client"

export interface DeployConfig {
  botToken?: string
  envVars?: Record<string, string>
  platform?: string
}

export interface DeployResult {
  deploymentId: string
  status: string
  url: string | null
}

/**
 * Deploy project to platform
 */
export async function deployProject(projectId: string, config?: DeployConfig): Promise<DeployResult> {
  try {
    const response = await api
      .post(`projects/${projectId}/deploy`, {
        json: {
          env_variables: config?.envVars,
          platform: config?.platform ?? "docker",
        },
      })
      .json<{ id: string; status: string; url: string | null }>()

    return {
      deploymentId: response.id,
      status: response.status,
      url: response.url,
    }
  } catch (error) {
    return await parseApiError(error)
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  projectId: string,
  deploymentId: string
): Promise<{ status: string; url: string | null }> {
  try {
    const response = await api
      .get(`projects/${projectId}/deployments/${deploymentId}`)
      .json<{ status: string; url: string | null }>()

    return {
      status: response.status,
      url: response.url,
    }
  } catch (error) {
    return await parseApiError(error)
  }
}

/**
 * Stop deployed project
 */
export async function stopDeployment(projectId: string, deploymentId: string): Promise<void> {
  try {
    await api.post(`projects/${projectId}/deployments/${deploymentId}/stop`)
  } catch (error) {
    return await parseApiError(error)
  }
}
