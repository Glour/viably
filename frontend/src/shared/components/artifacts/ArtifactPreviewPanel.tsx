"use client"

import { memo, useState, useMemo, useCallback, useEffect } from "react"
import { Eye, Sparkles, Code2 } from "lucide-react"
import { FeatureGallery } from "./FeatureGallery"
import { motion, AnimatePresence } from "motion/react"
import { ArtifactTabs } from "./ArtifactTabs"
import { ArtifactToolbar, type ViewMode } from "./ArtifactToolbar"
import { HTMLPreview } from "./HTMLPreview"
import { CodeEditor } from "./CodeEditor"
import { cn } from "@/shared/lib/utils"
import type { ArtifactPreviewPanelProps } from "@/features/generation/types"
import { FileTree } from "@/features/generation/components/FileTree"
import { WebContainerPreview } from "@/shared/components/preview"
import type { DeviceSize } from "@/shared/components/preview"

export const ArtifactPreviewPanel = memo(function ArtifactPreviewPanel({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onUpdateArtifact,
  isStreaming,
  isBotProject = false,
  onReady,
}: ArtifactPreviewPanelProps & { isStreaming?: boolean; isBotProject?: boolean; onReady?: () => void }) {
  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [wcReady, setWcReady] = useState(false)

  const handleReady = useCallback(() => {
    if (!wcReady) {
      setWcReady(true)
      setViewMode("preview")
      onReady?.()
    }
  }, [wcReady, onReady])
  const [showGallery, setShowGallery] = useState(true)
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop")
  const [editedContent, setEditedContent] = useState<string | null>(null)
  const [fileTreeOpen, setFileTreeOpen] = useState(true)

  const activeArtifact = useMemo(
    () => artifacts.find((a) => a.id === activeArtifactId) || artifacts[0],
    [artifacts, activeArtifactId]
  )

  useEffect(() => {
    if (artifacts.length > 0 && !activeArtifactId) {
      onSelectArtifact(artifacts[0].id)
    }
  }, [artifacts, activeArtifactId, onSelectArtifact])

  const handleSelectArtifact = useCallback(
    (artifactId: string) => {
      onSelectArtifact(artifactId)
      setEditedContent(null)
      // Always switch to preview when selecting
      setViewMode("preview")
    },
    [onSelectArtifact]
  )

  const handleCodeChange = useCallback((newContent: string) => {
    setEditedContent(newContent)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (editedContent && activeArtifact && editedContent !== activeArtifact.content) {
          onUpdateArtifact(activeArtifact.id, { content: editedContent })
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [editedContent, activeArtifact, onUpdateArtifact])

  const rawContent = editedContent ?? activeArtifact?.content ?? ""
  const displayContent = rawContent.replace(/^#\s*filename:.*\n?/im, "")

  // Detect project type
  const isReactProject = artifacts.some(
    (a) => a.type === "react" || /\.(tsx|jsx)$/.test(a.title || "")
  )
  const hasHTMLArtifacts = artifacts.some(
    (a) => a.type === "html" && !/index\.html$/.test(a.title || "")
  )
  const hasPreview = hasHTMLArtifacts || isReactProject

  // Build preview HTML — only needed for pure HTML projects
  const previewHTML = useMemo(() => {
    if (!activeArtifact || isReactProject) return ""
    const htmlArtifact = artifacts.find((a) => a.type === "html")
    const cssArtifacts = artifacts.filter((a) => a.type === "css")
    const jsArtifacts = artifacts.filter((a) => a.type === "javascript" || a.type === "typescript")
    if (htmlArtifact || activeArtifact.type === "html") {
      const baseHTML = activeArtifact.type === "html" ? displayContent : (htmlArtifact?.content ?? "")
      const cssContent = cssArtifacts.map((a) => a.content).join("\n")
      const jsContent = jsArtifacts.map((a) => a.content).join("\n")
      const isFullDoc = /<!DOCTYPE|<html/i.test(baseHTML)
      if (isFullDoc) {
        let html = baseHTML
        if (cssContent.trim()) {
          const tag = `<style>${cssContent}</style>`
          html = html.includes("</head>") ? html.replace("</head>", `${tag}\n</head>`) : tag + html
        }
        if (jsContent.trim()) {
          const tag = `<script>${jsContent}</script>`
          html = html.includes("</body>") ? html.replace("</body>", `${tag}\n</body>`) : html + tag
        }
        return html
      }
      return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif}
${cssContent}</style></head><body>${baseHTML}<script>${jsContent}</script></body>
</html>`
    }
    return ""
  }, [artifacts, activeArtifact, displayContent, isReactProject])

  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-violet-500/[0.03] via-background to-indigo-500/[0.03]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          {isStreaming ? (
            <>
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center ring-1 ring-violet-500/10">
                <Sparkles className="size-7 text-violet-400 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-semibold text-foreground/80">Генерация...</h3>
                <p className="font-body text-sm text-muted-foreground/60 max-w-[280px]">AI пишет код для вас</p>
              </div>
              <div className="flex items-center justify-center gap-1 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500/80 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 mx-auto rounded-xl bg-white/[0.04] flex items-center justify-center ring-1 ring-white/[0.06]">
                <Code2 className="size-7 text-muted-foreground/40" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-semibold text-foreground/70">Начните создавать</h3>
                <p className="font-body text-sm text-muted-foreground/40 max-w-[280px]">Отправьте сообщение для генерации кода</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    )
  }

  if (!activeArtifact) return null

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar with Gallery + Preview tabs */}
      <div className="flex items-center justify-between h-11 px-3 border-b border-white/[0.06] bg-background/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowGallery(true)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
              showGallery
                ? "bg-violet-500/15 text-violet-400 shadow-sm"
                : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.04]"
            ].join(" ")}
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">Viably</span>
          </button>
          {hasPreview && !isBotProject && (
            <button
              onClick={() => setShowGallery(false)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                !showGallery
                  ? "bg-violet-500/15 text-violet-400 shadow-sm"
                  : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.04]"
              ].join(" ")}
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          )}
        </div>
      </div>
      {showGallery ? (
        <FeatureGallery className="flex-1" />
      ) : (

      <div className="flex-1 overflow-hidden relative flex">
        {viewMode === "code" && artifacts.length > 1 && fileTreeOpen && (
          <div className="w-[220px] min-w-[220px] border-r border-white/[0.06] overflow-hidden bg-black/20 backdrop-blur-sm">
            <FileTree
              artifacts={artifacts}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={handleSelectArtifact}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {viewMode === "code" && (
            <ArtifactTabs
              artifacts={artifacts}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={handleSelectArtifact}
            />
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeArtifact.id}-${viewMode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="h-full flex-1 min-w-0"
            >
              {viewMode === "preview" ? (
                hasPreview ? (
                  <div className="h-full overflow-hidden relative">
                    {isReactProject ? (
                      <WebContainerPreview
                        artifacts={artifacts}
                        deviceSize={deviceSize}
                        className="h-full"
                        onReady={handleReady}
                      />
                    ) : deviceSize === "desktop" ? (
                      <HTMLPreview html={previewHTML} className="h-full w-full" />
                    ) : (
                      <div className="h-full flex items-start justify-center bg-black/10 overflow-auto p-6">
                        <div
                          className="bg-background rounded-xl shadow-2xl shadow-black/20 overflow-hidden transition-all duration-300 h-full shrink-0 ring-1 ring-white/10"
                          style={{ width: deviceSize === "tablet" ? "768px" : "375px" }}
                        >
                          <HTMLPreview html={previewHTML} className="h-full" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <CodeEditor value={displayContent} artifact={activeArtifact} readOnly />
                )
              ) : (
                <CodeEditor
                  value={displayContent}
                  artifact={activeArtifact}
                  onChange={handleCodeChange}
                  readOnly={false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {editedContent && editedContent !== activeArtifact.content && (
          <div className="absolute top-2 right-3 px-2.5 py-1 rounded-md bg-amber-500/90 text-white text-[11px] font-medium shadow-lg shadow-amber-500/20">
            Несохранённые изменения
          </div>
        )}
      </div>
      )}
    </div>
  )
})
