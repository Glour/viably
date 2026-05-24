"use client"

import { memo, useCallback } from "react"
import { useTheme } from "next-themes"
import { MonacoEditorDynamic } from "@/features/generation/components/monaco-editor-dynamic"
import { getMonacoLanguage } from "@/features/generation/lib/artifacts/utils"
import { cn } from "@/shared/lib/utils"
import type { Artifact } from "@/features/generation/types"

interface CodeEditorProps {
  value: string
  language?: string
  artifact?: Artifact
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}

export const CodeEditor = memo(function CodeEditor({
  value,
  language,
  artifact,
  onChange,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const { theme: appTheme } = useTheme()
  const monacoLanguage = artifact ? getMonacoLanguage(artifact) : language || "plaintext"
  const editorTheme = "vs-dark"

  const handleChange = useCallback(
    (newValue: string) => {
      if (!readOnly && onChange) onChange(newValue)
    },
    [onChange, readOnly]
  )

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#1e1e1e]", className)}>
      <MonacoEditorDynamic
        value={value}
        language={monacoLanguage}
        theme={editorTheme}
        onChange={handleChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
          fontLigatures: true,
          lineNumbers: "on",
          lineHeight: 20,
          wordWrap: "on",
          wrappingIndent: "indent",
          automaticLayout: true,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          cursorBlinking: "smooth",
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: readOnly ? "none" : "line",
          renderLineHighlightOnlyWhenFocus: true,
          folding: true,
          links: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          occurrencesHighlight: "off" as const,
        }}
      />
    </div>
  )
})
