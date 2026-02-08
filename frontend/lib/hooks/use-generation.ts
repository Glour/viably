import { useState, useEffect, useRef, useMemo } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth"
import { getAccessToken } from "@/lib/api/tokens"
import { env } from "@/lib/env"
import { startGeneration as apiStartGeneration, cancelGeneration as apiCancelGeneration } from "@/lib/api/generation"
import { queryKeys } from "@/lib/api/query-keys"
import { toast } from "sonner"
import { useOfflineDetection } from "./use-offline-detection"
import {
  GENERATION_STEPS,
  MAX_RECONNECT_ATTEMPTS,
  INITIAL_RECONNECT_INTERVAL,
  MAX_RECONNECT_INTERVAL,
} from "@/lib/data/generation"
import type {
  WebSocketMessage,
  GenerationProgressState,
  GeneratedFile,
  GenerationStatus,
  StepStatus,
  GenerationStep,
} from "@/types/websocket"

/**
 * WebSocket hook for real-time AI code generation progress
 *
 * User Story 1 (T019-T025): WebSocket Generation Flow
 * User Story 2 (T030-T035): Resilient Reconnection
 *
 * Architecture:
 * Component → useGeneration → useWebSocket (react-use-websocket) → Backend WS
 *
 * Features:
 * - T019: Start generation via POST API, track state
 * - T020: Establish WebSocket connection with auth token
 * - T021: Handle generation_progress messages (step, progress, logs, code)
 * - T022: Handle generation_complete messages (final code, invalidate queries)
 * - T023: Handle generation_error messages
 * - T024: React Query invalidation after completion
 * - T025: Accumulate code snippets for typewriter animation
 * - T030: Smart shouldReconnect logic (no reconnect on normal closure/unmount)
 * - T031: Exponential backoff (3s → 6s → 12s → 24s → 48s)
 * - T032: Max 5 reconnect attempts
 * - T033: onReconnectStop error handling
 * - T034: Lifecycle management with didUnmount ref
 * - T035: Track reconnection state for UI
 *
 * @param projectId - Project UUID to track generation for
 * @returns Hook state and control functions
 */
export function useGeneration(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const token = getAccessToken()

  // T067: Offline detection
  const isOffline = useOfflineDetection()

  // T069: Memoize initial steps computation to avoid recreating on every render
  const initialSteps = useMemo(
    () => GENERATION_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })),
    []
  )

  // Initial state
  const INITIAL_STATE: GenerationProgressState = useMemo(
    () => ({
      status: "idle",
      currentStep: 0,
      steps: initialSteps,
      progress: 0,
      codeSnippets: [],
      generatedCode: null,
      error: null,
    }),
    [initialSteps]
  )

  const [state, setState] = useState<GenerationProgressState>(INITIAL_STATE)

  // T034: Track component lifecycle to prevent reconnection after unmount
  const didUnmount = useRef(false)

  // T035: Track reconnection attempts and state for UI display
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)

  // T034: Set didUnmount flag on component unmount
  useEffect(() => {
    return () => {
      didUnmount.current = true
    }
  }, [])

  // T020: Construct WebSocket URL with user ID and auth token
  const wsUrl =
    user && token
      ? `${env.NEXT_PUBLIC_WS_URL}/ws/${user.id}?token=${token}`
      : null

  // T020, T030-T033: Establish WebSocket connection with resilient reconnection
  const { lastJsonMessage, readyState } = useWebSocket<WebSocketMessage>(
    wsUrl,
    {
      share: true, // Multi-tab sync

      // T030: Smart reconnection logic
      // Don't reconnect on normal closure (code 1000) or after component unmount
      shouldReconnect: (closeEvent) => {
        // Don't reconnect if component unmounted
        if (didUnmount.current) return false

        // Don't reconnect on normal closure (e.g., user logout, intentional disconnect)
        if (closeEvent.code === 1000) return false

        // Always reconnect on abnormal closures (network issues, server restart, etc.)
        return true
      },

      // T032: Maximum 5 reconnection attempts
      reconnectAttempts: MAX_RECONNECT_ATTEMPTS,

      // T031: Exponential backoff with cap
      // Formula: baseInterval * 2^attemptNumber, capped at MAX_RECONNECT_INTERVAL
      // Progression: 3s → 6s → 12s → 24s → 48s
      reconnectInterval: (attemptNumber) => {
        const interval = Math.min(
          INITIAL_RECONNECT_INTERVAL * Math.pow(2, attemptNumber),
          MAX_RECONNECT_INTERVAL
        )

        // T035: Update reconnection state for UI
        setReconnectAttempts(attemptNumber + 1)
        setIsReconnecting(true)

        return interval
      },

      // T033: Handle reconnection failure after max attempts
      onReconnectStop: (numAttempts) => {
        setIsReconnecting(false)
        setReconnectAttempts(0)

        console.error(`WebSocket reconnection failed after ${numAttempts} attempts`)

        // T063: Toast notification for connection failure
        toast.error("Соединение потеряно. Проверьте интернет и обновите страницу.")

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

        // T063: Toast notification for successful reconnection
        if (reconnectAttempts > 0) {
          toast.success("Соединение восстановлено")
        }
      },
    },
    // Only connect if user is authenticated
    !!wsUrl
  )

  // T021-T023: Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastJsonMessage) return

    // Filter: Only handle messages for this project
    if (lastJsonMessage.project_id !== projectId) {
      return
    }

    switch (lastJsonMessage.type) {
      case "generation_progress": {
        // T021: Update step status, progress, log, and accumulate code snippets
        const { step, step_name, step_status, progress, log, code_snippet } =
          lastJsonMessage.data

        // T061: Out-of-order message protection
        setState((prev) => {
          // Ignore messages from past steps (out-of-order delivery)
          if (step < prev.currentStep) {
            console.warn(`[WebSocket] Ignoring out-of-order message: step ${step} received after step ${prev.currentStep}`)
            return prev
          }

          // Map backend step_status to frontend StepStatus
          const mappedStatus: StepStatus = step_status === "complete" ? "complete" : "running"

          return {
            ...prev,
            status: "generating",
            currentStep: step,
            progress,
            steps: prev.steps.map((s, idx) =>
              idx + 1 === step
                ? { ...s, status: mappedStatus, log }
                : s
            ),
            // T025: Accumulate code snippets for typewriter animation
            codeSnippets: code_snippet
              ? [...prev.codeSnippets, code_snippet]
              : prev.codeSnippets,
          }
        })
        break
      }

      case "generation_complete": {
        // T022: Set final generated code and invalidate queries
        const { generated_code } = lastJsonMessage.data

        setState((prev) => ({
          ...prev,
          status: "complete",
          generatedCode: generated_code,
          progress: 100,
          steps: prev.steps.map((s) => ({
            ...s,
            status: "complete" as StepStatus,
          })),
        }))

        // T024: Invalidate React Query cache to refetch project data
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
        break
      }

      case "generation_error": {
        // T023: Handle generation errors
        const { error } = lastJsonMessage.data

        // T063: Toast notification for generation error
        toast.error(`Ошибка генерации: ${error}`)

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
        // Ignore deploy_* messages (handled by useDeploy hook)
        if (lastJsonMessage.type?.startsWith('deploy_')) {
          break
        }

        // Log warning for truly unknown message types
        console.warn('[WebSocket] Unknown message type received:', lastJsonMessage.type, lastJsonMessage)
        break
      }
    }
  }, [lastJsonMessage, projectId, queryClient])

  // T019: Start generation mutation
  const startGenerationMutation = useMutation({
    mutationFn: (params: {
      template_id: string
      name: string
      description?: string
      features?: string[]
    }) => {
      // T067: Prevent mutation when offline
      if (isOffline) {
        toast.error("Невозможно начать генерацию: нет интернета")
        throw new Error("Offline")
      }
      return apiStartGeneration(projectId, params)
    },
    onSuccess: () => {
      // Reset state to generating on successful API call
      setState({
        ...INITIAL_STATE,
        status: "generating",
        currentStep: 1,
        steps: GENERATION_STEPS.map((s, idx) => ({
          ...s,
          status: idx === 0 ? ("running" as StepStatus) : ("pending" as StepStatus),
        })),
      })
    },
    onError: (error: Error) => {
      // Handle API errors (e.g., insufficient credits, 401, 404)
      // Skip error state if offline (already shown toast)
      if (error.message === "Offline") return

      setState((prev) => ({
        ...prev,
        status: "error",
        error: error.message,
      }))
    },
  })

  // Retry generation: reset state to idle
  const retryGeneration = () => {
    setState(INITIAL_STATE)
  }

  // T055-T056, T059: Cancel generation mutation
  const cancelGenerationMutation = useMutation({
    mutationFn: () => {
      // T067: Prevent mutation when offline
      if (isOffline) {
        toast.error("Невозможно отменить генерацию: нет интернета")
        throw new Error("Offline")
      }
      return apiCancelGeneration(projectId)
    },
    onSuccess: (result) => {
      // T059: Reset state to idle
      setState(INITIAL_STATE)

      // T058: Show credits refunded notification
      toast.success(`Генерация отменена. Возвращено ${result.creditsRefunded} кредитов`)

      // Invalidate queries to refresh balance
      queryClient.invalidateQueries({ queryKey: queryKeys.credits.balance })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
    },
    onError: (error: Error) => {
      // Skip error toast if offline (already shown)
      if (error.message === "Offline") return
      toast.error(`Не удалось отменить: ${error.message}`)
    },
  })

  const cancelGeneration = cancelGenerationMutation.mutate

  return {
    // Generation state
    status: state.status,
    currentStep: state.currentStep,
    steps: state.steps,
    progress: state.progress,
    codeSnippets: state.codeSnippets,
    generatedCode: state.generatedCode,
    error: state.error,

    // Control functions
    startGeneration: startGenerationMutation.mutateAsync,
    cancelGeneration,
    retryGeneration,

    // WebSocket connection state
    isConnected: readyState === ReadyState.OPEN,
    connectionState: readyState,

    // T035: Reconnection state for UI display
    reconnectAttempts,
    isReconnecting,

    // T067: Offline state for UI
    isOffline,
  }
}
