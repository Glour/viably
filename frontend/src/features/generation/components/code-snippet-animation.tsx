"use client"

import { useRef, useEffect, useMemo, memo } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { motion, AnimatePresence } from "motion/react"

interface StreamingFile {
  filename: string
  language: string
  code: string
  complete: boolean
}

interface CodeSnippetAnimationProps {
  snippets?: string[] | { language: string; code: string }[]
  streamingFiles?: StreamingFile[]
}

// Memoized FileCard component to prevent unnecessary re-renders
const FileCard = memo(({ file }: { file: StreamingFile }) => {
  return (
    <motion.div
      key={file.filename}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-[#011627] rounded-lg overflow-hidden"
      style={{
        willChange: "opacity, transform",
        contain: "layout style paint",
      }}
    >
      {/* File header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#011627]/80 border-b border-white/5">
        <span className="text-xs font-code text-emerald-400/80">
          {file.filename}
        </span>
        {file.complete && (
          <span className="text-[10px] font-code text-green-500/60 ml-auto">
            ✓
          </span>
        )}
        {!file.complete && (
          <span className="text-[10px] font-code text-yellow-500/60 ml-auto animate-pulse">
            ●
          </span>
        )}
      </div>

      {/* Code content */}
      <div className="p-4">
        <Highlight
          theme={themes.nightOwl}
          code={file.code}
          language={file.language}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className="text-sm font-code"
              style={{
                ...style,
                backgroundColor: "transparent",
                margin: 0,
                padding: 0,
              }}
            >
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line })
                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                )
              })}
              {!file.complete && (
                <span className="animate-pulse text-primary">▌</span>
              )}
            </pre>
          )}
        </Highlight>
      </div>
    </motion.div>
  )
})
FileCard.displayName = "FileCard"

export const CodeSnippetAnimation = memo(function CodeSnippetAnimation({ snippets, streamingFiles }: CodeSnippetAnimationProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Use streamingFiles if available, otherwise fall back to old snippets format
  const files = useMemo<StreamingFile[]>(() => {
    if (streamingFiles && streamingFiles.length > 0) {
      return streamingFiles
    }

    // Fallback: old format (plain strings or {language, code} objects)
    if (!snippets || snippets.length === 0) return []

    if (typeof snippets[0] === "string") {
      // Old format: concatenate all snippets into a single preview
      const combined = (snippets as string[]).join("")
      if (!combined.trim()) return []
      return [{
        filename: "preview",
        language: "python",
        code: combined,
        complete: false,
      }]
    }

    return (snippets as { language: string; code: string }[]).map((s, i) => ({
      filename: `file-${i}`,
      language: s.language,
      code: s.code,
      complete: true,
    }))
  }, [snippets, streamingFiles])

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [files])

  if (files.length === 0) return null

  return (
    <div
      ref={scrollRef}
      className="space-y-3 overflow-auto max-h-[400px]"
      style={{
        willChange: "scroll-position",
        contain: "size layout",
      }}
    >
      <AnimatePresence>
        {files.map((file) => (
          <FileCard key={file.filename} file={file} />
        ))}
      </AnimatePresence>
    </div>
  )
})
