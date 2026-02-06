"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Code2 } from "lucide-react"
import { Shimmer } from "@/components/ui/shimmer"
import { FileTree } from "./file-tree"
import type { ProjectFile } from "@/types"

/* ------------------------------------------------------------------ */
/*  Monaco Editor — dynamic import (no SSR)                             */
/* ------------------------------------------------------------------ */

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Shimmer height="100%" className="rounded-lg" />,
})

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

  const selectedFile = selectedPath
    ? findFileByPath(files, selectedPath)
    : null

  const handleSelectFile = useCallback((file: ProjectFile) => {
    setSelectedPath(file.path)
  }, [])

  if (files.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-xl border bg-card">
        <div className="text-center text-muted-foreground">
          <Code2 className="mx-auto mb-3 size-10 opacity-40" />
          <p className="text-sm">Нет файлов для этого проекта</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[600px] overflow-hidden rounded-xl border bg-card">
      {/* File tree sidebar */}
      <div className="w-56 shrink-0 overflow-y-auto border-r bg-muted/30 py-2">
        <FileTree
          files={files}
          selectedPath={selectedPath}
          onSelectFile={handleSelectFile}
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 min-w-0">
        {selectedFile ? (
          <MonacoEditor
            height="100%"
            language={getLanguageFromPath(selectedFile.path)}
            theme="vs-dark"
            value={selectedFile.content ?? ""}
            options={{
              readOnly: true,
              minimap: { enabled: true },
              lineNumbers: "on",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-sm">Выбери файл для просмотра</p>
          </div>
        )}
      </div>
    </div>
  )
}
