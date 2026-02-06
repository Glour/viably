"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, ChevronUp, Gem, Sparkles } from "lucide-react"
import type { Template, ConfigFormValues } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shimmer } from "@/components/ui/shimmer"
import { ConfigForm } from "./config-form"
import { FreeTextInput } from "./free-text-input"
import { fadeInUp } from "@/lib/animations"
import { cn } from "@/lib/utils"

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
}

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
}: ChatPanelProps) {
  const [isHeaderExpanded, setIsHeaderExpanded] = React.useState(true)

  // Loading state when template is not loaded yet
  if (!template) {
    return (
      <div className="flex h-full flex-col px-4 py-4 space-y-4">
        <Shimmer height="4rem" className="rounded-xl" />
        <Shimmer height="6rem" className="rounded-2xl" />
        <Shimmer height="12rem" className="rounded-xl" />
      </div>
    )
  }

  const hasInsufficientCredits = credits < template.creditCost
  const hasConfigFields = template.configFields.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
        {/* Template Info Header (collapsible) */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <button
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border bg-card p-4",
              "transition-colors hover:bg-accent/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{template.emoji}</span>
              <div className="text-left">
                <h2 className="font-semibold text-sm">{template.name}</h2>
                <Badge variant="info" className="mt-1">
                  <Gem className="size-3" />
                  {template.creditCost} кредитов
                </Badge>
              </div>
            </div>
            {isHeaderExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
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
                <p className="text-sm text-muted-foreground px-1">
                  {template.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* AI Welcome Message */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex gap-3"
        >
          {/* Gradient avatar */}
          <div className="shrink-0">
            <div className="size-8 rounded-full bg-[image:var(--gradient-main)] flex items-center justify-center text-white text-sm font-bold">
              V
            </div>
          </div>

          {/* Message bubble */}
          <div className="bg-muted rounded-2xl rounded-tl-sm p-4 text-sm space-y-1">
            <p>
              Привет! Давай настроим твой <strong>{template.name}</strong>.
            </p>
            <p className="text-muted-foreground text-xs">
              Заполни параметры ниже, или просто опиши что нужно своими словами.
            </p>
          </div>
        </motion.div>

        {/* Config Form */}
        {hasConfigFields && (
          <ConfigForm
            fields={template.configFields}
            values={formValues}
            onChange={onFormChange}
          />
        )}

        {/* Generate Button (sticky) */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-3 pb-2 -mx-1 px-1 space-y-2">
          <Button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating || hasInsufficientCredits}
            loading={isGenerating}
            className={cn(
              "w-full",
              !hasInsufficientCredits && "bg-[image:var(--gradient-main)] text-white hover:opacity-90"
            )}
            variant={hasInsufficientCredits ? "destructive" : "default"}
          >
            {isGenerating ? (
              "Генерируем..."
            ) : hasInsufficientCredits ? (
              "Недостаточно кредитов"
            ) : (
              <>
                <Sparkles className="size-4" />
                Генерировать ({template.creditCost} кредитов)
              </>
            )}
          </Button>

          {hasInsufficientCredits && (
            <div className="text-center">
              <a
                href="/dashboard"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Пополнить →
              </a>
            </div>
          )}
        </div>

        {/* Free Text Input */}
        <FreeTextInput
          value={freeTextInput}
          onChange={onFreeTextChange}
          onSubmit={onFreeTextSubmit}
          disabled={isGenerating}
        />
      </div>
    </div>
  )
}
