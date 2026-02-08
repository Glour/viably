"use client"

/**
 * T054: Dynamic Monaco Editor Component
 *
 * This wrapper lazy-loads Monaco Editor (76MB) only when needed.
 * Uses Next.js dynamic() to code-split the heavy editor library.
 *
 * Benefits:
 * - Reduces initial bundle size by ~76MB
 * - Editor only loads when component is rendered
 * - Improves Time to Interactive (TTI)
 *
 * Usage:
 * ```tsx
 * <MonacoEditorDynamic
 *   value={code}
 *   language="typescript"
 *   theme="vs-dark"
 *   options={{ readOnly: true }}
 * />
 * ```
 */

import dynamic from "next/dynamic"
import { Shimmer } from "@/components/ui/shimmer"

// T054: Dynamic import with loading state
const MonacoEditorInternal = dynamic(
  () => import("./monaco-editor-internal").then((mod) => mod.MonacoEditorInternal),
  {
    loading: () => <Shimmer height="100%" className="rounded-lg" />,
    ssr: false, // Monaco only works in browser
  }
)

export interface MonacoEditorDynamicProps {
  value: string
  language: string
  theme?: string
  options?: {
    readOnly?: boolean
    minimap?: { enabled: boolean }
    lineNumbers?: "on" | "off"
    fontFamily?: string
    fontSize?: number
    scrollBeyondLastLine?: boolean
    wordWrap?: "on" | "off"
    [key: string]: any
  }
  onChange?: (value: string) => void
  onMount?: (editor: any, model: any) => void
}

export function MonacoEditorDynamic(props: MonacoEditorDynamicProps) {
  return <MonacoEditorInternal {...props} />
}
