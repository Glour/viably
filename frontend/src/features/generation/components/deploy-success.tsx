"use client"

import { useEffect } from "react"
import { motion } from "motion/react"
import { Bot, ExternalLink, ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import type { DeployedBotInfo } from "@/shared/types"
import { prefersReducedMotion } from "@/shared/lib/animations"
import { useComponentCleanup } from "@/shared/hooks/useComponentCleanup"

interface DeploySuccessProps {
  botInfo: DeployedBotInfo
  onOpenTelegram: () => void
  onBackToProjects: () => void
  isWebProject?: boolean
}

export function DeploySuccess({ botInfo, onOpenTelegram, onBackToProjects, isWebProject = false }: DeploySuccessProps) {
  const { registerResource } = useComponentCleanup('DeploySuccess')

  useEffect(() => {
    if (prefersReducedMotion()) return

    // T054: Dynamic import - only load confetti when needed
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true,
      })

      // Register confetti as a resource with cleanup
      // canvas-confetti creates a canvas element that should be cleaned up
      registerResource({
        type: 'custom',
        createdAt: Date.now(),
        disposeFn: () => {
          // Reset confetti to remove any canvas elements
          confetti.reset()
        },
        metadata: { library: 'canvas-confetti', action: 'celebration' }
      })
    })
  }, [registerResource])

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 text-center">
      {/* Glow pulse animated icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="size-16 rounded-full bg-green-500/10 flex items-center justify-center"
      >
        <Bot className="size-8 text-green-500" />
      </motion.div>

      {/* Success text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-heading font-semibold">
          {isWebProject ? "Сайт опубликован!" : "Бот развёрнут!"}
        </h3>
        <p className="text-sm font-body text-muted-foreground mt-1">
          {isWebProject ? "Ваш сайт доступен в интернете" : "Ваш бот запущен и готов к работе"}
        </p>
      </motion.div>

      {/* Bot info card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm rounded-xl border bg-card p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-body font-medium">{isWebProject ? (botInfo.url ?? "Сайт опубликован") : ("@" + (botInfo.username ?? "—"))}</span>
          <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20 font-body">
            Работает
          </Badge>
        </div>
        {botInfo.url && (
          <a
            href={botInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-code text-primary hover:underline break-all"
          >
            {botInfo.url}
          </a>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-sm"
      >
        <Button
          onClick={onOpenTelegram}
          className="flex-1 gap-2 font-heading font-semibold bg-[image:var(--gradient-main)] hover:brightness-110"
        >
          <ExternalLink className="size-4" />
          {isWebProject ? "Открыть сайт" : "Открыть в Telegram"}
        </Button>
        <Button
          variant="secondary"
          onClick={onBackToProjects}
          className="flex-1 gap-2 font-body"
        >
          <ArrowLeft className="size-4" />
          К проектам
        </Button>
      </motion.div>
    </div>
  )
}
