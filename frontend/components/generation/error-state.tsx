"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, RefreshCw, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  error: string | null
  onRetry: () => void
  onModify: () => void
}

export function ErrorState({ error, onRetry, onModify }: ErrorStateProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
      >
        <AlertTriangle className="size-8 text-destructive" />
      </motion.div>

      {/* Error message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2 mb-4"
      >
        <h3 className="text-xl font-semibold">Ошибка генерации</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
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
          className="w-full max-w-sm mb-6"
        >
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            Подробности
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
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
                <div className="mt-2 rounded-lg bg-muted/50 p-3 text-left">
                  <code className="text-xs text-muted-foreground break-all">
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
        className="text-xs text-muted-foreground mb-6"
      >
        Кредиты не были списаны
      </motion.p>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Повторить
        </Button>
        <Button variant="secondary" onClick={onModify} className="gap-2">
          <Settings className="size-4" />
          Изменить параметры
        </Button>
      </motion.div>
    </div>
  )
}
