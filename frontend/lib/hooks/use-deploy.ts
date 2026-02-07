import { useState, useEffect, useRef, useCallback } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth"
import { getAccessToken } from "@/lib/api/tokens"
import { startDeploy as apiStartDeploy } from "@/lib/api/generation"
import { queryKeys } from "@/lib/api/query-keys"
import {
  DEPLOY_STEPS,
  MAX_RECONNECT_ATTEMPTS,
  INITIAL_RECONNECT_INTERVAL,
  MAX_RECONNECT_INTERVAL,
} from "@/lib/data/generation"
import type {
  WebSocketMessage,
  DeployProgressState,
  DeploymentInfo,
  DeployStatus,
  StepStatus,
} from "@/types/websocket"

/**
 * WebSocket hook for real-time deployment progress
 *
 * User Story 3 (T039-T043): WebSocket Deployment Flow
 *
 * Architecture:
 * Component → useDeploy → useWebSocket (shared connection) → Backend WS
 *
 * Features:
 * - T039: Establish WebSocket connection (shared with useGeneration)
 * - T040: Handle deploy_progress messages (step, progress, logs)
 * - T041: Handle deploy_complete messages (deployment info, invalidate queries)
 * - T042: Handle deploy_error messages
 * - T043: React Query invalidation after deployment
 * - Resilient reconnection (same logic as useGeneration)
 *
 * @param projectId - Project UUID to track deployment for
 * @returns Hook state and control functions
 */
export function useDeploy(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const token = getAccessToken()

  // Initial state
  const INITIAL_STATE: DeployProgressState = {
    status: "idle",
    currentStep: 0,
    steps: DEPLOY_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })),
    progress: 0,
    deploymentInfo: null,
    error: null,
  }

  const [state, setState] = useState<DeployProgressState>(INITIAL_STATE)

  // Track component lifecycle to prevent reconnection after unmount
  const didUnmount = useRef(false)

  // Track reconnection attempts and state for UI display
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)

  // Set didUnmount flag on component unmount
  useEffect(() => {
    return () => {
      didUnmount.current = true
    }
  }, [])

  // T039: Construct WebSocket URL with user ID and auth token
  const wsUrl =
    user && token
      ? `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/${user.id}?token=${token}`
      : null

  // T039: Establish WebSocket connection (shared with useGeneration)
  const { lastJsonMessage, readyState } = useWebSocket<WebSocketMessage>(
    wsUrl,
    {
      share: true, // Share connection with useGeneration for multi-tab sync

      // Smart reconnection logic (same as useGeneration)
      shouldReconnect: (closeEvent) => {
        // Don't reconnect if component unmounted
        if (didUnmount.current) return false

        // Don't reconnect on normal closure (e.g., user logout, intentional disconnect)
        if (closeEvent.code === 1000) return false

        // Always reconnect on abnormal closures (network issues, server restart, etc.)
        return true
      },

      // Maximum 5 reconnection attempts
      reconnectAttempts: MAX_RECONNECT_ATTEMPTS,

      // Exponential backoff with cap
      // Formula: baseInterval * 2^attemptNumber, capped at MAX_RECONNECT_INTERVAL
      // Progression: 3s → 6s → 12s → 24s → 48s
      reconnectInterval: (attemptNumber) => {
        const interval = Math.min(
          INITIAL_RECONNECT_INTERVAL * Math.pow(2, attemptNumber),
          MAX_RECONNECT_INTERVAL
        )

        // Update reconnection state for UI
        setReconnectAttempts(attemptNumber + 1)
        setIsReconnecting(true)

        return interval
      },

      // Handle reconnection failure after max attempts
      onReconnectStop: (numAttempts) => {
        setIsReconnecting(false)
        setReconnectAttempts(0)

        console.error(`WebSocket reconnection failed after ${numAttempts} attempts`)

        // Set error state so UI can show manual reconnect button
        setState((prev) => ({
          ...prev,
          error: "Connection lost. Please check your internet and refresh the page.",
        }))
      },

      // Reset reconnection state on successful connection
      onOpen: () => {
        setReconnectAttempts(0)
        setIsReconnecting(false)
      },
    },
    // Only connect if user is authenticated
    !!wsUrl
  )

  // T040-T042: Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastJsonMessage) return

    // Filter: Only handle messages for this project
    if (lastJsonMessage.project_id !== projectId) {
      return
    }

    switch (lastJsonMessage.type) {
      case "deploy_progress": {
        // T040: Update step status, progress, and log
        const { step, step_name, step_status, progress, log } = lastJsonMessage.data

        // T061: Out-of-order message protection
        setState((prev) => {
          // Ignore messages from past steps (out-of-order delivery)
          if (step < prev.currentStep) {
            console.warn(`[WebSocket] Ignoring out-of-order deploy message: step ${step} received after step ${prev.currentStep}`)
            return prev
          }

          // Map backend step_status to frontend StepStatus
          const mappedStatus: StepStatus = step_status === "complete" ? "complete" : "running"

          return {
            ...prev,
            status: "deploying",
            currentStep: step,
            progress,
            steps: prev.steps.map((s, idx) =>
              idx + 1 === step
                ? { ...s, status: mappedStatus, log }
                : s
            ),
          }
        })
        break
      }

      case "deploy_complete": {
        // T041: Set deployment info and mark complete
        const deploymentInfo = lastJsonMessage.data

        setState((prev) => ({
          ...prev,
          status: "success",
          deploymentInfo,
          progress: 100,
          steps: prev.steps.map((s) => ({
            ...s,
            status: "complete" as StepStatus,
          })),
        }))

        // T043: Invalidate React Query cache to refetch project data
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
        break
      }

      case "deploy_error": {
        // T042: Handle deployment errors
        const { error } = lastJsonMessage.data

        setState((prev) => ({
          ...prev,
          status: "error",
          error,
          steps: prev.steps.map((s, idx) =>
            idx === prev.currentStep - 1
              ? { ...s, status: "error" as StepStatus }
              : s
          ),
        }))
        break
      }

      // Handle credits_updated messages (optional, for balance sync)
      case "credits_updated": {
        queryClient.invalidateQueries({ queryKey: queryKeys.credits.balance })
        break
      }

      // T060: Unknown message type handler - graceful degradation
      default: {
        // Ignore generation_* messages (handled by useGeneration hook)
        if (lastJsonMessage.type?.startsWith('generation_')) {
          break
        }

        // Log warning for truly unknown message types
        console.warn('[WebSocket] Unknown message type received:', lastJsonMessage.type, lastJsonMessage)
        break
      }
    }
  }, [lastJsonMessage, projectId, queryClient])

  // Start deployment mutation
  const startDeployMutation = useMutation({
    mutationFn: (envVars: Record<string, string>) =>
      apiStartDeploy(projectId, envVars),
    onSuccess: () => {
      // Reset state to deploying on successful API call
      setState({
        ...INITIAL_STATE,
        status: "deploying",
        currentStep: 1,
        steps: DEPLOY_STEPS.map((s, idx) => ({
          ...s,
          status: idx === 0 ? ("running" as StepStatus) : ("pending" as StepStatus),
        })),
      })
    },
    onError: (error: Error) => {
      // Handle API errors (e.g., 400, 409, 401, 404)
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error.message,
      }))
    },
  })

  // Retry deployment: reset state to idle
  const retryDeploy = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  return {
    // Deployment state
    status: state.status,
    currentStep: state.currentStep,
    steps: state.steps,
    progress: state.progress,
    deploymentInfo: state.deploymentInfo,
    error: state.error,

    // Control functions
    startDeploy: startDeployMutation.mutateAsync,
    retryDeploy,

    // WebSocket connection state
    isConnected: readyState === ReadyState.OPEN,
    connectionState: readyState,

    // Reconnection state for UI display
    reconnectAttempts,
    isReconnecting,
  }
}
