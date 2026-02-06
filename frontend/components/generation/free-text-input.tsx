"use client"

import * as React from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FreeTextInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function FreeTextInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: FreeTextInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    // Reset height to auto to get the correct scrollHeight
    target.style.height = "auto"
    // Set height based on content, but respect min and max
    target.style.height = `${Math.min(Math.max(target.scrollHeight, 80), 200)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && value.trim() && !disabled) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="space-y-4">
      {/* Divider with centered text */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          или опиши своими словами
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Опиши что хочешь получить..."
        className={cn(
          "w-full resize-none overflow-y-auto rounded-xl border bg-background px-4 py-3 text-sm",
          "transition-colors placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[80px] max-h-[200px]"
        )}
        style={{ height: "80px" }}
      />

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={!value.trim() || disabled}
          onClick={onSubmit}
        >
          Отправить
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
