"use client"

import { useState, useMemo, useCallback } from "react"
import { motion } from "motion/react"
import { Download, Rocket, Code, Eye } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { CodeViewer } from "@/features/projects/components"
import { HTMLPreview } from "@/shared/components/artifacts/HTMLPreview"
import type { GeneratedCode } from "@/shared/types"

interface CompleteStateProps {
  code: GeneratedCode
  onDeploy: () => void
  onDownload: () => void
}

/**
 * Detect if project is a website (has HTML files)
 */
function isWebProject(code: GeneratedCode): boolean {
  return code.files.some((f) => f.path.endsWith(".html"))
}

/**
 * Get all HTML files from the project
 */
function getHtmlFiles(code: GeneratedCode): Map<string, string> {
  const map = new Map<string, string>()
  for (const f of code.files) {
    if (f.path.endsWith(".html") && f.content) {
      map.set(f.path, f.content)
      // Also map by filename only (e.g., "about.html")
      const name = f.path.split("/").pop()
      if (name) map.set(name, f.content)
    }
  }
  return map
}

/**
 * Build full HTML content for iframe preview.
 * Inlines CSS from separate style files into the HTML.
 */
function buildHtmlForFile(code: GeneratedCode, htmlContent: string): string {
  let html = htmlContent

  // Find and inline CSS files
  const cssFiles = code.files.filter((f) => f.path.endsWith(".css"))
  for (const css of cssFiles) {
    if (!css.content) continue
    const cssFileName = css.path.split("/").pop() || css.path
    // Replace <link rel="stylesheet" href="..."> with inline <style>
    const linkRegex = new RegExp(
      `<link[^>]*href=["'](?:\.\/)?${cssFileName.replace(".", "\\.")}["'][^>]*\/?>`,
      "gi"
    )
    if (linkRegex.test(html)) {
      html = html.replace(linkRegex, `<style>${css.content}</style>`)
    } else {
      // If no link tag found, inject before </head>
      html = html.replace("</head>", `<style>${css.content}</style>\n</head>`)
    }
  }

  // Find and inline JS files
  const jsFiles = code.files.filter(
    (f) => f.path.endsWith(".js") && !f.path.endsWith(".json")
  )
  for (const js of jsFiles) {
    if (!js.content) continue
    const jsFileName = js.path.split("/").pop() || js.path
    const scriptRegex = new RegExp(
      `<script[^>]*src=["'](?:\.\/)?${jsFileName.replace(".", "\\.")}["'][^>]*>\s*</script>`,
      "gi"
    )
    if (scriptRegex.test(html)) {
      html = html.replace(scriptRegex, `<script>${js.content}</script>`)
    } else {
      html = html.replace("</body>", `<script>${js.content}</script>\n</body>`)
    }
  }

  return html
}

function buildHtmlContent(code: GeneratedCode): string {
  const htmlFile = code.files.find(
    (f) => f.path === "index.html" || f.path.endsWith("/index.html")
  ) || code.files.find((f) => f.path.endsWith(".html"))

  if (!htmlFile?.content) return ""
  return buildHtmlForFile(code, htmlFile.content)
}

export function CompleteState({ code, onDeploy, onDownload }: CompleteStateProps) {
  const isWeb = useMemo(() => isWebProject(code), [code])
  const [viewMode, setViewMode] = useState<"preview" | "code">(isWeb ? "preview" : "code")
  const htmlFiles = useMemo(() => (isWeb ? getHtmlFiles(code) : new Map()), [code, isWeb])
  const [currentHtml, setCurrentHtml] = useState<string>(() =>
    isWeb ? buildHtmlContent(code) : ""
  )

  const handleNavigate = useCallback((href: string) => {
    // Clean up the href (remove leading ./)
    const cleanHref = href.replace(/^\.\//, "")

    // Try to find the requested HTML file
    const fileContent = htmlFiles.get(cleanHref)
    if (fileContent) {
      // Multi-page: switch to the requested file
      setCurrentHtml(buildHtmlForFile(code, fileContent))
      return
    }

    // File not found — show toast
    toast.info("Это одностраничный сайт — страница не найдена", {
      description: `Ссылка на "${cleanHref}" ведёт на несуществующую страницу`,
    })
  }, [htmlFiles, code])

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 px-6 py-3 border-b bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
          <span className="font-code font-semibold text-foreground">{code.totalFiles}</span> файлов
        </div>
        <div className="h-4 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
        <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
          <span className="font-code font-semibold text-foreground">{code.totalLines}</span> строк кода
        </div>

        {/* View mode toggle for web projects */}
        {isWeb && (
          <>
            <div className="h-4 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
                className="gap-1.5 h-7 px-2.5 text-xs font-body"
              >
                <Eye className="size-3.5" />
                Превью
              </Button>
              <Button
                variant={viewMode === "code" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("code")}
                className="gap-1.5 h-7 px-2.5 text-xs font-body"
              >
                <Code className="size-3.5" />
                Код
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {viewMode === "preview" && isWeb ? (
          <div className="h-full w-full bg-card">
            <HTMLPreview
              html={currentHtml}
              onNavigate={handleNavigate}
              className="w-full h-full"
            />
          </div>
        ) : (
          <CodeViewer files={code.files} />
        )}
      </div>

      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 px-6 py-4 border-t bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-sm"
      >
        <div className="relative group">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-xl bg-[image:var(--gradient-main)] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          />
          <Button
            onClick={onDeploy}
            className="relative gap-2 font-semibold font-heading bg-[image:var(--gradient-main)] bg-[length:200%_200%] text-white hover:opacity-90 hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-105 transition-all duration-300"
          >
            <Rocket className="size-4" />
            Развернуть
          </Button>
        </div>
        <Button variant="secondary" onClick={onDownload} className="gap-2 font-medium font-body hover:scale-105 transition-all duration-300">
          <Download className="size-4" />
          Скачать ZIP
        </Button>
      </motion.div>
    </div>
  )
}
