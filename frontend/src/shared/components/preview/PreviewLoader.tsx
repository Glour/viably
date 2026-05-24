"use client"

import { cn } from "@/shared/lib/utils"
import type { PreviewLoaderProps } from "./types"

export function PreviewLoader({ status, progress, progressLabel }: PreviewLoaderProps) {
  const stages = [
    { label: "Загрузка окружения", threshold: 10 },
    { label: "Установка зависимостей", threshold: 30 },
    { label: "Запуск сервера", threshold: 70 },
  ]

  const activeStageIdx = stages.reduce((acc, s, i) => (progress >= s.threshold ? i : acc), -1)

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-background">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary animate-spin"
            style={{ animationDuration: "2s" }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        {/* Glow */}
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl -z-10" />
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          {progressLabel || "Подготовка превью..."}
        </p>
        <p className="text-xs text-muted-foreground">
          Первый запуск занимает до 30 секунд
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 space-y-2">
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">{progress}%</p>
      </div>

      {/* Stage indicators */}
      <div className="flex gap-4">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                i <= activeStageIdx
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              )}
            />
            <span
              className={cn(
                "text-xs transition-colors duration-300",
                i === activeStageIdx
                  ? "text-foreground font-medium"
                  : i < activeStageIdx
                    ? "text-primary"
                    : "text-muted-foreground/50"
              )}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
