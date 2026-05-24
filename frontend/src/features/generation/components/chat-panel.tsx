"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, ChevronUp, Gem, Sparkles, Send, CheckCircle2, AlertCircle, Bot } from "lucide-react"
import type { Template, ConfigFormValues, GenerationSession } from "@/shared/types"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { ConfigForm } from "./config-form"
import { cn } from "@/shared/lib/utils"
import { checkCreditBalance } from "@/shared/lib/utils/credit-check"

/* ─── Types ─── */

interface ChatMessage {
  id: string
  role: "ai" | "user" | "system"
  content: string
  timestamp: number
}

interface ChatPanelProps {
  template: Template | null
  formValues: ConfigFormValues
  freeTextInput: string
  onFormChange: (values: ConfigFormValues) => void
  onFreeTextChange: (text: string) => void
  onGenerate: () => void
  onFreeTextSubmit: () => void
  canGenerate: boolean
  isGenerating: boolean
  credits: number
  isMobile?: boolean
  generationStatus?: GenerationSession["status"]
}

/* ─── AI Avatar ─── */

function AiAvatar() {
  return (
    <div className="shrink-0">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
    </div>
  )
}

/* ─── Message Bubble ─── */

function MessageBubble({ role, content }: { role: "ai" | "user" | "system"; content: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex gap-3 justify-end">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm p-4 text-sm max-w-[85%] backdrop-blur-md">
          {content}
        </div>
      </div>
    )
  }

  if (role === "system") {
    return (
      <div className="flex justify-center">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <AiAvatar />
      <div className="relative bg-gradient-to-br from-muted/60 via-muted/40 to-muted/60 rounded-2xl rounded-tl-sm p-4 text-sm space-y-1 border border-border/60 backdrop-blur-md overflow-hidden group max-w-[85%]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        />
        <div className="relative font-body">{content}</div>
      </div>
    </div>
  )
}

/* ─── Chat Input (always visible at bottom) ─── */

function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  isGenerating,
  showGenerateButton,
  creditCost,
  hasInsufficientCredits,
  creditShortfall,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
  placeholder: string
  isGenerating: boolean
  showGenerateButton: boolean
  creditCost: number
  hasInsufficientCredits: boolean
  creditShortfall: number
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget
    t.style.height = "auto"
    t.style.height = `${Math.min(Math.max(t.scrollHeight, 48), 160)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && value.trim() && !disabled) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 space-y-2">
      {hasInsufficientCredits && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-destructive font-body">
            Недостаточно {creditShortfall} {creditShortfall === 1 ? "кредита" : "кредитов"}
          </span>
          <a href="/settings/billing" className="text-primary hover:underline font-body">
            Пополнить →
          </a>
        </div>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "font-body flex-1 resize-none overflow-y-auto no-scrollbar rounded-xl border border-border/60 bg-card/40 backdrop-blur-md px-4 py-3 text-sm",
            "transition-all duration-200 placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[48px] max-h-[160px]"
          )}
          style={{ height: "48px" }}
        />
        {showGenerateButton ? (
          <div className="relative group">
            {!hasInsufficientCredits && !isGenerating && (
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-[image:var(--gradient-main)] blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
              />
            )}
            <Button
              onClick={onSubmit}
              disabled={disabled || hasInsufficientCredits}
              loading={isGenerating}
              className={cn(
                "relative min-h-[48px] px-5 font-semibold font-body transition-all duration-300",
                !hasInsufficientCredits && "bg-[image:var(--gradient-main)] text-white hover:opacity-90 hover:shadow-[0_0_24px_var(--primary-glow)]"
              )}
              variant={hasInsufficientCredits ? "destructive" : "default"}
            >
              {isGenerating ? (
                "..."
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {creditCost} кр.
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            disabled={!value.trim() || disabled}
            onClick={onSubmit}
            className="min-h-[48px] min-w-[48px] hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Send className="size-5" />
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center font-body">
        ⌘+Enter для отправки
      </p>
    </div>
  )
}

/* ─── Main ChatPanel ─── */

export function ChatPanel({
  template,
  formValues,
  freeTextInput,
  onFormChange,
  onFreeTextChange,
  onGenerate,
  onFreeTextSubmit,
  canGenerate,
  isGenerating,
  credits,
  isMobile,
  generationStatus = "idle",
}: ChatPanelProps) {
  const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(true)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([])

  const DEFAULT_CREDIT_COST = 3
  const creditCost = template?.creditCost ?? DEFAULT_CREDIT_COST
  const creditCheck = checkCreditBalance(credits, creditCost)
  const hasInsufficientCredits = !creditCheck.hasSufficientCredits
  const hasConfigFields = template?.configFields && template.configFields.length > 0

  // Track generation status changes to add system messages
  const prevStatus = React.useRef(generationStatus)
  React.useEffect(() => {
    if (prevStatus.current !== generationStatus) {
      if (generationStatus === "generating" && prevStatus.current !== "generating") {
        // Add user message if there's free text
        if (freeTextInput.trim()) {
          setChatHistory(prev => [...prev, {
            id: `user-${Date.now()}`,
            role: "user",
            content: freeTextInput.trim(),
            timestamp: Date.now(),
          }])
        }
        setChatHistory(prev => [...prev, {
          id: `sys-gen-start-${Date.now()}`,
          role: "system",
          content: "Генерация запущена...",
          timestamp: Date.now(),
        }])
      }
      if (generationStatus === "complete" && prevStatus.current === "generating") {
        setChatHistory(prev => [...prev, {
          id: `sys-gen-done-${Date.now()}`,
          role: "system",
          content: "Генерация завершена!",
          timestamp: Date.now(),
        }])
      }
      if (generationStatus === "error" && prevStatus.current === "generating") {
        setChatHistory(prev => [...prev, {
          id: `sys-gen-err-${Date.now()}`,
          role: "system",
          content: "Ошибка генерации",
          timestamp: Date.now(),
        }])
      }
      prevStatus.current = generationStatus
    }
  }, [generationStatus, freeTextInput])

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  // Determine if this is first generation or follow-up
  const isFollowUp = generationStatus === "complete" || generationStatus === "error"
  const showGenerateButton = !isFollowUp || !freeTextInput.trim()

  const handleSubmit = () => {
    if (isFollowUp && freeTextInput.trim()) {
      // Follow-up: add message and trigger generation
      onGenerate()
    } else if (freeTextInput.trim() || (template && hasConfigFields)) {
      onGenerate()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable messages area */}
      <div className="overflow-y-auto no-scrollbar flex-1 px-4 py-4 space-y-4">
        {/* Template/Project Header */}
        {template ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <button
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border bg-card/40 backdrop-blur-xl p-4",
                "transition-all duration-300 hover:bg-card/60 hover:border-primary/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "relative overflow-hidden group"
              )}
            >
              <div className="relative flex items-center gap-3">
                <span className="text-2xl">{template.emoji}</span>
                <div className="text-left">
                  <h2 className="font-heading font-semibold text-base">{template.name}</h2>
                  <Badge variant="info" className="mt-1">
                    <Gem className="size-3" />
                    {template.creditCost} кредитов
                  </Badge>
                </div>
              </div>
              <div className="relative">
                {isHeaderExpanded ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isHeaderExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-body text-muted-foreground px-1">
                    {template.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border bg-card/40 backdrop-blur-xl p-4",
              "relative overflow-hidden"
            )}
          >
            <div className="relative flex items-center gap-3">
              <Bot className="w-5 h-5"/>
              <div className="text-left">
                <h2 className="font-heading font-semibold text-base">Создать с нуля</h2>
                <Badge variant="info" className="mt-1">
                  <Gem className="size-3" />
                  {DEFAULT_CREDIT_COST} кредитов
                </Badge>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI Welcome Message */}
        <MessageBubble
          role="ai"
          content={
            <div className="space-y-1">
              <p>
                Привет! Давай {template ? (
                  <>настроим твой <strong className="font-medium">{template.name}</strong>.</>
                ) : (
                  <>создадим <strong className="font-medium">уникального бота</strong>.</>
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                {hasConfigFields
                  ? "Заполни параметры ниже, или просто опиши что нужно своими словами."
                  : "Опиши своими словами что должен делать твой бот — AI сгенерирует код по твоему описанию."}
              </p>
            </div>
          }
        />

        {/* Config Form (if template has fields) */}
        {hasConfigFields && (
          <ConfigForm
            fields={template!.configFields}
            values={formValues}
            onChange={onFormChange}
          />
        )}

        {/* Chat History Messages */}
        <AnimatePresence>
          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble role={msg.role} content={msg.content} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Generating indicator */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <MessageBubble
              role="ai"
              content={
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-muted-foreground text-xs">Генерирую код...</span>
                </div>
              }
            />
          </motion.div>
        )}

        {/* Post-generation AI message */}
        {generationStatus === "complete" && chatHistory.some(m => m.content.includes("Генерация завершена!")) && (
          <MessageBubble
            role="ai"
            content={
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <strong>Готово!</strong>
                </div>
                <p className="text-xs text-muted-foreground">
                  Код сгенерирован — смотри справа. Хочешь что-то изменить? Просто напиши.
                </p>
              </div>
            }
          />
        )}

        {generationStatus === "error" && chatHistory.some(m => m.content.includes("Ошибка генерации")) && (
          <MessageBubble
            role="ai"
            content={
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-destructive" />
                  <strong>Произошла ошибка</strong>
                </div>
                <p className="text-xs text-muted-foreground">
                  Попробуй ещё раз или опиши задачу иначе.
                </p>
              </div>
            }
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Always-visible input at bottom */}
      <ChatInput
        value={freeTextInput}
        onChange={onFreeTextChange}
        onSubmit={handleSubmit}
        disabled={isGenerating || hasInsufficientCredits}
        placeholder={
          isFollowUp
            ? "Измени что-нибудь... (например: «Добавь кнопку оплаты»)"
            : template
              ? "Опиши что нужно своими словами..."
              : "Например: Бот для приёма заказов с меню, корзиной и оплатой..."
        }
        isGenerating={isGenerating}
        showGenerateButton={!isFollowUp}
        creditCost={creditCost}
        hasInsufficientCredits={hasInsufficientCredits}
        creditShortfall={creditCheck.shortfall ?? 0}
      />
    </div>
  )
}
