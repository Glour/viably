"use client"

import { memo, useState, useCallback } from "react"
import {
  Eye,
  Code2,
  Download,
  Copy,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  Rocket,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { copyToClipboard } from "@/features/generation/lib/artifacts/utils"
import type { Artifact } from "@/features/generation/types"

export type ViewMode = "preview" | "code"
type DeviceSize = "desktop" | "tablet" | "mobile"

interface ArtifactToolbarProps {
  artifact: Artifact
  artifacts: Artifact[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  deviceSize: DeviceSize
  onDeviceSizeChange: (size: DeviceSize) => void
  hasHTMLPreview: boolean
  onDeploy?: () => void
  className?: string
}

export const ArtifactToolbar = memo(function ArtifactToolbar({
  artifact,
  artifacts,
  viewMode,
  onViewModeChange,
  deviceSize,
  onDeviceSizeChange,
  hasHTMLPreview,
  onDeploy,
  className,
}: ArtifactToolbarProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadZip = useCallback(async () => {
    const JSZip = (await import("jszip")).default
    const { saveAs } = await import("file-saver")
    const zip = new JSZip()

    const extMap: Record<string, string> = {
      html: "html", css: "css", javascript: "js", typescript: "ts",
      python: "py", react: "tsx", json: "json", markdown: "md",
    }

    for (const a of artifacts) {
      const ext = extMap[a.type] || a.language || "txt"
      const name = a.title ? `${a.title}.${ext}` : `artifact.${ext}`
      zip.file(name, a.content)
    }

    const blob = await zip.generateAsync({ type: "blob" })
    saveAs(blob, "artifacts.zip")
  }, [artifacts])

  return (
    <div
      className={cn(
        "flex items-center justify-between h-11 px-3 border-b border-white/[0.06] bg-background/95 backdrop-blur-md shrink-0",
        className
      )}
    >
      {/* Left: View toggle */}
      <div className="flex items-center gap-0.5">
        {hasHTMLPreview && (
          <button
            onClick={() => onViewModeChange("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
              viewMode === "preview"
                ? "bg-violet-500/15 text-violet-400 shadow-sm shadow-violet-500/5"
                : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.04]"
            )}
          >
            <Eye className="size-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        )}
        {/* TODO: раскомментировать когда будем добавлять просмотр кода обратно
        <button
          onClick={() => onViewModeChange("code")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
            viewMode === "code"
              ? "bg-violet-500/15 text-violet-400 shadow-sm shadow-violet-500/5"
              : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.04]"
          )}
        >
          <Code2 className="size-3.5" />
          <span className="hidden sm:inline">Code</span>
        </button>
        */}

        {/* Device size toggle (only in preview mode) */}
        {viewMode === "preview" && hasHTMLPreview && (
          <>
            <div className="w-px h-4 bg-white/[0.08] mx-1.5" />
            {([
              { size: "desktop" as DeviceSize, icon: Monitor },
              { size: "tablet" as DeviceSize, icon: Tablet },
              { size: "mobile" as DeviceSize, icon: Smartphone },
            ]).map(({ size, icon: Icon }) => (
              <button
                key={size}
                onClick={() => onDeviceSizeChange(size)}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-150",
                  deviceSize === size
                    ? "text-foreground/90 bg-white/[0.08]"
                    : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-white/[0.04]"
                )}
                title={size}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.04]"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
        </Button>
        {/* ZIP download — disabled, will be added to paid plans
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadZip}
          className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.04]"
        >
          <Download className="size-3" />
          <span className="hidden sm:inline">ZIP</span>
        </Button>
        */}
        {onDeploy && (
          <Button
            variant="default"
            size="sm"
            onClick={onDeploy}
            className="h-7 px-3 text-xs gap-1.5 bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Rocket className="size-3" />
            Deploy
          </Button>
        )}
      </div>
    </div>
  )
})
