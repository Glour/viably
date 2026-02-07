import { useState, useEffect } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/auth"
import { getAccessToken } from "@/lib/api/tokens"
import { startGeneration as apiStartGeneration } from "@/lib/api/generation"
import { queryKeys } from "@/lib/api/query-keys"
import { GENERATION_STEPS } from "@/lib/data/generation"
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
 *
 * @param projectId - Project UUID to track generation for
 * @returns Hook state and control functions
 */
export function useGeneration(projectId: string) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const token = getAccessToken()

  // Initial state
  const INITIAL_STATE: GenerationProgressState = {
    status: "idle",
    currentStep: 0,
    steps: GENERATION_STEPS.map((s) => ({ ...s, status: "pending" as StepStatus })),
    progress: 0,
    codeSnippets: [],
    generatedCode: null,
    error: null,
  }

  const [state, setState] = useState<GenerationProgressState>(INITIAL_STATE)

  // T020: Construct WebSocket URL with user ID and auth token
  const wsUrl =
    user && token
      ? `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/ws/${user.id}?token=${token}`
      : null

  // T020: Establish WebSocket connection with auto-reconnect
  const { lastJsonMessage, readyState } = useWebSocket<WebSocketMessage>(
    wsUrl,
    {
      share: true, // Multi-tab sync
      shouldReconnect: () => true, // Auto-reconnect on disconnect
      reconnectAttempts: 5,
      reconnectInterval: 3000,
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

        setState((prev) => {
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

      // Ignore other message types (deploy_*, etc.)
      default:
        break
    }
  }, [lastJsonMessage, projectId, queryClient])

  // T019: Start generation mutation
  const startGenerationMutation = useMutation({
    mutationFn: (params: {
      template_id: string
      name: string
      description?: string
      features?: string[]
    }) => apiStartGeneration(projectId, params),
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

  // Cancel generation (optional for now, requires backend support)
  const cancelGeneration = () => {
    // TODO: Implement cancel endpoint when backend supports it
    setState((prev) => ({
      ...prev,
      status: "idle",
      error: "Generation cancelled",
    }))
  }

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

    // WebSocket connection state (optional, for debugging)
    isConnected: readyState === ReadyState.OPEN,
    connectionState: readyState,
  }
}
