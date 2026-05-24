/**
 * Projects Feature - Deploy Hook
 *
 * Hook for project deployment operations.
 */

import { useState, useCallback } from "react"
import { deployProject, getDeploymentStatus, stopDeployment } from "../api/deploy-api"
import type { DeployConfig, DeployResult } from "../api/deploy-api"

export interface DeployState {
  isDeploying: boolean
  deploymentId: string | null
  status: string | null
  url: string | null
  error: string | null
}

/**
 * Hook for managing project deployment
 *
 * @param projectId - Project ID to deploy
 */
export function useDeploy(projectId: string) {
  const [state, setState] = useState<DeployState>({
    isDeploying: false,
    deploymentId: null,
    status: null,
    url: null,
    error: null,
  })

  const deploy = useCallback(
    async (config?: DeployConfig) => {
      setState((prev) => ({ ...prev, isDeploying: true, error: null }))

      try {
        const result: DeployResult = await deployProject(projectId, config)
        setState((prev) => ({
          ...prev,
          isDeploying: false,
          deploymentId: result.deploymentId,
          status: result.status,
          url: result.url,
        }))
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Deployment failed"
        setState((prev) => ({
          ...prev,
          isDeploying: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [projectId]
  )

  const checkStatus = useCallback(async () => {
    if (!state.deploymentId) return

    try {
      const result = await getDeploymentStatus(projectId, state.deploymentId)
      setState((prev) => ({
        ...prev,
        status: result.status,
        url: result.url,
      }))
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to check status"
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      throw error
    }
  }, [projectId, state.deploymentId])

  const stop = useCallback(async () => {
    if (!state.deploymentId) {
      throw new Error("No deployment to stop")
    }

    try {
      await stopDeployment(projectId, state.deploymentId)
      setState((prev) => ({
        ...prev,
        status: "stopped",
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to stop deployment"
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      throw error
    }
  }, [projectId, state.deploymentId])

  return {
    ...state,
    deploy,
    checkStatus,
    stop,
  }
}
