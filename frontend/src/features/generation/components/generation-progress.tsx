"use client"

import { memo, useMemo } from "react"
import { motion } from "motion/react"
import { Check, Circle, Loader2, X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { CodeSnippetAnimation } from "./code-snippet-animation"
import { useDebouncedValue } from "@/shared/hooks"
import { useRafProgress } from "@/shared/hooks"
import { cn } from "@/shared/lib/utils"
import type { GenerationStep, StreamingFileSnippet } from "@/shared/types"

interface GenerationProgressProps {
  steps: GenerationStep[]
  progress: number
  currentStep: number
  codeSnippets?: string[]
  streamingFiles?: StreamingFileSnippet[]
  onCancel?: () => void
}

// Memoized StepIcon to prevent re-renders
const StepIcon = memo(({ status }: { status: GenerationStep["status"] }) => {
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
})
StepIcon.displayName = "StepIcon"

function getIconContainerClass(status: GenerationStep["status"]) {
  const base = "flex items-center justify-center size-7 rounded-full transition-all duration-300"
  switch (status) {
    case "done":
      return `${base} bg-primary/10 shadow-[0_0_12px_var(--primary-glow)]`
    case "running":
      return `${base} bg-primary/10 shadow-[0_0_16px_var(--primary-glow)] animate-pulse`
    case "error":
      return `${base} bg-destructive/10 shadow-[0_0_12px_rgba(239,68,68,0.3)]`
    case "pending":
      return `${base} bg-muted`
  }
}

function getStepNameClass(status: GenerationStep["status"]) {
  switch (status) {
    case "done":
      return "text-sm font-body text-foreground"
    case "running":
      return "text-sm font-body text-foreground font-medium"
    case "error":
      return "text-sm font-body text-destructive"
    case "pending":
      return "text-sm font-body text-muted-foreground"
  }
}

// Memoized ProgressBar component with GPU acceleration
const ProgressBar = memo(({ smoothProgress }: { smoothProgress: number }) => {
  return (
    <div className="relative h-3 bg-muted/50 backdrop-blur-sm rounded-full overflow-hidden shadow-inner border border-border/30">
      {/* GPU-accelerated progress bar with will-change and transform3d */}
      <motion.div
        className="absolute inset-y-0 left-0 bg-[image:var(--gradient-main)] bg-[length:200%_200%] rounded-full shadow-[0_0_16px_var(--primary-glow)] progress-bar-animated"
        style={{
          width: `${smoothProgress}%`,
          willChange: "width, transform",
          transform: "translate3d(0, 0, 0)", // Force GPU acceleration
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      {/* Optimized shimmer overlay with GPU acceleration */}
      <div
        aria-hidden="true"
        className="progress-shimmer pointer-events-none"
        style={{
          willChange: "transform",
          transform: "translate3d(0, 0, 0)", // Force GPU acceleration
        }}
      />
    </div>
  )
})
ProgressBar.displayName = "ProgressBar"

// Memoized StepCard to prevent unnecessary re-renders
const StepCard = memo(({ step, index }: { step: GenerationStep; index: number }) => {
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-300",
        "bg-card/40 backdrop-blur-md border border-border/50",
        step.status === "running" && "bg-primary/5 border-primary/20 shadow-[0_0_20px_var(--primary-glow)]",
        step.status === "done" && "bg-card/30",
        step.status === "error" && "bg-destructive/5 border-destructive/20"
      )}
      style={{
        willChange: step.status === "running" ? "box-shadow, background-color" : "auto",
      }}
    >
      <div className={getIconContainerClass(step.status)}>
        <StepIcon status={step.status} />
      </div>
      <span className={getStepNameClass(step.status)}>{step.name}</span>
      {(step.status === "done" || step.status === "error") &&
        step.duration !== null && (
          <span className="font-code text-xs text-muted-foreground ml-auto">
            {(step.duration / 1000).toFixed(1)}s
          </span>
        )}
    </motion.div>
  )
})
StepCard.displayName = "StepCard"

export const GenerationProgress = memo(function GenerationProgress({
  steps,
  progress,
  currentStep,
  codeSnippets = [],
  streamingFiles = [],
  onCancel,
}: GenerationProgressProps) {
  // T068: Debounce progress updates (100ms) to smooth visual updates
  const debouncedProgress = useDebouncedValue(progress, 100)

  // T070: Smooth RAF-based progress animation for 60fps counter updates
  const smoothProgress = useRafProgress(debouncedProgress, 300)

  // Memoize rounded progress to prevent recalculation
  const roundedProgress = useMemo(() => Math.round(smoothProgress), [smoothProgress])

  // Memoize show code snippets condition
  const showCodeSnippets = useMemo(
    () => currentStep >= 2 && (streamingFiles.length > 0 || codeSnippets.length > 0),
    [currentStep, streamingFiles.length, codeSnippets.length]
  )

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Генерация кода...
        </h3>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="font-medium font-body text-muted-foreground hover:text-destructive transition-all duration-300 hover:scale-105"
          >
            <X className="size-4 mr-1" />
            Отменить
          </Button>
        )}
      </div>

      {/* Steps list - Glass morphism cards */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} />
        ))}
      </div>

      {/* Progress bar - Enhanced gradient with glow */}
      <div className="mt-6">
        <ProgressBar smoothProgress={smoothProgress} />
        <div className="flex items-center justify-between mt-2">
          <p className="font-body text-xs text-muted-foreground">
            Шаг {currentStep + 1} из {steps.length}
          </p>
          <p className="font-code text-xs font-medium text-foreground">
            {roundedProgress}%
          </p>
        </div>
      </div>

      {/* Code snippets */}
      {showCodeSnippets && (
        <div className="mt-6 flex-1 overflow-auto">
          <CodeSnippetAnimation
            snippets={codeSnippets}
            streamingFiles={streamingFiles}
          />
        </div>
      )}
    </div>
  )
})
