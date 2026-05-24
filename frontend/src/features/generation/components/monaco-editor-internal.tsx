"use client"

import Editor from "@monaco-editor/react"
import type { MonacoEditorDynamicProps } from "./monaco-editor-dynamic"

export function MonacoEditorInternal({
  value,
  language,
  theme = "vs-dark",
  options = {},
  onChange,
  onMount,
}: MonacoEditorDynamicProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={value}
        onChange={(val) => onChange?.(val ?? "")}
        onMount={(editor, monaco) => {
          const model = editor.getModel()
          onMount?.(editor, model)
        }}
        options={{
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          ...options,
        }}
        loading={<div className="h-full w-full animate-pulse rounded-lg bg-muted" />}
      />
    </div>
  )
}
