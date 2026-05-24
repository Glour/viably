"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, RefreshCw, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

interface ErrorStateProps {
  error: string | null
  onRetry: () => void
  onModify: () => void
}

export function ErrorState({ error, onRetry, onModify }: ErrorStateProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-6 text-center overflow-hidden">
      {/* Decorative orbs */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/4 w-64 h-64 -translate-x-1/2 -translate-y-1/2 bg-destructive/10 blur-[100px] rounded-full pointer-events-none animate-pulse"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-1/4 right-1/4 w-48 h-48 translate-x-1/2 translate-y-1/2 bg-destructive/5 blur-[80px] rounded-full pointer-events-none"
      />

      {/* Error icon with gradient border */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative z-10"
      >
        <div className="size-16 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/20 flex items-center justify-center mb-6 shadow-lg">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
      </motion.div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 space-y-2 mb-4"
      >
        <h3 className="font-heading text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Ошибка генерации
        </h3>
        <p className="font-body text-sm text-muted-foreground max-w-sm">
          Произошла ошибка при генерации кода. Попробуйте ещё раз или измените
          параметры.
        </p>
      </motion.div>

      {/* Expandable error details */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 w-full max-w-sm mb-6"
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all mx-auto group"
          >
            Подробности
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-300",
                expanded && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-lg bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50 p-3 text-left backdrop-blur-sm">
                  <code className="font-code text-xs text-muted-foreground break-all">
                    {error}
                  </code>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Credit reassurance */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 font-body text-xs text-muted-foreground mb-6 px-4 py-2 rounded-full bg-success/10 border border-success/20"
      >
        Кредиты не были списаны
      </motion.p>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 flex gap-3"
      >
        <div className="relative group">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-[image:var(--gradient-main)] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          />
          <Button
            onClick={onRetry}
            className="relative gap-2 font-semibold bg-[image:var(--gradient-main)] text-white hover:opacity-90 hover:scale-105 transition-all duration-300"
          >
            <RefreshCw className="size-4" />
            Повторить
          </Button>
        </div>
        <Button
          variant="secondary"
          onClick={onModify}
          className="gap-2 font-medium hover:scale-105 transition-all duration-300 border border-border/50 hover:border-primary/30"
        >
          <Settings className="size-4" />
          Изменить параметры
        </Button>
      </motion.div>
    </div>
  )
}
