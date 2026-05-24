"use client"

import { useState, useCallback } from "react"
import { Code2, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { FileTree } from "./file-tree"
import { MonacoEditorDynamic } from "@/features/generation/components/monaco-editor-dynamic"
import type { ProjectFile } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Recursively find a file by path in a ProjectFile tree. */
function findFileByPath(
  files: ProjectFile[],
  targetPath: string
): ProjectFile | null {
  for (const file of files) {
    if (file.path === targetPath && file.type === "file") {
      return file
    }
    if (file.children) {
      const found = findFileByPath(file.children, targetPath)
      if (found) return found
    }
  }
  return null
}

/** Infer Monaco language from file extension. */
function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    tsx: "typescriptreact",
    jsx: "javascriptreact",
    json: "json",
    md: "markdown",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "shell",
    bash: "shell",
    css: "css",
    html: "html",
    xml: "xml",
    dockerfile: "dockerfile",
    env: "plaintext",
    txt: "plaintext",
    cfg: "ini",
    ini: "ini",
    conf: "ini",
  }
  return languageMap[ext ?? ""] ?? "plaintext"
}

/* ------------------------------------------------------------------ */
/*  CodeViewer                                                           */
/* ------------------------------------------------------------------ */

interface CodeViewerProps {
  files: ProjectFile[]
}

export function CodeViewer({ files }: CodeViewerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [showTree, setShowTree] = useState(true)

  const selectedFile = selectedPath
    ? findFileByPath(files, selectedPath)
    : null

  const handleSelectFile = useCallback((file: ProjectFile) => {
    setSelectedPath(file.path)
    // Auto-collapse tree on mobile after file selection
    if (window.innerWidth < 640) setShowTree(false)
  }, [])

  if (files.length === 0) {
    return (
      <div className="relative flex h-[50vh] sm:h-[400px] lg:h-[500px] items-center justify-center rounded-3xl border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-glow)] blur-[70px] opacity-15 rounded-full" />
        <div className="relative z-10 text-center text-muted-foreground">
          <Code2 className="mx-auto mb-3 size-10 opacity-40 animate-pulse" />
          <p className="text-sm font-body font-medium">Нет файлов для этого проекта</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-[50vh] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl group">
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-[image:var(--gradient-cool)] opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] blur-[50px] opacity-10 rounded-full pointer-events-none" />

      {/* File tree sidebar — collapsible, hidden by default on mobile */}
      {showTree && (
        <div className="relative w-52 shrink-0 overflow-y-auto border-r border-border/50 bg-card/40 backdrop-blur-sm py-1.5 z-10">
          <FileTree
            files={files}
            selectedPath={selectedPath}
            onSelectFile={handleSelectFile}
          />
        </div>
      )}

      {/* Editor area */}
      <div className="relative flex-1 min-w-0 flex flex-col z-10">
        {/* Toggle toolbar */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-card/20 backdrop-blur-sm px-2.5 py-1.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowTree(!showTree)}
            aria-label={showTree ? "Скрыть файлы" : "Показать файлы"}
            className="hover:bg-card/40 transition-colors"
          >
            {showTree ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </Button>
          {selectedFile && (
            <span className="text-xs font-code font-medium text-muted-foreground truncate">{selectedFile.path}</span>
          )}
        </div>

        <div className="flex-1 min-h-0">
        {selectedFile ? (
          <div className="relative h-full w-full">
            <MonacoEditorDynamic
              value={selectedFile.content ?? ""}
              language={getLanguageFromPath(selectedFile.path)}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: true },
                lineNumbers: "on",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 18,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Code2 className="mx-auto mb-2.5 size-8 opacity-40 animate-pulse" />
              <p className="text-sm font-body font-medium">Выбери файл для просмотра</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
