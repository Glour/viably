import { create } from "zustand"
import type {
  GenerationStoreState,
  GenerationStep,
  DeploymentStep,
  Template,
  ConfigFormValues,
  DeployConfig,
  GeneratedCode,
  DeployedBotInfo,
  GenerationStepStatus,
  DeploymentStepStatus,
} from "@/types"

const DEFAULT_GENERATION_STEPS: GenerationStep[] = [
  { id: "analyze", name: "Analyzing template", status: "pending", duration: null },
  { id: "architecture", name: "Generating architecture", status: "pending", duration: null },
  { id: "code", name: "Writing code", status: "pending", duration: null },
  { id: "review", name: "Code review", status: "pending", duration: null },
  { id: "testing", name: "Testing", status: "pending", duration: null },
  { id: "finalize", name: "Finalizing", status: "pending", duration: null },
]

const DEFAULT_DEPLOYMENT_STEPS: DeploymentStep[] = [
  { id: "github", name: "Creating GitHub repo", status: "pending", duration: null },
  { id: "push", name: "Pushing code", status: "pending", duration: null },
  { id: "railway", name: "Connecting to Railway", status: "pending", duration: null },
  { id: "build", name: "Building container", status: "pending", duration: null },
  { id: "start", name: "Starting bot", status: "pending", duration: null },
  { id: "health", name: "Health check", status: "pending", duration: null },
]

export const useGenerationStore = create<GenerationStoreState>((set, get) => ({
  projectId: null,
  template: null,
  formValues: {},
  freeTextInput: "",

  generation: {
    status: "idle",
    currentStep: 0,
    steps: DEFAULT_GENERATION_STEPS.map((s) => ({ ...s })),
    progress: 0,
    code: null,
    error: null,
    startedAt: null,
    completedAt: null,
  },

  deployment: {
    status: "config",
    steps: DEFAULT_DEPLOYMENT_STEPS.map((s) => ({ ...s })),
    currentStep: 0,
    progress: 0,
    botInfo: null,
    error: null,
  },

  setProjectContext: (projectId: string, template: Template) => {
    set({ projectId, template })
  },

  setFormValues: (values: ConfigFormValues) => {
    set({ formValues: { ...get().formValues, ...values } })
  },

  setFreeTextInput: (text: string) => {
    set({ freeTextInput: text })
  },

  startGeneration: () => {
    set({
      generation: {
        status: "generating",
        currentStep: 0,
        steps: DEFAULT_GENERATION_STEPS.map((s) => ({ ...s })),
        progress: 0,
        code: null,
        error: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
    })
  },

  retryGeneration: () => {
    set({
      generation: {
        status: "generating",
        currentStep: 0,
        steps: DEFAULT_GENERATION_STEPS.map((s) => ({ ...s })),
        progress: 0,
        code: null,
        error: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      },
    })
  },

  resetGeneration: () => {
    set({
      generation: {
        status: "idle",
        currentStep: 0,
        steps: DEFAULT_GENERATION_STEPS.map((s) => ({ ...s })),
        progress: 0,
        code: null,
        error: null,
        startedAt: null,
        completedAt: null,
      },
    })
  },

  startDeployment: (config: DeployConfig) => {
    set({
      deployment: {
        status: "deploying",
        steps: DEFAULT_DEPLOYMENT_STEPS.map((s) => ({ ...s })),
        currentStep: 0,
        progress: 0,
        botInfo: null,
        error: null,
      },
    })
  },

  resetDeployment: () => {
    set({
      deployment: {
        status: "config",
        steps: DEFAULT_DEPLOYMENT_STEPS.map((s) => ({ ...s })),
        currentStep: 0,
        progress: 0,
        botInfo: null,
        error: null,
      },
    })
  },

  _updateStep: (stepIndex: number, status: GenerationStepStatus, duration: number | null) => {
    const { generation } = get()
    const updatedSteps = [...generation.steps]
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status, duration }

    set({
      generation: {
        ...generation,
        steps: updatedSteps,
        currentStep: stepIndex,
      },
    })
  },

  _setProgress: (progress: number) => {
    const { generation } = get()
    set({
      generation: {
        ...generation,
        progress,
      },
    })
  },

  _completeGeneration: (code: GeneratedCode) => {
    const { generation } = get()
    set({
      generation: {
        ...generation,
        status: "complete",
        code,
        completedAt: new Date().toISOString(),
      },
    })
  },

  _failGeneration: (error: string) => {
    const { generation } = get()
    set({
      generation: {
        ...generation,
        status: "error",
        error,
      },
    })
  },

  _updateDeployStep: (stepIndex: number, status: DeploymentStepStatus, duration: number | null) => {
    const { deployment } = get()
    const updatedSteps = [...deployment.steps]
    updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status, duration }

    set({
      deployment: {
        ...deployment,
        steps: updatedSteps,
        currentStep: stepIndex,
      },
    })
  },

  _completeDeployment: (botInfo: DeployedBotInfo) => {
    const { deployment } = get()
    set({
      deployment: {
        ...deployment,
        status: "success",
        botInfo,
        progress: 100,
      },
    })
  },

  _failDeployment: (error: string) => {
    const { deployment } = get()
    set({
      deployment: {
        ...deployment,
        status: "failure",
        error,
      },
    })
  },
}))
