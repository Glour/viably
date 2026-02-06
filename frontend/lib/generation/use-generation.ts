"use client"

import { useEffect, useRef, useCallback } from "react"
import { useGenerationStore } from "@/stores/generation"
import { getTemplateForProject, downloadGeneratedCode } from "@/lib/api/generation"
import { MOCK_GENERATED_FILES } from "@/lib/data/generation"
import type {
  GenerationSession,
  DeploymentSession,
  ConfigFormValues,
  Template,
  DeployConfig,
} from "@/types"

/**
 * Sleep utility for async delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate total files and lines from the generated file tree
 */
function calculateCodeStats(files: typeof MOCK_GENERATED_FILES) {
  let totalFiles = 0
  let totalLines = 0

  function traverse(items: typeof MOCK_GENERATED_FILES) {
    for (const item of items) {
      if (item.type === "file") {
        totalFiles++
        if (item.content) {
          totalLines += item.content.split("\n").length
        }
      }
      if (item.children) {
        traverse(item.children)
      }
    }
  }

  traverse(files)
  return { totalFiles, totalLines }
}

/**
 * Core custom hook that manages the generation flow simulation.
 *
 * Wraps the Zustand store and adds setTimeout-based simulation logic for:
 * - Code generation with sequential steps
 * - Deployment with sequential steps
 * - Error simulation (10% chance per generation step, 5% per deployment step)
 *
 * @param projectId - The project ID to manage generation for
 */
export function useGeneration(projectId: string) {
  const store = useGenerationStore()
  const generationCancelledRef = useRef(false)
  const deploymentCancelledRef = useRef(false)
  const startTimeRef = useRef<number>(0)

  // Load template on mount
  useEffect(() => {
    let mounted = true

    async function loadTemplate() {
      const response = await getTemplateForProject(projectId)
      if (mounted && response.success) {
        store.setProjectContext(projectId, response.template)
      }
    }

    loadTemplate()

    return () => {
      mounted = false
    }
  }, [projectId, store])

  /**
   * Start code generation simulation
   *
   * Runs 6 sequential steps with random delays (2-5s each).
   * 10% chance of error on each step.
   * Updates progress and step status in real-time.
   */
  const startGeneration = useCallback(async () => {
    // Reset state
    store.startGeneration()
    generationCancelledRef.current = false
    startTimeRef.current = Date.now()

    try {
      const steps = store.generation.steps
      const totalSteps = steps.length

      // Run each step sequentially
      for (let i = 0; i < totalSteps; i++) {
        if (generationCancelledRef.current) {
          return
        }

        const stepStartTime = Date.now()

        // Mark step as running
        store._updateStep(i, "running", null)

        // Random delay 2-5 seconds
        const delay = Math.random() * 3000 + 2000
        await sleep(delay)

        if (generationCancelledRef.current) {
          return
        }

        // 10% chance of error
        if (Math.random() < 0.1) {
          const elapsed = Date.now() - stepStartTime
          store._updateStep(i, "error", elapsed)
          store._failGeneration(`Generation failed at step: ${steps[i].name}`)
          return
        }

        // Mark step as done
        const elapsed = Date.now() - stepStartTime
        store._updateStep(i, "done", elapsed)

        // Update progress
        const progress = ((i + 1) / totalSteps) * 100
        store._setProgress(progress)
      }

      // Generation complete
      if (!generationCancelledRef.current) {
        const { totalFiles, totalLines } = calculateCodeStats(MOCK_GENERATED_FILES)
        store._completeGeneration({
          files: MOCK_GENERATED_FILES,
          totalFiles,
          totalLines,
        })
      }
    } catch (error) {
      if (!generationCancelledRef.current) {
        store._failGeneration(
          error instanceof Error ? error.message : "Unknown error occurred"
        )
      }
    }
  }, [store])

  /**
   * Retry generation after an error
   *
   * Cancels any active simulation and starts fresh.
   */
  const retryGeneration = useCallback(() => {
    // Cancel current simulation
    generationCancelledRef.current = true

    // Start new generation
    setTimeout(() => {
      startGeneration()
    }, 100)
  }, [startGeneration])

  /**
   * Start deployment simulation
   *
   * Runs 6 sequential deployment steps with random delays (1-3s each).
   * 5% chance of error on each step.
   *
   * @param config - Deployment configuration (bot token, env vars)
   */
  const startDeployment = useCallback(
    async (config: DeployConfig) => {
      // Reset state
      store.startDeployment(config)
      deploymentCancelledRef.current = false

      try {
        const steps = store.deployment.steps
        const totalSteps = steps.length

        // Run each step sequentially
        for (let i = 0; i < totalSteps; i++) {
          if (deploymentCancelledRef.current) {
            return
          }

          const stepStartTime = Date.now()

          // Mark step as running
          store._updateDeployStep(i, "running", null)

          // Random delay 1-3 seconds
          const delay = Math.random() * 2000 + 1000
          await sleep(delay)

          if (deploymentCancelledRef.current) {
            return
          }

          // 5% chance of error
          if (Math.random() < 0.05) {
            const elapsed = Date.now() - stepStartTime
            store._updateDeployStep(i, "error", elapsed)
            store._failDeployment(`Deployment failed at step: ${steps[i].name}`)
            return
          }

          // Mark step as done
          const elapsed = Date.now() - stepStartTime
          store._updateDeployStep(i, "done", elapsed)

          // Update progress
          const progress = ((i + 1) / totalSteps) * 100
          store._setProgress(progress)
        }

        // Deployment complete
        if (!deploymentCancelledRef.current) {
          store._completeDeployment({
            username: "my_awesome_bot",
            url: "https://t.me/my_awesome_bot",
            status: "running",
          })
        }
      } catch (error) {
        if (!deploymentCancelledRef.current) {
          store._failDeployment(
            error instanceof Error ? error.message : "Unknown error occurred"
          )
        }
      }
    },
    [store]
  )

  /**
   * Download generated code as ZIP
   *
   * Uses the API layer to create and download a ZIP file.
   */
  const downloadCode = useCallback(async () => {
    if (!store.generation.code) {
      throw new Error("No code to download")
    }

    await downloadGeneratedCode(store.generation.code.files)
  }, [store.generation.code])

  /**
   * Computed: Can generation start?
   *
   * True if:
   * - Template is loaded
   * - AND (form has all required fields filled OR free text is non-empty)
   */
  const canGenerate = useCallback((): boolean => {
    if (!store.template) {
      return false
    }

    // If free text input is provided, allow generation
    if (store.freeTextInput.trim() !== "") {
      return true
    }

    // Otherwise, check if all required form fields are filled
    const requiredFields = store.template.configFields.filter((f) => f.required)

    for (const field of requiredFields) {
      const value = store.formValues[field.name]

      // Check if field is empty
      if (value === undefined || value === null || value === "") {
        return false
      }

      // For arrays (multiselect), check length
      if (Array.isArray(value) && value.length === 0) {
        return false
      }
    }

    return true
  }, [store.template, store.formValues, store.freeTextInput])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generationCancelledRef.current = true
      deploymentCancelledRef.current = true
    }
  }, [])

  return {
    // State (from store)
    generation: store.generation,
    deployment: store.deployment,
    formValues: store.formValues,
    freeTextInput: store.freeTextInput,
    template: store.template,

    // Actions
    setFormValues: store.setFormValues,
    setFreeTextInput: store.setFreeTextInput,
    startGeneration,
    retryGeneration,
    resetGeneration: store.resetGeneration,
    startDeployment,
    downloadCode,

    // Computed
    canGenerate: canGenerate(),
    isGenerating: store.generation.status === "generating",
    isComplete: store.generation.status === "complete",
    isError: store.generation.status === "error",
  }
}
