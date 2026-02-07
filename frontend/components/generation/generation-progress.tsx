"use client"

import { motion } from "motion/react"
import { Check, Circle, Loader2, X } from "lucide-react"
import { CodeSnippetAnimation } from "./code-snippet-animation"
import type { GenerationStep } from "@/types"

interface GenerationProgressProps {
  steps: GenerationStep[]
  progress: number
  currentStep: number
  codeSnippets?: string[]
}

function StepIcon({ status }: { status: GenerationStep["status"] }) {
  switch (status) {
    case "done":
      return <Check className="size-4 text-primary" />
    case "running":
      return <Loader2 className="size-4 text-primary animate-spin" />
    case "error":
      return <X className="size-4 text-destructive" />
    case "pending":
      return <Circle className="size-4 text-muted-foreground/40" />
  }
}

function getIconContainerClass(status: GenerationStep["status"]) {
  const base = "flex items-center justify-center size-7 rounded-full"
  switch (status) {
    case "done":
      return `${base} bg-primary/10`
    case "running":
      return `${base} bg-primary/10`
    case "error":
      return `${base} bg-destructive/10`
    case "pending":
      return `${base} bg-muted`
  }
}

function getStepNameClass(status: GenerationStep["status"]) {
  switch (status) {
    case "done":
      return "text-sm text-foreground"
    case "running":
      return "text-sm text-foreground font-medium"
    case "error":
      return "text-sm text-destructive"
    case "pending":
      return "text-sm text-muted-foreground"
  }
}

export function GenerationProgress({
  steps,
  progress,
  currentStep,
  codeSnippets = [],
}: GenerationProgressProps) {
  return (
    <div className="flex flex-col h-full p-6">
      <h3 className="text-lg font-semibold mb-4">Генерация кода...</h3>

      {/* Steps list */}
      <div className="space-y-1">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 py-2"
          >
            <div className={getIconContainerClass(step.status)}>
              <StepIcon status={step.status} />
            </div>
            <span className={getStepNameClass(step.status)}>{step.name}</span>
            {(step.status === "done" || step.status === "error") &&
              step.duration !== null && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {(step.duration / 1000).toFixed(1)}s
                </span>
              )}
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Code snippets */}
      {currentStep >= 2 && codeSnippets.length > 0 && (
        <div className="mt-6 flex-1 overflow-auto">
          <CodeSnippetAnimation snippets={codeSnippets} />
        </div>
      )}
    </div>
  )
}
