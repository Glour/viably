"use client"

/**
 * T054: Monaco Editor Internal Component
 *
 * This is the actual Monaco Editor implementation that gets lazy-loaded.
 * It uses the existing useMonacoEditor hook for proper memory management.
 *
 * This file should NOT be imported directly. Use MonacoEditorDynamic instead.
 */

import { useEffect } from "react"
import { useMonacoEditor } from "@/hooks/useMonacoEditor"
import type { MonacoEditorDynamicProps } from "./monaco-editor-dynamic"

export function MonacoEditorInternal({
  value,
  language,
  theme = "vs-dark",
  options = {},
  onChange,
  onMount,
}: MonacoEditorDynamicProps) {
  const { containerRef, editor, model, isReady } = useMonacoEditor({
    value,
    language,
    theme,
    options,
  })

  // Handle onChange callback
  useEffect(() => {
    if (!editor || !onChange) return

    const disposable = (editor as any).onDidChangeModelContent(() => {
      const currentValue = (editor as any).getValue()
      onChange(currentValue)
    })

    return () => disposable.dispose()
  }, [editor, onChange])

  // Handle onMount callback
  useEffect(() => {
    if (!editor || !model || !isReady || !onMount) return

    onMount(editor, model)
  }, [editor, model, isReady, onMount])

  return <div ref={containerRef} className="h-full w-full" />
}
