'use client'

import * as React from "react"
import { Highlight, themes, type Language } from "prism-react-renderer"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CodeBlockProps {
  children: string
  className?: string
  showLineNumbers?: boolean
}

/**
 * Syntax-highlighted code block component for MDX
 * Supports multiple languages with copy-to-clipboard functionality
 */
export function CodeBlock({ children, className = '', showLineNumbers = false }: CodeBlockProps) {
  const [isCopied, setIsCopied] = React.useState(false)

  // Extract language from className (format: language-xxx)
  const languageMatch = className.match(/language-(\w+)/)
  const language = (languageMatch?.[1] || 'tsx') as Language

  // Clean up code (remove trailing newlines)
  const code = children.trim()

  // Copy to clipboard handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className="relative group my-6">
      {/* Language label */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 dark:bg-muted/30 border border-b-0 rounded-t-lg">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
          {language}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Copy code to clipboard"
        >
          {isCopied ? (
            <Check className="w-3 h-3 text-success" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Code block */}
      <Highlight
        theme={themes.nightOwl}
        code={code}
        language={language}
      >
        {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              'overflow-x-auto p-4 bg-[#011627] dark:bg-[#011627] border rounded-b-lg',
              'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
              highlightClassName
            )}
            style={{
              ...style,
              backgroundColor: '#011627',
              marginTop: 0,
            }}
          >
            <code className="font-code text-sm">
              {tokens.map((line, i) => {
                const lineProps = getLineProps({ line, key: i })
                return (
                  <div
                    key={i}
                    {...lineProps}
                    className={cn(
                      lineProps.className,
                      'table-row'
                    )}
                  >
                    {showLineNumbers && (
                      <span className="table-cell pr-4 text-right select-none opacity-50 w-8">
                        {i + 1}
                      </span>
                    )}
                    <span className="table-cell">
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token, key })} />
                      ))}
                    </span>
                  </div>
                )
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  )
}

/**
 * Inline code component for MDX
 * Used for short code snippets within text
 */
export function InlineCode({ children, className, ...props }: React.ComponentProps<'code'>) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-code text-sm font-medium text-foreground',
        'before:absolute before:inset-0 before:rounded before:bg-primary/10 before:dark:bg-primary/20',
        className
      )}
      {...props}
    >
      <span className="relative">{children}</span>
    </code>
  )
}
