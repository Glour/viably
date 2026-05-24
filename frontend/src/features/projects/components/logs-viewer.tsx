"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import type { LogEntry, LogLevel } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const LEVEL_FILTERS = [
  { value: "all", label: "Все" },
  { value: "info", label: "Инфо" },
  { value: "warning", label: "Внимание" },
  { value: "error", label: "Ошибка" },
] as const

type LevelFilter = (typeof LEVEL_FILTERS)[number]["value"]

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
}

const LEVEL_LABELS: Record<LogLevel, string> = {
  info: "INFO",
  warning: "WARN",
  error: "ERROR",
}

/* ------------------------------------------------------------------ */
/*  LogsViewer                                                          */
/* ------------------------------------------------------------------ */

interface LogsViewerProps {
  logs: LogEntry[]
}

export function LogsViewer({ logs }: LogsViewerProps) {
  const [activeFilter, setActiveFilter] = useState<LevelFilter>("all")
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set())
  const logContainerRef = useRef<HTMLDivElement>(null)

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (clearedIds.has(log.id)) return false
      if (activeFilter === "all") return true
      return log.level === activeFilter
    })
  }, [logs, activeFilter, clearedIds])

  /* Auto-scroll to bottom */
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [filteredLogs])

  const handleClear = () => {
    const allVisibleIds = new Set(clearedIds)
    for (const log of logs) {
      allVisibleIds.add(log.id)
    }
    setClearedIds(allVisibleIds)
  }

  const hasLogs = logs.length > 0 && logs.length !== clearedIds.size

  return (
    <div className="space-y-6 pt-6">
      {/* Toolbar */}
      <div className="relative flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-card/60 via-card/40 to-card/20 border border-border/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] blur-[50px] opacity-10 rounded-full" />

        <div className="relative z-10 flex flex-wrap gap-2" role="tablist" aria-label="Фильтр уровня логов">
          {LEVEL_FILTERS.map((filter) => (
            <button
              key={filter.value}
              role="tab"
              aria-selected={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                activeFilter === filter.value
                  ? "bg-[image:var(--gradient-main)] text-white shadow-[0_0_20px_var(--primary-glow)] scale-105"
                  : "bg-card/60 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border/40"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!hasLogs}
          className="relative z-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
        >
          <Trash2 className="size-4 mr-2" />
          Очистить
        </Button>
      </div>

      {/* Log area */}
      {hasLogs ? (
        <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-1 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] blur-[50px] opacity-10 rounded-full" />

          <div
            ref={logContainerRef}
            className="relative z-10 h-[50vh] sm:h-[350px] lg:h-[500px] overflow-y-auto rounded-2xl bg-[#0D1117] p-5 font-mono text-sm"
          >
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-3 py-1 hover:bg-white/5 rounded px-2 transition-colors">
                <span className="text-zinc-500 shrink-0 font-medium">
                  {new Date(log.timestamp).toLocaleTimeString("ru-RU")}
                </span>
                <span className={cn("shrink-0 font-bold w-16", LEVEL_COLORS[log.level])}>
                  [{LEVEL_LABELS[log.level]}]
                </span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative flex h-[50vh] sm:h-[350px] lg:h-[500px] items-center justify-center rounded-3xl border border-border/50 bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-glow)] blur-[70px] opacity-15 rounded-full" />
          <p className="relative z-10 text-base font-medium text-muted-foreground">Нет логов</p>
        </div>
      )}
    </div>
  )
}
