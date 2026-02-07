"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { motion, AnimatePresence } from "motion/react"

interface CodeSnippetAnimationProps {
  snippets: string[] | { language: string; code: string }[]
}

/**
 * Normalize snippets to structured format
 * Accepts either plain strings or structured objects
 */
function normalizeSnippets(
  snippets: string[] | { language: string; code: string }[]
): { language: string; code: string }[] {
  if (snippets.length === 0) return []

  // Check if first element is a string
  if (typeof snippets[0] === "string") {
    return (snippets as string[]).map((code) => ({
      language: "python", // Default for bot templates
      code,
    }))
  }

  return snippets as { language: string; code: string }[]
}

export function CodeSnippetAnimation({ snippets }: CodeSnippetAnimationProps) {
  const normalizedSnippets = useMemo(() => normalizeSnippets(snippets), [snippets])
  const [currentSnippetIndex, setCurrentSnippetIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentSnippet = normalizedSnippets[currentSnippetIndex]

  const advanceToNextSnippet = useCallback(() => {
    if (currentSnippetIndex < normalizedSnippets.length - 1) {
      setCurrentSnippetIndex((prev) => prev + 1)
      setCharIndex(0)
    } else {
      setIsComplete(true)
    }
  }, [currentSnippetIndex, normalizedSnippets.length])

  useEffect(() => {
    if (isComplete || !currentSnippet) return

    const codeLength = currentSnippet.code.length

    if (charIndex >= codeLength) {
      const timeout = setTimeout(advanceToNextSnippet, 500)
      return () => clearTimeout(timeout)
    }

    const interval = setInterval(() => {
      setCharIndex((prev) => prev + 1)
    }, 50)

    return () => clearInterval(interval)
  }, [charIndex, currentSnippet, isComplete, advanceToNextSnippet])

  if (normalizedSnippets.length === 0) return null

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {normalizedSnippets.map((snippet, index) => {
          if (index > currentSnippetIndex) return null

          const isActive = index === currentSnippetIndex && !isComplete
          const displayCode = isActive
            ? snippet.code.slice(0, charIndex)
            : snippet.code

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#011627] rounded-lg p-4 overflow-hidden"
            >
              <Highlight
                theme={themes.nightOwl}
                code={displayCode}
                language={snippet.language}
              >
                {({ style, tokens, getLineProps, getTokenProps }) => (
                  <pre
                    className="text-sm font-mono"
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
                          {isActive && i === tokens.length - 1 && (
                            <span className="animate-pulse">|</span>
                          )}
                        </div>
                      )
                    })}
                  </pre>
                )}
              </Highlight>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
