"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useConversationStore } from "@/features/generation/stores"
import { MessageList } from "./MessageList"
import { MessageInput } from "./MessageInput"
import { Shimmer } from "@/shared/ui/shimmer"
import { Button } from "@/shared/ui/button"
import { ArrowDown, Sparkles, AlertCircle, X, CreditCard } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { ChatPanelProps } from "@/features/generation/types"
import { PlanCard } from "./PlanCard"

const SUGGESTIONS_BY_CATEGORY: Record<string, string[]> = {
  telegram_bot: [
    "Настрой каталог товаров",
    "Добавь систему оплаты",
    "Сделай рассылку пользователям",
  ],
  discord_bot: [
    "Добавь систему модерации",
    "Настрой приветственные сообщения",
    "Создай команду /help",
  ],
  website: [
    "Создай лендинг для стартапа",
    "Измени цветовую схему",
    "Добавь секцию отзывов",
  ],
  webapp: [
    "Создай дашборд с аналитикой",
    "Добавь авторизацию",
    "Настрой тёмную тему",
  ],
  web_app: [
    "Добавь авторизацию пользователей",
    "Создай дашборд с графиками",
    "Настрой фильтры и поиск",
  ],
}

const DEFAULT_SUGGESTIONS = [
  "Создай лендинг для стартапа",
  "Собери Telegram-бота для FAQ",
  "Сделай дашборд с графиками",
]

export function ChatPanel({ conversationId, className = "", welcomeMessage, templateCategory }: ChatPanelProps) {
  const suggestions = templateCategory
    ? (SUGGESTIONS_BY_CATEGORY[templateCategory] ?? DEFAULT_SUGGESTIONS)
    : DEFAULT_SUGGESTIONS
  const {
    currentConversation,
    messages,
    isStreaming,
    streamingContent,
    artifacts,
    lastError,
    suggestions: aiSuggestions,
    sendMessage,
    clearError,
  } = useConversationStore()

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const autoScrollRef = useRef(true)

  // Auto-scroll
  useEffect(() => {
    if (autoScrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [messages, streamingContent])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100
    autoScrollRef.current = nearBottom
    setShowScrollBtn(!nearBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      autoScrollRef.current = true
      setShowScrollBtn(false)
    }
  }, [])

  if (!currentConversation) {
    return (
      <div className={`flex h-full flex-col ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Shimmer className="h-8 w-64 rounded-lg" />
            <Shimmer className="h-4 w-48 rounded" />
          </div>
        </div>
      </div>
    )
  }

  const handleSend = async (content: string) => {
    autoScrollRef.current = true
    await sendMessage(content)
  }

  const handleSuggestion = (text: string) => {
    handleSend(text)
  }

  const hasMessages = messages.length > 0
  const hasArtifacts = artifacts.size > 0

  return (
    <div className={`flex h-full flex-col bg-background ${className}`}>
      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth no-scrollbar"
      >
        {hasMessages || isStreaming ? (
          <MessageList
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />
        ) : welcomeMessage ? (
          /* Onboarding welcome message from template */
          <div className="p-4 space-y-4">
            <div className="flex gap-3">
              <div className="shrink-0">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 blur-md opacity-50 animate-pulse"
                  />
                  <div className="relative size-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    V
                  </div>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-muted/60 via-muted/40 to-muted/60 rounded-2xl rounded-tl-sm p-4 text-sm border border-border/60 backdrop-blur-md max-w-[85%]">
                <p className="whitespace-pre-wrap">{welcomeMessage}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state with suggestions */
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Чем могу помочь?</h2>
                <p className="text-sm text-muted-foreground">
                  Опишите что хотите создать, и AI сгенерирует код для вас.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-4 py-2 text-sm rounded-full border border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-200 text-foreground/80 hover:text-foreground whitespace-normal text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Plan card (shown during first generation) — inside scroll area */}
        <PlanCard />
      </div>

      {isStreaming && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground border-t border-border/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
          AI генерирует код...
        </div>
      )}

      {/* AI-generated follow-up suggestions */}
      {aiSuggestions.length > 0 && !isStreaming && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {aiSuggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSend(suggestion)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Error banner */}
      <AnimatePresence>
        {lastError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mb-2 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex-1 space-y-1">
              <p className="font-medium text-destructive">
                {lastError.code === "insufficient_credits"
                  ? "Недостаточно кредитов"
                  : "Ошибка"}
              </p>
              <p className="text-xs text-destructive/80">{lastError.message}</p>
              {lastError.code === "insufficient_credits" && (
                <a
                  href="/settings/billing"
                  className="inline-flex items-center gap-1 text-xs font-medium text-destructive underline-offset-2 hover:underline"
                >
                  <CreditCard className="size-3" />
                  Пополнить баланс
                </a>
              )}
            </div>
            <button
              onClick={clearError}
              className="shrink-0 text-destructive/60 hover:text-destructive transition-colors"
              aria-label="Закрыть"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-background/90 backdrop-blur-sm h-8 w-8"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-4">
        <MessageInput
          onSendMessage={handleSend}
          disabled={isStreaming}
          placeholder={
            hasArtifacts
              ? "Попросите изменить..."
              : "Опишите что хотите создать..."
          }
        />
      </div>
    </div>
  )
}
