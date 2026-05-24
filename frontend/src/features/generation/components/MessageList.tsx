"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Sparkles, Wrench, Search } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import type { MessageListProps, MessageWithArtifacts } from "@/features/generation/types"

const GENERATION_STEPS = [
  { text: "Анализирую запрос...", icon: null },
  { text: "Генерирую код...", icon: Wrench },
  { text: "Пишу файлы...", icon: null },
  { text: "Финальная проверка...", icon: Search },
]

function StreamingIndicator() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 5000),
      setTimeout(() => setStep(3), 10000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const currentStep = GENERATION_STEPS[step]
  const StepIcon = currentStep.icon

  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/60 dark:bg-white/[0.04] border border-violet-500/30"
        style={{ boxShadow: "0 0 0 1px rgba(139,92,246,0.15), 0 0 16px rgba(139,92,246,0.12)" }}
      >
          <div className="flex items-center gap-2.5">
            {StepIcon ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <StepIcon className="w-4 h-4 text-violet-500" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-violet-500" />
              </motion.div>
            )}
            <span className="text-sm font-medium text-foreground/80">
              {currentStep.text}
            </span>
            <div className="flex gap-1 ml-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-violet-500/60"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
      </motion.div>
    </div>
  )
}

export function MessageList({
  messages,
  isStreaming = false,
  streamingContent = "",
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* While AI is streaming, always show animation - never raw code */}
      {isStreaming && <StreamingIndicator />}
    </div>
  )
}
