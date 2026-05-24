// WebSocket-specific types for generation
// Re-exports from websocket.ts for feature isolation

export type {
  GeneratedFile,
  GenerationProgressMessage,
  GenerationCompleteMessage,
  GenerationErrorMessage,
  DeploymentInfo,
  DeployProgressMessage,
  DeployCompleteMessage,
  DeployErrorMessage,
  CreditsUpdatedMessage,
  WebSocketMessage,
  GenerationProgressState,
  StepStatus,
  GenerationStep as WSGenerationStep,
  StreamingFileSnippet,
  DeployProgressState,
  DeployStep,
  DeployStatus,
  WebSocketConnectionState,
  ReadyState,
} from './websocket'
