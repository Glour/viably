"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import type { MessageInputProps } from "@/features/generation/types"

const MAX_CHARS = 10000

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Напишите сообщение...",
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = content.trim().length > 0 && content.length <= MAX_CHARS && !disabled && !isSending

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [content])

  const handleSend = async () => {
    if (!canSend) return
    setIsSending(true)
    try {
      await onSendMessage(content.trim())
      setContent("")
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    } catch (error) {
      console.error("[MessageInput] Send failed:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && canSend) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full bg-background dark:bg-white/[0.04] border border-input dark:border-white/[0.08] focus:border-violet-500/50 rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none transition-colors no-scrollbar min-h-[44px] max-h-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ height: "44px" }}
      />
      {content.length > MAX_CHARS * 0.8 && (
        <span className={`absolute right-12 bottom-3.5 text-[10px] ${content.length > MAX_CHARS ? "text-red-400" : "text-muted-foreground/50"}`}>
          {content.length.toLocaleString()}
        </span>
      )}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className="absolute right-3 bottom-3 w-7 h-7 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
      >
        <ArrowUp className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  )
}
