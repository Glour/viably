/**
 * TypeScript types for Conversation-based AI system
 * Matches backend Pydantic schemas
 */

// ============================================================================
// Basic Types
// ============================================================================

export type MessageRole = "user" | "assistant" | "system"

export type ArtifactType =
  | "html"
  | "react"
  | "vue"
  | "svelte"
  | "python"
  | "javascript"
  | "typescript"
  | "css"
  | "json"
  | "yaml"
  | "toml"
  | "ini"
  | "markdown"
  | "text"

// ============================================================================
// Conversation
// ============================================================================

export interface Conversation {
  id: string
  project_id: string
  user_id: string
  title: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ConversationCreate {
  project_id: string
  title?: string
}

export interface ConversationUpdate {
  title?: string
  metadata?: Record<string, any>
}

// ============================================================================
// Message
// ============================================================================

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  tokens_used: number
  created_at: string
}

export interface MessageCreate {
  content: string
}

export interface MessageWithArtifacts extends Message {
  artifacts: Artifact[]
}

// ============================================================================
// Artifact
// ============================================================================

export interface Artifact {
  id: string
  conversation_id: string
  message_id: string
  type: ArtifactType
  title: string | null
  content: string
  language: string
  version: number
  parent_artifact_id: string | null
  created_at: string
}

export interface ArtifactUpdate {
  content: string
  title?: string
}

export interface ArtifactVersion {
  id: string
  version: number
  created_at: string
}

// ============================================================================
// Composite Types
// ============================================================================

export interface ConversationDetail extends Conversation {
  messages: MessageWithArtifacts[]
}

// ============================================================================
// List Responses
// ============================================================================

export interface ConversationListResponse {
  items: Conversation[]
  total: number
  limit: number
  offset: number
}

export interface MessageListResponse {
  items: MessageWithArtifacts[]
  total: number
  limit: number
  offset: number
}

export interface ArtifactListResponse {
  items: Artifact[]
  total: number
}

// ============================================================================
// WebSocket Events
// ============================================================================

export interface WSTokenEvent {
  type: "token"
  content: string
}

export interface WSArtifactCompleteEvent {
  type: "artifact_complete"
  artifact_id: string
  artifact: Artifact
}

export interface WSMessageCompleteEvent {
  type: "message_complete"
  message_id: string
  tokens_used: number
}

export interface WSErrorEvent {
  type: "error"
  error: string
  code?: string
  details?: Record<string, any>
}

export interface WSCorrectionEvent {
  type: "correction"
  message: string
  errors_count?: number
}

export interface WSSuggestionsEvent {
  type: "suggestions"
  items: string[]
}

export interface WSPlanEvent {
  type: "plan"
  content: string
}

export interface WSToolCallEvent {
  type: "tool_call"
  tool_name: string
  tool_input: Record<string, any>
  iteration: number
}

export interface WSToolResultEvent {
  type: "tool_result"
  tool_name: string
  success: boolean
  summary: string
  iteration: number
}

export interface WSIterationEvent {
  type: "iteration"
  current: number
  max: number
  tokens_used: number
}

export interface WSFinalTextEvent {
  type: "final_text"
  content: string
}

export interface WSCreditsUsedEvent {
  type: "credits_used"
  amount: number
  remaining: number
}

export type WSEvent =
  | WSTokenEvent
  | WSArtifactCompleteEvent
  | WSMessageCompleteEvent
  | WSErrorEvent
  | WSCorrectionEvent
  | WSSuggestionsEvent
  | WSPlanEvent
  | WSToolCallEvent
  | WSToolResultEvent
  | WSIterationEvent
  | WSFinalTextEvent
  | WSCreditsUsedEvent

// ============================================================================
// Store State (for Zustand)
// ============================================================================

export interface ConversationState {
  // Current conversation
  currentConversation: ConversationDetail | null

  // Messages (optimistic updates)
  messages: MessageWithArtifacts[]

  // Artifacts map for quick access
  artifacts: Map<string, Artifact>

  // UI state
  activeArtifactId: string | null
  isStreaming: boolean
  streamingContent: string
  suggestions: string[]
  plan: string | null

  // Credits tracking
  lastCreditsUsed: number | null
  creditsRemaining: number | null

  // Error state (null = no error)
  lastError: { message: string; code?: string } | null

  // Actions
  loadConversation: (conversationId: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  selectArtifact: (artifactId: string) => void
  updateArtifact: (artifactId: string, update: ArtifactUpdate) => Promise<Artifact>
  clearError: () => void

  // WebSocket handling
  handleWSEvent: (event: WSEvent) => void

  // Reset
  reset: () => void
}

// ============================================================================
// API Client Types
// ============================================================================

export interface ConversationAPIClient {
  // Conversations
  createConversation: (data: ConversationCreate) => Promise<Conversation>
  getConversation: (id: string) => Promise<ConversationDetail>
  updateConversation: (id: string, data: ConversationUpdate) => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>
  listConversations: (projectId: string, params?: { limit?: number; offset?: number }) => Promise<ConversationListResponse>

  // Messages
  sendMessage: (conversationId: string, data: MessageCreate) => Promise<void>  // Uses WebSocket
  getMessages: (conversationId: string, params?: { limit?: number; offset?: number }) => Promise<MessageListResponse>

  // Artifacts
  getArtifacts: (conversationId: string) => Promise<ArtifactListResponse>
  updateArtifact: (artifactId: string, data: ArtifactUpdate) => Promise<Artifact>
  getArtifactVersions: (artifactId: string) => Promise<ArtifactVersion[]>
}

// ============================================================================
// Component Props
// ============================================================================

export interface ChatPanelProps {
  conversationId: string
  className?: string
  welcomeMessage?: string
  templateCategory?: string
}

export interface MessageListProps {
  messages: MessageWithArtifacts[]
  isStreaming?: boolean
  streamingContent?: string
}

export interface MessageInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export interface ArtifactPreviewPanelProps {
  artifacts: Artifact[]
  activeArtifactId: string | null
  onSelectArtifact: (artifactId: string) => void
  onUpdateArtifact: (artifactId: string, update: ArtifactUpdate) => Promise<void>
}

export interface HTMLPreviewProps {
  html: string
  className?: string
}

export interface CodeEditorProps {
  value: string
  language: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}
