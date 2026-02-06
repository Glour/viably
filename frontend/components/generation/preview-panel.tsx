"use client"

import { AnimatePresence, motion } from "motion/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IdleState } from "./idle-state"
import { GenerationProgress } from "./generation-progress"
import { CompleteState } from "./complete-state"
import { ErrorState } from "./error-state"
import type { GenerationSession } from "@/types"

interface PreviewPanelProps {
  generation: GenerationSession
  activeTab: string
  onTabChange: (tab: string) => void
  onDeploy?: () => void
  onDownload?: () => void
  onRetry?: () => void
  onModify?: () => void
}

export function PreviewPanel({
  generation,
  activeTab,
  onTabChange,
  onDeploy,
  onDownload,
  onRetry,
  onModify,
}: PreviewPanelProps) {
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
        <p className="text-muted-foreground">Код появится после генерации</p>
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
      <p className="text-muted-foreground">Logs will appear here</p>
    </motion.div>
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="h-full flex flex-col"
    >
      <TabsList variant="line" className="px-6 border-b">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>

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
  )
}
