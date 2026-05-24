"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { Project, ProjectStatus } from "@/shared/types"
import { Badge } from "@/shared/ui/badge"
import { ProjectActionMenu } from "./project-action-menu"
import { IconRenderer } from "@/shared/components/icon-renderer"
import { ExternalLink } from "lucide-react"

interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
}

function formatRelativeTime(dateString: string, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return t("just_now")
  if (minutes < 60) return t("minutes_ago", { count: minutes })
  if (hours < 24) return t("hours_ago", { count: hours })
  if (days === 1) return t("yesterday")
  if (days <= 30) return t("days_ago", { count: days })
  return new Date(dateString).toLocaleDateString()
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const t = useTranslations("projects")

  const STATUS_CONFIG: Record<
    ProjectStatus,
    { label: string; variant: "secondary" | "info" | "warning" | "success" | "destructive" | "neutral-dark"; pulse?: boolean }
  > = {
    draft: { label: t("status_draft"), variant: "secondary" },
    generating: { label: t("status_generating"), variant: "info", pulse: true },
    generated: { label: t("status_generated"), variant: "warning" },
    deployed: { label: t("status_deployed"), variant: "success" },
    failed: { label: t("status_failed"), variant: "destructive" },
    stopped: { label: t("status_stopped"), variant: "neutral-dark" },
    ready: { label: t("status_ready"), variant: "warning" },
    deploying: { label: t("status_deploying"), variant: "info", pulse: true },
    error: { label: t("status_error"), variant: "destructive" },
  }

  const statusConfig = STATUS_CONFIG[project.status] ?? { label: project.status, variant: "secondary" as const }

  return (
    <Link href={`/projects/${project.id}`} className="group block h-[220px]">
      <article className="relative flex flex-col h-full rounded-2xl border border-border/60 dark:border-white/[0.08] bg-card dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-white/[0.02] shadow-sm dark:shadow-none backdrop-blur-xl p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] overflow-hidden cursor-pointer">
        
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-indigo-500/0 group-hover:from-violet-500/[0.04] group-hover:to-indigo-500/[0.03] transition-all duration-300 rounded-2xl" />
        
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Row 1: Icon + Name + Action menu */}
        <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-200/60 dark:border-white/[0.08] flex items-center justify-center shrink-0 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-all duration-300">
              <IconRenderer name={project.emoji} className="w-4 h-4 text-violet-300" />
            </div>
            <h3 className="font-semibold text-sm leading-tight truncate text-foreground/90 group-hover:text-foreground transition-colors">
              {project.name}
            </h3>
          </div>
          <div className="shrink-0" onClick={(e) => e.preventDefault()}>
            <ProjectActionMenu
              projectId={project.id}
              projectName={project.name}
              onDelete={onDelete}
            />
          </div>
        </div>

        {/* Row 2: Description */}
        <p className="relative z-10 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed group-hover:text-muted-foreground transition-colors flex-1">
          {project.description || t("no_description")}
        </p>

        {/* Row 3: Deployed URL (if exists) */}
        {project.deployment?.url && (
          <div className="relative z-10 flex items-center gap-1.5 mt-2">
            <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-400/80 truncate font-mono">
              {project.deployment.url.replace(/^https?:\/\//, '')}
            </span>
          </div>
        )}

        {/* Row 4: Status + Time */}
        <div className="relative z-10 flex items-center justify-between mt-auto pt-3 border-t border-border/40 dark:border-white/[0.05]">
          <Badge
            variant={statusConfig.variant}
            className={`text-[10px] px-2 py-0.5 ${statusConfig.pulse ? "animate-pulse" : ""}`}
          >
            {statusConfig.label}
          </Badge>
          <time className="text-[10px] text-muted-foreground/60" dateTime={project.updatedAt}>
            {formatRelativeTime(project.updatedAt, t)}
          </time>
        </div>
      </article>
    </Link>
  )
}
