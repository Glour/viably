// WebSocket & Generation Flow Integration Types
// Feature: 017-websocket-generation
// See: specs/017-websocket-generation/data-model.md

// Re-export ReadyState from react-use-websocket
export { ReadyState } from 'react-use-websocket'

// === WebSocket Message Types (from backend) ===

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface GenerationProgressMessage {
  type: 'generation_progress'
  project_id: string
  data: {
    step: number
    step_name: string
    step_status: 'running' | 'complete'
    progress: number
    log?: string
    code_snippet?: string
  }
}

export interface GenerationCompleteMessage {
  type: 'generation_complete'
  project_id: string
  data: {
    generated_code: GeneratedFile[]
  }
}

export interface GenerationErrorMessage {
  type: 'generation_error'
  project_id: string
  data: {
    error: string
  }
}

export interface DeploymentInfo {
  platform: string
  url: string
  botUsername: string | null
  botUrl: string | null
  status: 'running' | 'stopped'
  deployedAt: string
}

export interface DeployProgressMessage {
  type: 'deploy_progress'
  project_id: string
  data: {
    step: number
    step_name: string
    step_status: 'running' | 'complete'
    progress: number
    log?: string
  }
}

export interface DeployCompleteMessage {
  type: 'deploy_complete'
  project_id: string
  data: DeploymentInfo
}

export interface DeployErrorMessage {
  type: 'deploy_error'
  project_id: string
  data: {
    error: string
  }
}

export interface CreditsUpdatedMessage {
  type: 'credits_updated'
  project_id: string
  data: {
    balance: number
  }
}

export interface CreditsUsedMessage {
  type: 'credits_used'
  amount: number
  remaining: number
}

// Discriminated union of all WebSocket message types
export type WebSocketMessage =
  | GenerationProgressMessage
  | GenerationCompleteMessage
  | GenerationErrorMessage
  | DeployProgressMessage
  | DeployCompleteMessage
  | DeployErrorMessage
  | CreditsUpdatedMessage
  | CreditsUsedMessage

// === Frontend State Types (for React state management) ===

// Generation Progress State
export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error'
export type StepStatus = 'pending' | 'running' | 'complete' | 'error'

export interface GenerationStep {
  name: string
  status: StepStatus
  progress?: number
  log?: string
}

/**
 * State for tracking AI generation progress
 *
 * Validation rules:
 * - `currentStep` must be 1-6 (inclusive)
 * - `steps.length` must always be 6 (constant)
 * - `progress` must be 0-100 (inclusive)
 * - When `status === 'complete'`, `generatedCode` must not be null
 * - When `status === 'error'`, `error` must not be null
 */
export interface StreamingFileSnippet {
  filename: string
  language: string
  code: string
  complete: boolean
}

export interface GenerationProgressState {
  status: GenerationStatus
  currentStep: number
  steps: GenerationStep[]
  progress: number
  codeSnippets: string[]
  streamingFiles: StreamingFileSnippet[]
  generatedCode: GeneratedFile[] | null
  error: string | null
}

// Deployment Progress State
export type DeployStatus = 'idle' | 'deploying' | 'success' | 'error'

export interface DeployStep {
  name: string
  status: StepStatus
  log?: string
}

/**
 * State for tracking deployment progress
 *
 * Validation rules:
 * - `currentStep` must be 1-6 (inclusive)
 * - `steps.length` must always be 6 (constant)
 * - `progress` must be 0-100 (inclusive)
 * - When `status === 'success'`, `deploymentInfo` must not be null
 * - When `status === 'error'`, `error` must not be null
 */
export interface DeployProgressState {
  status: DeployStatus
  currentStep: number
  steps: DeployStep[]
  progress: number
  deploymentInfo: DeploymentInfo | null
  error: string | null
}

// WebSocket Connection State
/**
 * State for tracking WebSocket connection status
 *
 * Validation rules:
 * - `reconnectAttempts` cannot exceed 5 (per FR-005)
 * - `lastError` resets to null on successful connection
 * - `isConnected` is computed: true when readyState === ReadyState.OPEN
 */
export interface WebSocketConnectionState {
  readyState: ReadyState
  reconnectAttempts: number
  isConnected: boolean
  lastError: string | null
}
