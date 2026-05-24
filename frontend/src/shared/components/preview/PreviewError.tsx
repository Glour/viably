"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/shared/ui/button"
import type { PreviewErrorProps } from "./types"

export function PreviewError({ error, onRetry }: PreviewErrorProps) {
  // Determine error type: build error (from Vite) vs system error (WebContainer boot)
  const isBuildError = error.includes("Error:") || error.includes("SyntaxError") ||
    error.includes("Cannot find") || error.includes("is not defined") ||
    error.includes("npm ERR") || error.includes("Build failed")

  const title = isBuildError
    ? "Ошибка в коде проекта"
    : "Ошибка запуска превью"

  const description = isBuildError
    ? "В сгенерированном коде обнаружена ошибка. Попробуйте уточнить запрос или перезапустить превью."
    : "Не удалось запустить превью. Попробуйте перезапустить."

  // Show first 3 lines of error for build errors
  const errorLines = error.split("\n").filter(Boolean).slice(0, 4).join("\n")

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 bg-background">
      {/* Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-destructive/10 blur-xl -z-10" />
      </div>

      {/* Text */}
      <div className="text-center space-y-1 max-w-sm">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Error details */}
      {isBuildError && errorLines && (
        <pre className="w-full max-w-md bg-muted/50 border border-border rounded-lg p-3 text-xs text-destructive font-mono overflow-x-auto whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
          {errorLines}
        </pre>
      )}

      {/* Retry button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="gap-2"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Перезапустить превью
      </Button>
    </div>
  )
}
