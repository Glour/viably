// Generation Feature Public API

// Components
export {
  GenerationChatPanel,
  PreviewPanel,
  ChatPanel,
  MessageBubble,
  MessageInput,
  MessageList,
  IdleState,
  GenerationProgress,
  CompleteState,
  ErrorState,
  MonacoEditorDynamic,
  MonacoEditorInternal,
  ConfigForm,
  FreeTextInput,
  CompactNavbar,
  MobileTabs,
  GenerationErrorBoundary,
  CodeSnippetAnimation,
  DeployModal,
  DeployProgress,
  DeploySuccess,
} from './components'

// WebSocket
export { ConversationWebSocket } from './websocket'

// Stores
export { useGenerationStore } from './stores'

// Types
export type {
  GenerationStatus,
  GenerationStepStatus,
  GenerationStep,
  GenerationSession,
  GenerationStoreState,
  DeploymentStatus,
  DeploymentStepStatus,
  DeploymentStep,
  DeploymentSession,
  DeployConfig,
  GeneratedCode,
  DeployedBotInfo,
  ConfigFormValues,
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
  StreamingFileSnippet,
  DeployProgressState,
  DeployStep,
  DeployStatus,
  WebSocketConnectionState,
  ReadyState,
} from './types'

// API
export {
  downloadProjectZip,
  startDeploy,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  listConversations,
  getMessages,
  getArtifacts,
  updateArtifact,
  getArtifactVersions,
  useConversation,
  useConversations,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation,
  useUpdateArtifact,
} from './api'
