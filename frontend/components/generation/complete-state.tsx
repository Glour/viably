"use client"

import { motion } from "motion/react"
import { Download, Rocket, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CodeViewer } from "@/components/projects/code-viewer"
import type { GeneratedCode } from "@/types"

interface CompleteStateProps {
  code: GeneratedCode
  onDeploy: () => void
  onDownload: () => void
}

export function CompleteState({ code, onDeploy, onDownload }: CompleteStateProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-6 py-3 border-b bg-muted/30"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{code.totalFiles}</span> файлов
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{code.totalLines}</span> строк кода
        </div>
      </motion.div>

      {/* Code viewer - takes remaining space */}
      <div className="flex-1 min-h-0">
        <CodeViewer files={code.files} />
      </div>

      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 px-6 py-3 border-t bg-background"
      >
        <Button
          onClick={onDeploy}
          className="gap-2 bg-[image:var(--gradient-main)] hover:brightness-110"
        >
          <Rocket className="size-4" />
          Развернуть
        </Button>
        <Button variant="secondary" onClick={onDownload} className="gap-2">
          <Download className="size-4" />
          Скачать ZIP
        </Button>
        <Button variant="ghost" className="gap-2" disabled>
          <ExternalLink className="size-4" />
          Превью
        </Button>
      </motion.div>
    </div>
  )
}
