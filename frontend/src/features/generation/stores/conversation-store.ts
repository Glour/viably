import { create } from "zustand"
import { toast } from "sonner"
import type {
  ConversationState,
  ConversationDetail,
  MessageWithArtifacts,
  Artifact,
  ArtifactUpdate,
  WSEvent,
  MessageRole,
} from "@/features/generation/types"
import { getConversation, updateArtifact as apiUpdateArtifact } from "@/features/generation/api"
import { ConversationWebSocket } from "@/features/generation/websocket/conversation-websocket"

function _toolCallLabel(toolName: string, toolInput: Record<string, any>): string {
  switch (toolName) {
    case "create_file":
      return `Создаю ${toolInput.path || "файл"}...`
    case "update_file":
      return `Обновляю ${toolInput.path || "файл"}...`
    case "read_file":
      return `Читаю ${toolInput.path || "файл"}...`
    case "validate_project":
      return "Проверяю код на ошибки..."
    case "list_files":
      return "Просматриваю структуру проекта..."
    default:
      return `${toolName}...`
  }
}

function _toolResultLabel(toolName: string, success: boolean): string {
  if (toolName === "validate_project") {
    return success ? "Код прошёл проверку" : "Исправляю ошибки..."
  }
  // For file operations, keep showing the tool_call label (it will be overwritten)
  return ""
}

/**
 * Zustand store for conversation UI state management
 *
 * Features:
 * - Load conversation with messages and artifacts
 * - Send messages via WebSocket with optimistic updates
 * - Handle streaming responses with real-time artifact creation
 * - Manage artifact selection and updates
 * - Track streaming state for UI animations
 *
 * Architecture:
 * Component → useConversationStore → ConversationWebSocket → Backend WS
 */
export const useConversationStore = create<ConversationState>((set, get) => {
  let websocket: ConversationWebSocket | null = null

  return {
    // === State ===
    currentConversation: null,
    messages: [],
    artifacts: new Map(),
    activeArtifactId: null,
    isStreaming: false,
    streamingContent: "",
    lastError: null,
    suggestions: [],
    plan: null,
    lastCreditsUsed: null as number | null,
    creditsRemaining: null as number | null,

    // === Actions ===

    /**
     * Load conversation with all messages and artifacts
     * @param conversationId - Conversation UUID
     */
    loadConversation: async (conversationId: string) => {
      try {
        const conversation = await getConversation(conversationId)

        // Build artifacts map: deduplicate by title, keep highest version
        // When AI rewrites a file it creates a new artifact with same title but new id/version
        const allArtifacts: Artifact[] = []
        conversation.messages.forEach((msg) => {
          msg.artifacts.forEach((artifact) => allArtifacts.push(artifact))
        })

        // For each unique title keep only the latest artifact (by created_at)
        // Backend always sets version=1, so we use timestamp to pick the newest rewrite
        const latestByTitle = new Map<string, Artifact>()
        allArtifacts.forEach((artifact) => {
          const key = artifact.title || artifact.id
          const existing = latestByTitle.get(key)
          if (!existing || new Date(artifact.created_at) > new Date(existing.created_at)) {
            latestByTitle.set(key, artifact)
          }
        })

        // Build final map by id (using deduplicated latest versions)
        const artifactsMap = new Map<string, Artifact>()
        latestByTitle.forEach((artifact) => {
          artifactsMap.set(artifact.id, artifact)
        })

        set({
          currentConversation: conversation,
          messages: conversation.messages,
          artifacts: artifactsMap,
          activeArtifactId: null,
          isStreaming: false,
          streamingContent: "",
        })

        // Initialize WebSocket connection
        const ws = new ConversationWebSocket(conversationId, get().handleWSEvent)
        ws.connect()
        websocket = ws
      } catch (error) {
        console.error("[ConversationStore] Failed to load conversation:", error)
        throw error
      }
    },

    /**
     * Send message to AI with optimistic update
     * @param content - User message content (max 10k chars)
     */
    sendMessage: async (content: string) => {
      const { currentConversation } = get()
      if (!currentConversation) {
        throw new Error("No active conversation")
      }

      // Validate content length
      if (content.length > 10000) {
        throw new Error("Message too long (max 10,000 characters)")
      }

      // Clear previous error on new send attempt
      set({ lastError: null })

      // Optimistic update: add user message immediately
      const optimisticMessage: MessageWithArtifacts = {
        id: `temp-${Date.now()}`,
        conversation_id: currentConversation.id,
        role: "user" as MessageRole,
        content,
        tokens_used: 0,
        created_at: new Date().toISOString(),
        artifacts: [],
      }

      set({
        messages: [...get().messages, optimisticMessage],
        isStreaming: true,
        streamingContent: "",
        suggestions: [],
        plan: null,
      })

      // Send via REST endpoint (replaces WebSocket streaming)
      try {
        const { getAccessToken } = await import("@/shared/api/tokens")
        const token = await getAccessToken()
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
        const resp = await fetch(
          `${apiBase}/api/conversations/${currentConversation.id}/generate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
          }
        )

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ detail: resp.statusText }))
          throw new Error(err.detail || "Generation failed")
        }

        const result = await resp.json()

        // Process artifacts from response
        if (result.artifacts?.length) {
          const newArtifacts = new Map(get().artifacts)
          for (const artifact of result.artifacts) {
            const artId = artifact.id || `art-${Date.now()}-${Math.random()}`
            newArtifacts.set(artId, artifact)
          }
          set({ artifacts: newArtifacts, activeArtifactId: result.artifacts[0]?.id })
        }

        const aiMessage: MessageWithArtifacts = {
          id: result.message_id || `msg-${Date.now()}`,
          conversation_id: currentConversation.id,
          role: "assistant" as MessageRole,
          content: result.text || "",
          tokens_used: result.usage?.output_tokens || 0,
          created_at: new Date().toISOString(),
          artifacts: result.artifacts || [],
        }

        set({
          messages: [...get().messages, aiMessage],
          isStreaming: false,
          streamingContent: "",
        })
      } catch (err) {
        console.error("[ConversationStore] Generation failed:", err)
        set({
          messages: get().messages.filter((m) => m.id !== optimisticMessage.id),
          isStreaming: false,
          lastError: {
            message: err instanceof Error ? err.message : "Generation failed",
          },
        })
        throw err
      }
    },

    /**
     * Handle WebSocket events from backend
     * @param event - Discriminated union of WS event types
     */
    handleWSEvent: (event: WSEvent) => {
      switch (event.type) {
        case "plan": {
          // AI generated a plan before coding
          set({ plan: event.content })
          break
        }

        case "token": {
          // Accumulate streaming content for AI response (legacy path)
          set({
            streamingContent: get().streamingContent + event.content,
          })
          break
        }

        case "final_text": {
          // Agent loop: final clean response — replaces any progress indicators
          set({ streamingContent: event.content })
          break
        }

        case "artifact_complete": {
          // Artifact is fully created
          const { artifact_id, artifact } = event
          const { artifacts } = get()

          const isFirstArtifact = artifacts.size === 0

          const newArtifacts = new Map(artifacts)

          // If an artifact with the same title already exists (AI is rewriting a file),
          // remove the old one and replace with the new version
          if (artifact.title) {
            for (const [existingId, existing] of newArtifacts.entries()) {
              if (existing.title === artifact.title && existingId !== artifact_id) {
                newArtifacts.delete(existingId)
                break
              }
            }
          }

          newArtifacts.set(artifact_id, artifact)

          set({
            artifacts: newArtifacts,
            // Auto-select newly created artifact
            activeArtifactId: artifact_id,
          })

          // Celebrate first artifact with confetti
          if (isFirstArtifact) {
            // Delay slightly to ensure UI is ready
            setTimeout(() => {
              // celebrateFirstArtifact() - DISABLED
            }, 300)
          }
          break
        }

        case "message_complete": {
          // AI message is fully streamed
          const { message_id, tokens_used } = event
          const { streamingContent, messages } = get()

          // Create complete AI message
          const aiMessage: MessageWithArtifacts = {
            id: message_id,
            conversation_id: get().currentConversation!.id,
            role: "assistant" as MessageRole,
            content: streamingContent,
            tokens_used,
            created_at: new Date().toISOString(),
            artifacts: [], // Artifacts are already in the map
          }

          // Remove optimistic user message (should already have real ID)
          // Add completed AI message
          set({
            messages: [...messages, aiMessage],
            isStreaming: false,
            streamingContent: "",
          })
          break
        }

        case "credits_used": {
          // Post-pay credit deduction info
          const remaining = event.remaining
          set({
            lastCreditsUsed: event.amount,
            creditsRemaining: remaining,
          })

          // Low balance warning (< 10 credits)
          if (remaining > 0 && remaining < 10) {
            toast.warning("Осталось мало кредитов", {
              description: `Осталось ${remaining} кредитов. Пополните баланс.`,
              action: {
                label: "Купить",
                onClick: () => {
                  window.location.href = "/subscription"
                },
              },
            })
          }
          break
        }

        case "correction": {
          // AI is self-correcting code issues
          set({ streamingContent: `\u{1F504} ${event.message}` })
          break
        }

        case "suggestions": {
          // Follow-up suggestion chips from AI
          set({ suggestions: event.items || [] })
          break
        }

        case "tool_call": {
          // Agent loop: AI is calling a tool (create_file, validate_project, etc.)
          const toolLabel = _toolCallLabel(event.tool_name, event.tool_input)
          set({
            streamingContent: `\u{1F527} ${toolLabel}`,
          })
          break
        }

        case "tool_result": {
          // Agent loop: tool execution result — show friendly label, not raw summary
          const resultLabel = _toolResultLabel(event.tool_name, event.success)
          if (resultLabel) {
            set({ streamingContent: resultLabel })
          }
          // For file operations, keep the previous tool_call label visible
          break
        }

        case "iteration": {
          // Agent loop: iteration progress — silent, just keep current status
          break
        }

        case "error": {
          // Handle WebSocket errors
          const { error, code, details } = event
          console.error("[ConversationStore] WebSocket error:", error, code, details)

          // Remove optimistic messages on error
          const { messages } = get()

          set({
            isStreaming: false,
            streamingContent: "",
            messages: messages.filter((m) => !m.id.startsWith("temp-")),
            lastError: { message: error, code },
          })
          break
        }

        case "clear_error" as any: {
          set({ lastError: null })
          break
        }

        case "reconnected" as any: {
          // WS reconnected after drop (e.g. mobile browser was backgrounded).
          // Start polling REST until generation completes — do NOT reset isStreaming.
          // Generation is still running on the server and will save to DB when done.
          const { currentConversation, messages: currentMessages } = get()
          if (!currentConversation) break

          const knownMsgCount = currentMessages.filter((m) => !m.id.startsWith("temp-")).length
          console.log("[ConversationStore] WS reconnected, polling for result. Known messages:", knownMsgCount)

          // Poll every 5s, up to 5 minutes
          let attempts = 0
          const MAX_POLL = 60
          const pollInterval = setInterval(async () => {
            attempts++
            if (attempts > MAX_POLL) {
              clearInterval(pollInterval)
              console.warn("[ConversationStore] Polling timeout — giving up")
              set({ isStreaming: false, streamingContent: "" })
              return
            }
            try {
              const conversation = await getConversation(currentConversation.id)
              const realMessages = conversation.messages.filter((m) => m.role !== "user" || !m.id.startsWith("temp-"))

              // Check if new messages appeared (generation completed)
              if (realMessages.length > knownMsgCount) {
                clearInterval(pollInterval)
                console.log("[ConversationStore] New messages found after reconnect:", realMessages.length)

                // Rebuild artifacts map
                const allArtifacts: Artifact[] = []
                conversation.messages.forEach((msg) => {
                  msg.artifacts.forEach((artifact) => allArtifacts.push(artifact))
                })
                const latestByTitle = new Map<string, Artifact>()
                allArtifacts.forEach((artifact) => {
                  const key = artifact.title || artifact.id
                  const existing = latestByTitle.get(key)
                  if (!existing || new Date(artifact.created_at) > new Date(existing.created_at)) {
                    latestByTitle.set(key, artifact)
                  }
                })
                const artifactsMap = new Map<string, Artifact>()
                latestByTitle.forEach((artifact) => artifactsMap.set(artifact.id, artifact))

                set({
                  messages: conversation.messages,
                  artifacts: artifactsMap,
                  isStreaming: false,
                  streamingContent: "",
                  lastError: null,
                })
              }
            } catch (err) {
              console.warn("[ConversationStore] Poll error:", err)
            }
          }, 5000)
          break
        }

        default: {
          console.warn("[ConversationStore] Unknown event type:", (event as any).type)
        }
      }
    },

    clearError: () => {
      set({ lastError: null })
    },

    /**
     * Select artifact for preview panel
     * @param artifactId - Artifact UUID
     */
    selectArtifact: (artifactId: string) => {
      set({ activeArtifactId: artifactId })
    },

    /**
     * Update artifact content
     * @param artifactId - Artifact UUID
     * @param update - Content and optional title update
     * @returns Updated artifact
     */
    updateArtifact: async (artifactId: string, update: ArtifactUpdate) => {
      try {
        const updatedArtifact = await apiUpdateArtifact(artifactId, update)

        // Update artifacts map
        const { artifacts } = get()
        const newArtifacts = new Map(artifacts)
        newArtifacts.set(artifactId, updatedArtifact)

        set({ artifacts: newArtifacts })

        return updatedArtifact
      } catch (error) {
        console.error("[ConversationStore] Failed to update artifact:", error)
        throw error
      }
    },

    /**
     * Reset store to initial state and disconnect WebSocket
     */
    reset: () => {
      // Disconnect WebSocket
      if (websocket) {
        websocket.disconnect()
        websocket = null
      }

      set({
        currentConversation: null,
        messages: [],
        artifacts: new Map(),
        activeArtifactId: null,
        isStreaming: false,
        streamingContent: "",
        lastError: null,
        lastCreditsUsed: null,
        creditsRemaining: null,
        suggestions: [],
        plan: null,
      })
    },
  }
})
