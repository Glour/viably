"use client"

import { AnimatePresence, motion } from "motion/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { IdleState } from "./idle-state"
import { GenerationProgress } from "./generation-progress"
import { CompleteState } from "./complete-state"
import { ErrorState } from "./error-state"
import type { GenerationSession } from "@/shared/types"

interface PreviewPanelProps {
  generation: GenerationSession
  activeTab: string
  onTabChange: (tab: string) => void
  onDeploy?: () => void
  onDownload?: () => void
  onRetry?: () => void
  onModify?: () => void
  onCancel?: () => void
  // T036-T037: Reconnection UI props
  reconnectAttempts?: number
  isReconnecting?: boolean
  maxReconnectAttempts?: number
  onManualReconnect?: () => void
}

export function PreviewPanel({
  generation,
  activeTab,
  onTabChange,
  onDeploy,
  onDownload,
  onRetry,
  onModify,
  onCancel,
  reconnectAttempts,
  isReconnecting,
  maxReconnectAttempts,
  onManualReconnect,
}: PreviewPanelProps) {
  // T036: Show reconnection banner when reconnecting
  const showReconnectBanner = isReconnecting && (reconnectAttempts ?? 0) > 0

  // T037: Show manual reconnect button when max attempts reached
  const showManualReconnect =
    !isReconnecting &&
    (reconnectAttempts ?? 0) >= (maxReconnectAttempts ?? 5) &&
    generation.error?.includes("Connection lost")

  const renderPreviewContent = () => {
    switch (generation.status) {
      case "idle":
        return (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <IdleState />
          </motion.div>
        )
      case "generating":
        return (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <GenerationProgress
              steps={generation.steps}
              progress={generation.progress}
              currentStep={generation.currentStep}
              codeSnippets={generation.codeSnippets}
              streamingFiles={generation.streamingFiles}
              onCancel={onCancel}
            />
          </motion.div>
        )
      case "complete":
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {generation.code && (
              <CompleteState
                code={generation.code}
                onDeploy={onDeploy ?? (() => {})}
                onDownload={onDownload ?? (() => {})}
              />
            )}
          </motion.div>
        )
      case "error":
        return (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <ErrorState
              error={generation.error}
              onRetry={onRetry ?? (() => {})}
              onModify={onModify ?? (() => {})}
            />
          </motion.div>
        )
      default:
        return null
    }
  }

  const renderCodeContent = () => {
    if (generation.status === "complete" && generation.code) {
      return (
        <motion.div
          key="code-complete"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <CompleteState
            code={generation.code}
            onDeploy={onDeploy ?? (() => {})}
            onDownload={onDownload ?? (() => {})}
          />
        </motion.div>
      )
    }

    return (
      <motion.div
        key="code-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full flex items-center justify-center"
      >
        <p className="font-body text-muted-foreground">Код появится после генерации</p>
      </motion.div>
    )
  }

  const renderLogsContent = () => (
    <motion.div
      key="logs"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex items-center justify-center"
    >
      <p className="font-body text-muted-foreground">Логи будут отображаться здесь</p>
    </motion.div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* T036: Reconnection status banner */}
      {showReconnectBanner && (
        <div className="relative bg-gradient-to-r from-yellow-50/50 via-yellow-50 to-yellow-50/50 dark:from-yellow-900/10 dark:via-yellow-900/20 dark:to-yellow-900/10 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-shimmer pointer-events-none"
          />
          <div className="relative flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <Loader2 className="size-4 animate-spin" />
            <span className="font-body">
              Reconnecting... (attempt {reconnectAttempts}/{maxReconnectAttempts ?? 5})
            </span>
          </div>
        </div>
      )}

      {/* T037: Manual reconnect banner */}
      {showManualReconnect && (
        <div className="relative bg-gradient-to-r from-red-50/50 via-red-50 to-red-50/50 dark:from-red-900/10 dark:via-red-900/20 dark:to-red-900/10 border-b border-red-200 dark:border-red-800 px-4 py-3 overflow-hidden">
          <div className="relative flex items-center justify-between text-sm">
            <span className="font-body text-red-800 dark:text-red-200">
              Connection lost after {maxReconnectAttempts ?? 5} attempts
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onManualReconnect}
              className="ml-4 font-medium font-body border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              Reconnect
            </Button>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="h-full flex flex-col"
      >
        <div className="relative border-b border-border/50 bg-gradient-to-r from-transparent via-primary/8 to-transparent backdrop-blur-md overflow-hidden">
          {/* Glass morphism gradient overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 opacity-50 pointer-events-none"
          />
          <TabsList variant="line" className="relative px-6">
            <TabsTrigger
              value="preview"
              className="font-medium font-heading transition-all duration-300 data-[state=active]:text-primary data-[state=active]:shadow-[0_3px_0_0_var(--primary)] data-[state=active]:scale-105"
            >
              Предпросмотр
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="font-medium font-heading transition-all duration-300 data-[state=active]:text-primary data-[state=active]:shadow-[0_3px_0_0_var(--primary)] data-[state=active]:scale-105"
            >
              Код
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="font-medium font-heading transition-all duration-300 data-[state=active]:text-primary data-[state=active]:shadow-[0_3px_0_0_var(--primary)] data-[state=active]:scale-105"
            >
              Логи
            </TabsTrigger>
          </TabsList>
        </div>

      <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
        <AnimatePresence mode="wait">{renderPreviewContent()}</AnimatePresence>
      </TabsContent>

      <TabsContent value="code" className="flex-1 overflow-hidden m-0">
        <AnimatePresence mode="wait">{renderCodeContent()}</AnimatePresence>
      </TabsContent>

      <TabsContent value="logs" className="flex-1 overflow-hidden m-0">
        <AnimatePresence mode="wait">{renderLogsContent()}</AnimatePresence>
      </TabsContent>
      </Tabs>
    </div>
  )
}
