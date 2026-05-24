import { env } from "@/shared/config/env"
import { getAccessToken } from "@/shared/api/tokens"
import type { WSEvent } from "@/features/generation/types"

/**
 * Maximum reconnection attempts before giving up
 */
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * Initial reconnection interval (3 seconds)
 */
const INITIAL_RECONNECT_INTERVAL = 3000

/**
 * Maximum reconnection interval (48 seconds)
 */
const MAX_RECONNECT_INTERVAL = 48000

/**
 * WebSocket client for conversation streaming
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Token-based authentication
 * - Type-safe event handling
 * - Graceful disconnect and cleanup
 *
 * Architecture:
 * ConversationStore → ConversationWebSocket → Backend WS (/ws/conversations/{id})
 */
export class ConversationWebSocket {
  private ws: WebSocket | null = null
  private conversationId: string
  private onEvent: (event: WSEvent) => void
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isIntentionalClose = false
  private connectionResolvers: Array<{ resolve: () => void; reject: (err: Error) => void }> = []
  private visibilityHandler: (() => void) | null = null
  private wasEverConnected = false  // tracks if WS connected at least once

  constructor(conversationId: string, onEvent: (event: WSEvent) => void) {
    this.conversationId = conversationId
    this.onEvent = onEvent
  }

  /**
   * Wait for WebSocket connection to be established
   * @param timeout - Max wait time in ms (default 5000)
   * @returns Promise that resolves when connected or rejects on timeout
   */
  waitForConnection(timeout = 5000): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.connectionResolvers = this.connectionResolvers.filter(
          (r) => r.resolve !== resolve
        )
        reject(new Error("WebSocket connection timeout"))
      }, timeout)

      this.connectionResolvers.push({
        resolve: () => {
          clearTimeout(timer)
          resolve()
        },
        reject: (err: Error) => {
          clearTimeout(timer)
          reject(err)
        },
      })
    })
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    const token = getAccessToken()
    if (!token) {
      console.error("[ConversationWebSocket] No access token available")
      return
    }

    // Build WebSocket URL with auth token
    const wsUrl = `${env.NEXT_PUBLIC_WS_URL}/ws/conversations/${this.conversationId}?token=${token}`

    console.log("[ConversationWebSocket] Connecting to:", wsUrl.replace(/token=[^&]+/, "token=***"))

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = this.handleOpen.bind(this)
    this.ws.onmessage = this.handleMessage.bind(this)
    this.ws.onerror = this.handleError.bind(this)
    this.ws.onclose = this.handleClose.bind(this)

    // Register visibility handler once (mobile: reconnect when browser comes to foreground)
    if (!this.visibilityHandler && typeof document !== "undefined") {
      this.visibilityHandler = () => {
        if (document.visibilityState === "visible" && !this.isIntentionalClose) {
          const state = this.ws?.readyState
          if (state !== WebSocket.OPEN && state !== WebSocket.CONNECTING) {
            console.log("[ConversationWebSocket] Page visible — forcing reconnect")
            // Clear error state in store before reconnecting
            this.onEvent({ type: "clear_error" } as any)
            // Reset counter so mobile users always get fresh attempts on return
            this.reconnectAttempts = 0
            if (this.reconnectTimeout) {
              clearTimeout(this.reconnectTimeout)
              this.reconnectTimeout = null
            }
            this.connect()
          }
        }
      }
      document.addEventListener("visibilitychange", this.visibilityHandler)
    }
  }

  /**
   * Send message to AI, waiting for connection if needed
   * @param content - User message content
   */
  async sendMessage(content: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log("[ConversationWebSocket] Waiting for connection before sending...")
      await this.waitForConnection()
    }

    this.ws!.send(
      JSON.stringify({
        type: "send_message",
        content,
      })
    )
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true

    // Clear any pending reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // Remove visibility listener
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler)
      this.visibilityHandler = null
    }

    // Reject all pending connection waiters
    const resolvers = this.connectionResolvers.splice(0)
    resolvers.forEach((r) => r.reject(new Error("WebSocket disconnected")))

    if (this.ws) {
      this.ws.close(1000, "Client disconnect") // Normal closure
      this.ws = null
    }

    this.wasEverConnected = false
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    const isReconnect = this.wasEverConnected
    this.wasEverConnected = true
    console.log("[ConversationWebSocket] Connected", isReconnect ? "(reconnect)" : "(initial)")

    // Reset reconnection attempts on successful connection
    this.reconnectAttempts = 0

    // Resolve all pending connection waiters
    const resolvers = this.connectionResolvers.splice(0)
    resolvers.forEach((r) => r.resolve())

    // On reconnect — notify store to poll REST for any missed messages.
    // Generation may have completed while WS was down (browser backgrounded).
    if (isReconnect) {
      this.onEvent({ type: "reconnected" } as any)
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as WSEvent

      // Validate event type
      if (!data.type) {
        console.warn("[ConversationWebSocket] Received message without type:", data)
        return
      }

      // Pass event to store handler
      this.onEvent(data)
    } catch (error) {
      console.error("[ConversationWebSocket] Failed to parse message:", error, event.data)
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    // Log but DO NOT emit error to UI here.
    // handleClose fires right after and will manage reconnection.
    // Error is shown to the user only after MAX_RECONNECT_ATTEMPTS are exhausted.
    console.warn("[ConversationWebSocket] Connection error (will retry if not intentional)")
  }

  /**
   * Handle WebSocket close event with auto-reconnection
   */
  private handleClose(event: CloseEvent): void {
    console.log("[ConversationWebSocket] Closed:", event.code, event.reason)

    this.ws = null

    // Don't reconnect if intentional close or normal closure
    if (this.isIntentionalClose || event.code === 1000) {
      return
    }

    // If page is hidden (mobile browser backgrounded) — don't burn reconnect attempts.
    // visibilitychange handler will reconnect when user returns to the tab.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      console.log("[ConversationWebSocket] Page hidden — deferring reconnect until visible")
      return
    }

    // Don't reconnect if max attempts reached
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(
        `[ConversationWebSocket] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`
      )

      // Emit error event to store
      this.onEvent({
        type: "error",
        error: "Connection lost. Please refresh the page.",
        code: "MAX_RECONNECT_ATTEMPTS",
      })
      return
    }

    // Exponential backoff: 3s → 6s → 12s → 24s → 48s
    const interval = Math.min(
      INITIAL_RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_INTERVAL
    )

    this.reconnectAttempts++

    console.log(
      `[ConversationWebSocket] Reconnecting in ${interval / 1000}s (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
    )

    this.reconnectTimeout = setTimeout(() => {
      this.connect()
    }, interval)
  }
}
