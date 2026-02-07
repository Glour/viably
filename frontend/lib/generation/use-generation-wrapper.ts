"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useGeneration as useWebSocketGeneration } from "@/lib/hooks/use-generation"
import { useProject } from "@/lib/hooks/use-projects"
import { useTemplate } from "@/lib/hooks/use-templates"
import { downloadGeneratedCode } from "@/lib/api/generation"
import type {
  ConfigFormValues,
  DeployConfig,
  Template,
  GenerationSession,
  DeploymentSession,
  ProjectFile,
} from "@/types"
import type { GeneratedFile } from "@/types/websocket"

/**
 * Wrapper hook that bridges new WebSocket-based generation hook
 * with old API expected by generate page
 *
 * Purpose: T026 preparation - maintain compatibility while migrating to WebSocket
 *
 * Old API shape:
 * - generation: GenerationSession (with steps: GenerationStep[])
 * - deployment: DeploymentSession
 * - formValues, freeTextInput
 * - template loading
 * - startGeneration, retryGeneration, resetGeneration
 * - downloadCode, canGenerate, isGenerating
 *
 * New WebSocket hook shape:
 * - status, currentStep, steps, progress, generatedCode, error
 * - startGeneration(params), retryGeneration()
 * - No form state, no template loading
 */
export function useGenerationWrapper(projectId: string) {
  // Use new WebSocket hook for real-time generation
  const wsGeneration = useWebSocketGeneration(projectId)

  // Load project to get template ID
  const { data: project } = useProject(projectId)

  // Load template based on project's template ID
  const { data: templateDetail } = useTemplate(project?.templateId || "")

  // Form state (client-side only for now)
  const [formValues, setFormValues] = useState<ConfigFormValues>({})
  const [freeTextInput, setFreeTextInput] = useState("")

  // Map backend template detail to frontend Template shape
  const template = useMemo<Template | null>(() => {
    if (!templateDetail) return null

    // Convert backend ApiTemplateDetail to frontend Template
    return {
      slug: templateDetail.slug,
      name: templateDetail.name,
      emoji: "🤖", // Default emoji (backend doesn't provide this)
      description: templateDetail.description,
      category: templateDetail.category as "telegram_bot",
      creditCost: templateDetail.creditCost,
      features: templateDetail.features,
      tags: templateDetail.tags,
      configFields: [], // TODO: Parse configSchema to ConfigField[] if needed
      isPopular: templateDetail.usageCount > 100, // Heuristic for popularity
    }
  }, [templateDetail])

  // Map WebSocket state to old GenerationSession shape
  const generation = useMemo<GenerationSession>(() => {
    // Map step statuses from new StepStatus to old GenerationStepStatus
    const mapStepStatus = (status: string) => {
      switch (status) {
        case "pending":
          return "pending"
        case "running":
          return "running"
        case "complete":
          return "done"
        case "error":
          return "error"
        default:
          return "pending"
      }
    }

    return {
      status: wsGeneration.status,
      currentStep: wsGeneration.currentStep,
      steps: wsGeneration.steps.map((step, idx) => ({
        id: `step-${idx}`,
        name: step.name,
        status: mapStepStatus(step.status),
        duration: null, // WebSocket hook doesn't track duration
      })),
      progress: wsGeneration.progress,
      code: wsGeneration.generatedCode
        ? {
            files: convertGeneratedFilesToProjectFiles(wsGeneration.generatedCode),
            totalFiles: wsGeneration.generatedCode.length,
            totalLines: calculateTotalLines(wsGeneration.generatedCode),
          }
        : null,
      error: wsGeneration.error,
      startedAt: null, // WebSocket hook doesn't track timestamps
      completedAt: null,
      codeSnippets: wsGeneration.codeSnippets,
    }
  }, [wsGeneration])

  // Deployment state (stub for Phase 6)
  const deployment = useMemo<DeploymentSession>(
    () => ({
      status: "config",
      steps: [],
      currentStep: 0,
      progress: 0,
      botInfo: null,
      error: null,
    }),
    []
  )

  // Wrap startGeneration to pass params from formValues
  const startGeneration = useCallback(async () => {
    if (!template || !project) return

    await wsGeneration.startGeneration({
      template_id: template.slug,
      name: project.name,
      description: project.description || undefined,
      features: Array.isArray(formValues.features)
        ? (formValues.features as string[])
        : [],
    })
  }, [wsGeneration, template, project, formValues])

  const retryGeneration = useCallback(() => {
    wsGeneration.retryGeneration()
  }, [wsGeneration])

  const resetGeneration = useCallback(() => {
    wsGeneration.retryGeneration() // Same as retry for now
  }, [wsGeneration])

  // Download code (use new API or old depending on availability)
  const downloadCode = useCallback(async () => {
    if (wsGeneration.generatedCode) {
      const projectFiles = convertGeneratedFilesToProjectFiles(
        wsGeneration.generatedCode
      )
      await downloadGeneratedCode(projectFiles)
    }
  }, [wsGeneration.generatedCode])

  // Deployment stubs (Phase 6)
  const startDeployment = useCallback(async (config: DeployConfig) => {
    console.warn("Deployment not implemented yet (Phase 6)")
  }, [])

  // Computed flags
  const canGenerate = useMemo(() => {
    return wsGeneration.status === "idle" && !!template
  }, [wsGeneration.status, template])

  const isGenerating = useMemo(() => {
    return wsGeneration.status === "generating"
  }, [wsGeneration.status])

  return {
    generation,
    deployment,
    formValues,
    freeTextInput,
    template,
    setFormValues,
    setFreeTextInput,
    startGeneration,
    retryGeneration,
    resetGeneration,
    cancelGeneration: wsGeneration.cancelGeneration,
    startDeployment,
    downloadCode,
    canGenerate,
    isGenerating,
    // T035: Reconnection state for UI display (T036-T037)
    reconnectAttempts: wsGeneration.reconnectAttempts,
    isReconnecting: wsGeneration.isReconnecting,
    maxReconnectAttempts: 5, // From MAX_RECONNECT_ATTEMPTS constant
  }
}

/**
 * Convert backend GeneratedFile[] to frontend ProjectFile[]
 *
 * Backend shape:
 * { path: "main.py", content: "...", language: "python" }
 *
 * Frontend shape:
 * { path: "main.py", name: "main.py", type: "file", content: "..." }
 *
 * This conversion flattens the file structure (no nested folders for now)
 */
function convertGeneratedFilesToProjectFiles(
  generatedFiles: GeneratedFile[]
): ProjectFile[] {
  return generatedFiles.map((file) => ({
    path: file.path,
    name: file.path.split("/").pop() || file.path,
    type: "file" as const,
    content: file.content,
  }))
}

/**
 * Calculate total lines of code from generated files
 */
function calculateTotalLines(generatedFiles: GeneratedFile[]): number {
  return generatedFiles.reduce((total, file) => {
    return total + (file.content.split("\n").length || 0)
  }, 0)
}
