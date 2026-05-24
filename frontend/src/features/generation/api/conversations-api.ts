import { api, parseApiError } from "@/shared/api/client"
import { queryKeys } from "@/shared/api/query-keys"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  Conversation,
  ConversationCreate,
  ConversationUpdate,
  ConversationDetail,
  ConversationListResponse,
  MessageListResponse,
  ArtifactListResponse,
  Artifact,
  ArtifactUpdate,
  ArtifactVersion,
} from "@/features/generation/types"

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Create new conversation
 */
export async function createConversation(data: ConversationCreate): Promise<Conversation> {
  try {
    const response = await api
      .post("conversations", { json: data })
      .json<Conversation>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Get conversation with messages and artifacts
 */
export async function getConversation(id: string): Promise<ConversationDetail> {
  try {
    const response = await api
      .get(`conversations/${id}`)
      .json<ConversationDetail>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Update conversation (title, metadata)
 */
export async function updateConversation(
  id: string,
  data: ConversationUpdate
): Promise<Conversation> {
  try {
    const response = await api
      .patch(`conversations/${id}`, { json: data })
      .json<Conversation>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Delete conversation
 */
export async function deleteConversation(id: string): Promise<void> {
  try {
    await api.delete(`conversations/${id}`)
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * List conversations for project
 */
export async function listConversations(
  projectId: string,
  params?: { limit?: number; offset?: number }
): Promise<ConversationListResponse> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.offset) searchParams.set("offset", params.offset.toString())

    const response = await api
      .get(`projects/${projectId}/conversations`, { searchParams })
      .json<ConversationListResponse>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Get messages for conversation
 */
export async function getMessages(
  conversationId: string,
  params?: { limit?: number; offset?: number }
): Promise<MessageListResponse> {
  try {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.offset) searchParams.set("offset", params.offset.toString())

    const response = await api
      .get(`conversations/${conversationId}/messages`, { searchParams })
      .json<MessageListResponse>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Get artifacts for conversation
 */
export async function getArtifacts(conversationId: string): Promise<ArtifactListResponse> {
  try {
    const response = await api
      .get(`conversations/${conversationId}/artifacts`)
      .json<ArtifactListResponse>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Update artifact content
 */
export async function updateArtifact(
  artifactId: string,
  data: ArtifactUpdate
): Promise<Artifact> {
  try {
    const response = await api
      .patch(`artifacts/${artifactId}`, { json: data })
      .json<Artifact>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

/**
 * Get artifact version history
 */
export async function getArtifactVersions(artifactId: string): Promise<ArtifactVersion[]> {
  try {
    const response = await api
      .get(`artifacts/${artifactId}/versions`)
      .json<ArtifactVersion[]>()
    return response
  } catch (error) {
    await parseApiError(error)
    throw error
  }
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook: Get conversation with messages
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId ?? ""),
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 0, // Always fetch fresh data (WebSocket updates may invalidate)
  })
}

/**
 * Hook: List conversations for project
 */
export function useConversations(
  projectId: string,
  params?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: queryKeys.conversations.list(projectId, params),
    queryFn: () => listConversations(projectId, params),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook: Create conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createConversation,
    onSuccess: (data) => {
      // Invalidate project conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.list(data.project_id),
      })
    },
  })
}

/**
 * Hook: Update conversation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConversationUpdate }) =>
      updateConversation(id, data),
    onSuccess: (data) => {
      // Invalidate conversation detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(data.id),
      })
      // Invalidate project conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.list(data.project_id),
      })
    },
  })
}

/**
 * Hook: Delete conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      // Invalidate all conversations lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all(),
      })
    },
  })
}

/**
 * Hook: Update artifact
 */
export function useUpdateArtifact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ artifactId, data }: { artifactId: string; data: ArtifactUpdate }) =>
      updateArtifact(artifactId, data),
    onSuccess: (artifact) => {
      // Invalidate conversation detail to refresh artifacts
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(artifact.conversation_id),
      })
    },
  })
}
