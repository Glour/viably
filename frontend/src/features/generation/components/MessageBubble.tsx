"use client"

import { memo, useState, useMemo } from "react"
import { motion } from "motion/react"
import { format } from "date-fns"
import { Copy, User, Sparkles, FileCode, ThumbsUp, ThumbsDown } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { MessageWithArtifacts } from "@/features/generation/types"

interface MessageBubbleProps {
  message: MessageWithArtifacts
  isStreaming?: boolean
}

function extractTextOnly(content: string): string {
  let text = content

  text = text.replace(/<\/?>(?:viably-)?artifact[^>]*>/gi, "")
  // Remove complete code blocks (closed with ```)
  text = text.replace(/```[\s\S]*?```/g, "")
  // Remove unclosed code blocks (during streaming) — everything from ``` to end
  text = text.replace(/```[\s\S]*/g, "")
  // Remove standalone `# filename:` lines that leaked out of code blocks
  text = text.replace(/^#\s*filename:.*$/gm, "")
  text = text.replace(/^\/\/\s*filename:.*$/gm, "")
  text = text.replace(/<!DOCTYPE[\s\S]*?<\/html>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<(?:div|section|nav|header|footer|form|table|ul|ol|head|body|html)[\s\S]*?<\/(?:div|section|nav|header|footer|form|table|ul|ol|head|body|html)>/gi, "")
  text = text.replace(/[.#@][\w-][^{}]*\{[^}]*\}/g, "")
  text = text.replace(/\n{3,}/g, "\n\n").trim()

  if (!text || text.length < 10) {
    return "Код сгенерирован — смотри в превью →"
  }
  return text
}

function countCodeFiles(content: string): number {
  const matches = content.match(/```\w*\s*\n#\s*filename:/g)
  return matches ? matches.length : 0
}

function getDisplayedFileCount(message: MessageWithArtifacts): number {
  if (message.role === "user") return 0
  if (Array.isArray(message.artifacts) && message.artifacts.length > 0) {
    return message.artifacts.length
  }
  return countCodeFiles(message.content)
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const displayContent = useMemo(() => {
    if (isUser) return message.content
    return extractTextOnly(message.content)
  }, [message.content, isUser])

  const fileCount = useMemo(() => getDisplayedFileCount(message), [message])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const time = message.created_at ? format(new Date(message.created_at), "HH:mm") : ""

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 mb-4 flex-row-reverse"
      >
        <div className="shrink-0 w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="bg-violet-600 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white leading-relaxed max-w-[80%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
          {time && (
            <div className="mt-1 text-[10px] text-white/60">{time}</div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 mb-4"
    >
      <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/30 mt-1">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/60 dark:bg-white/[0.04] border border-border dark:border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground leading-relaxed">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
            {fileCount > 0 && !isStreaming && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <FileCode className="w-3.5 h-3.5" />
                <span>{fileCount} {fileCount === 1 ? "файл" : fileCount < 5 ? "файла" : "файлов"} → превью</span>
              </div>
            )}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block ml-0.5 w-0.5 h-4 bg-violet-500 rounded-full align-middle"
              />
            )}
          </div>
        </div>
        {!isStreaming && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            {time && <span className="text-muted-foreground/60 text-xs">{time}</span>}
            <button
              onClick={handleCopy}
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              title="Копировать"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              title="Хорошо"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              title="Плохо"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
})
