"use client"

import * as React from "react"
import { Send } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

interface FreeTextInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

export function FreeTextInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Опиши что хочешь получить...",
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
      {/* Divider with centered text - Enhanced gradient */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <span className="text-xs font-body text-muted-foreground bg-gradient-to-r from-muted-foreground to-muted-foreground/70 bg-clip-text text-transparent">
          или опиши своими словами
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent relative">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
        </div>
      </div>

      {/* Textarea - Glass morphism with gradient border */}
      <div className="relative group">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-primary/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl"
        />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "font-body w-full resize-none overflow-y-auto rounded-xl border border-border/60 bg-card/40 backdrop-blur-md px-4 py-3 text-sm relative",
            "transition-all duration-300 placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:border-primary/50 focus-visible:bg-card/60 focus-visible:shadow-[0_0_20px_var(--primary-glow)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[80px] max-h-[200px]"
          )}
          style={{ height: "80px" }}
        />
      </div>

      {/* Submit button - Enhanced with glow */}
      <div className="flex justify-end">
        <div className="relative group">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-lg bg-primary/30 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={!value.trim() || disabled}
            onClick={onSubmit}
            className="relative gap-2 font-medium font-body hover:scale-105 transition-all duration-300 hover:shadow-[0_0_16px_var(--primary-glow)] border-border/60 bg-card/40 backdrop-blur-md hover:bg-card/60 hover:border-primary/30"
          >
            Отправить
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
