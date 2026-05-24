"use client"

import { motion } from "motion/react"
import { Check, Circle, Loader2, X } from "lucide-react"
import { useDebouncedValue } from "@/shared/hooks"
import { useRafProgress } from "@/shared/hooks"
import type { DeployStep, StepStatus } from "@/features/generation/types"

interface DeployProgressProps {
  steps: DeployStep[]
  progress: number
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "complete":
      return <Check className="size-4 text-primary" />
    case "running":
      return <Loader2 className="size-4 text-primary animate-spin" />
    case "error":
      return <X className="size-4 text-destructive" />
    case "pending":
      return <Circle className="size-4 text-muted-foreground/40" />
  }
}

function getIconContainerClass(status: StepStatus) {
  const base = "flex items-center justify-center size-7 rounded-full"
  switch (status) {
    case "complete":
      return `${base} bg-primary/10`
    case "running":
      return `${base} bg-primary/10`
    case "error":
      return `${base} bg-destructive/10`
    case "pending":
      return `${base} bg-muted`
  }
}

function getStepNameClass(status: StepStatus) {
  switch (status) {
    case "complete":
      return "text-sm font-body text-foreground"
    case "running":
      return "text-sm font-body text-foreground font-medium"
    case "error":
      return "text-sm font-body text-destructive"
    case "pending":
      return "text-sm font-body text-muted-foreground"
  }
}

export function DeployProgress({ steps, progress }: DeployProgressProps) {
  // T068: Debounce progress updates (100ms) to smooth visual updates
  const debouncedProgress = useDebouncedValue(progress, 100)

  // T070: Smooth RAF-based progress animation for 60fps counter updates
  const smoothProgress = useRafProgress(debouncedProgress, 300)

  return (
    <div className="space-y-6">
      {/* Animated gradient border container */}
      <div className="relative rounded-xl p-px bg-gradient-to-r from-primary via-primary/50 to-primary animate-pulse">
        <div className="rounded-xl bg-background p-6">
          <h3 className="font-heading text-xl font-bold mb-4">Развёртывание...</h3>

          {/* Steps list */}
          <div className="space-y-1">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 py-2"
              >
                <div className={getIconContainerClass(step.status)}>
                  <StepIcon status={step.status} />
                </div>
                <span className={getStepNameClass(step.status)}>
                  {step.name}
                </span>
                {step.log && (
                  <span className="font-code text-xs text-muted-foreground ml-auto truncate max-w-[120px]">
                    {step.log}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-[image:var(--gradient-main)] rounded-full shadow-[0_0_12px_var(--primary-glow)]"
                animate={{ width: `${smoothProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="font-code text-xs text-muted-foreground mt-1 text-right">
              {Math.round(smoothProgress)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
