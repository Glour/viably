"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { motion } from "motion/react"

import { formatRelativeTime } from "@/shared/lib/utils/format-relative-time"
import type { ProjectStatus } from "@/shared/types"

function getStatusConfig(status: ProjectStatus, t: any) {
  const configs: Record<ProjectStatus, { label: string; color: string; bg: string; ring: string; pulse?: boolean }> = {
    draft:      { label: t("status_draft"),     color: "text-zinc-500",    bg: "bg-zinc-100 dark:bg-zinc-800/60",    ring: "ring-zinc-200 dark:ring-zinc-700" },
    generating: { label: t("status_generating"), color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/30",   ring: "ring-amber-200 dark:ring-amber-700/50", pulse: true },
    generated:  { label: t("status_generated"),color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-900/30", ring: "ring-violet-200 dark:ring-violet-700/50" },
    ready:      { label: t("status_ready"),        color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-900/30", ring: "ring-violet-200 dark:ring-violet-700/50" },
    deploying:  { label: t("status_deploying"),    color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/30",     ring: "ring-blue-200 dark:ring-blue-700/50", pulse: true },
    deployed:   { label: t("status_deployed"),      color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30",ring: "ring-emerald-200 dark:ring-emerald-700/50" },
    stopped:    { label: t("status_stopped"),   color: "text-zinc-500",    bg: "bg-zinc-100 dark:bg-zinc-800/60",    ring: "ring-zinc-200 dark:ring-zinc-700" },
    failed:     { label: t("status_failed"),       color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/30",       ring: "ring-red-200 dark:ring-red-700/50" },
    error:      { label: t("status_failed"),       color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/30",       ring: "ring-red-200 dark:ring-red-700/50" },
  }
  return configs[status] ?? { label: status, color: "text-zinc-500", bg: "bg-zinc-100", ring: "ring-zinc-200" }
}

const INITIAL_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-violet-500",
]

interface ProjectCardProps {
  project: {
    id: string
    name: string
    status: ProjectStatus
    emoji?: string | null
    updatedAt?: string | null
    createdAt: string
  }
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const t = useTranslations("projects")
  const s = getStatusConfig(project.status, t) ?? STATUS_CONFIG.draft
  const initial = (project.name?.[0] ?? "P").toUpperCase()
  const gradientIndex = project.name.charCodeAt(0) % INITIAL_COLORS.length
  const gradient = INITIAL_COLORS[gradientIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
    >
      <Link href={`/projects/${project.id}`} className="group block">
        <div className="relative flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)] dark:hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)] hover:border-border cursor-pointer min-h-[120px]">

          {/* Header: initial avatar + name */}
          <div className="flex items-center gap-3">
            <div className={`size-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
              <span className="text-sm font-bold text-white">{initial}</span>
            </div>
            <h3 className="font-semibold text-[13px] leading-tight text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-2 flex-1">
              {project.name}
            </h3>
          </div>

          {/* Footer: status + time */}
          <div className="flex items-center justify-between mt-auto">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${s.bg} ${s.color} ${s.ring}`}>
              <span className={`size-1.5 rounded-full bg-current ${s.pulse ? "animate-pulse" : ""}`} />
              {s.label}
            </span>
            <span className="text-[11px] text-muted-foreground/50 tabular-nums">
              {project.updatedAt
                ? formatRelativeTime(project.updatedAt)
                : formatRelativeTime(project.createdAt)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
