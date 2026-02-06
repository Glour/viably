"use client"

import { useState, useEffect, useCallback } from "react"
import { Highlight, themes } from "prism-react-renderer"
import { motion, AnimatePresence } from "motion/react"

interface CodeSnippetAnimationProps {
  snippets: { language: string; code: string }[]
}

export function CodeSnippetAnimation({ snippets }: CodeSnippetAnimationProps) {
  const [currentSnippetIndex, setCurrentSnippetIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const currentSnippet = snippets[currentSnippetIndex] as
    | { language: string; code: string }
    | undefined

  const advanceToNextSnippet = useCallback(() => {
    if (currentSnippetIndex < snippets.length - 1) {
      setCurrentSnippetIndex((prev) => prev + 1)
      setCharIndex(0)
    } else {
      setIsComplete(true)
    }
  }, [currentSnippetIndex, snippets.length])

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

  if (snippets.length === 0) return null

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {snippets.map((snippet, index) => {
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
