"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LogEntry, LogLevel } from "@/types"

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const LEVEL_FILTERS = [
  { value: "all", label: "Все" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
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
    <div className="space-y-4 pt-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Фильтр уровня логов">
          {LEVEL_FILTERS.map((filter) => (
            <button
              key={filter.value}
              role="tab"
              aria-selected={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
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
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4 mr-1.5" />
          Очистить
        </Button>
      </div>

      {/* Log area */}
      {hasLogs ? (
        <div
          ref={logContainerRef}
          className="h-[500px] overflow-y-auto rounded-lg bg-[#0D1117] p-4 font-mono text-sm"
        >
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-2 py-0.5">
              <span className="text-zinc-500 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString("ru-RU")}
              </span>
              <span className={cn("shrink-0 font-bold w-14", LEVEL_COLORS[log.level])}>
                [{LEVEL_LABELS[log.level]}]
              </span>
              <span className="text-zinc-300">{log.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-[500px] items-center justify-center rounded-lg bg-[#0D1117]">
          <p className="text-sm text-zinc-500">Нет логов</p>
        </div>
      )}
    </div>
  )
}
