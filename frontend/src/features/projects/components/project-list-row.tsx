import Link from "next/link"
import { IconRenderer } from "@/shared/components/icon-renderer"

import { Badge } from "@/shared/ui/badge"
import { ProjectActionMenu } from "@/features/projects/components/project-action-menu"
import { formatRelativeTime } from "@/shared/lib/utils/format-relative-time"
import type { Project, ProjectStatus } from "@/shared/types"

/* ------------------------------------------------------------------ */
/*  Shared status configuration                                        */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string
    variant: "secondary" | "info" | "warning" | "success" | "destructive" | "neutral-dark"
    className?: string
  }
> = {
  draft: { label: "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a", variant: "secondary" },
  generating: { label: "\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f...", variant: "info", className: "animate-pulse" },
  generated: { label: "\u0413\u043e\u0442\u043e\u0432", variant: "warning" },
  deployed: { label: "\u0417\u0430\u043f\u0443\u0449\u0435\u043d", variant: "success" },
  failed: { label: "\u041e\u0448\u0438\u0431\u043a\u0430", variant: "destructive" },
  stopped: { label: "\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d", variant: "neutral-dark" },
}

/* ------------------------------------------------------------------ */
/*  StatusBadge                                                        */
/* ------------------------------------------------------------------ */

interface StatusBadgeProps {
  status: ProjectStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/*  ProjectListRow                                                     */
/* ------------------------------------------------------------------ */

interface ProjectListRowProps {
  project: Project
  onDelete: (id: string) => void
}

export function ProjectListRow({ project, onDelete }: ProjectListRowProps) {
  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors bg-[#1E1E2E] border border-white/[0.06] hover:bg-[#1E1E35] hover:border-violet-500/30">
        {/* Emoji + Name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <IconRenderer name={project.emoji} className="w-6 h-6 text-violet-400" />
          <span className="font-medium truncate text-white/90">{project.name}</span>
        </div>

        {/* Category */}
        <span className="hidden md:block text-sm text-white/40 w-32 shrink-0">
          {project.category}
        </span>

        {/* Status Badge */}
        <div className="w-20 sm:w-28 shrink-0">
          <StatusBadge status={project.status} />
        </div>

        {/* Updated time */}
        <span className="hidden sm:block text-xs text-white/40 w-28 shrink-0 text-right">
          {formatRelativeTime(project.updatedAt)}
        </span>

        {/* Action menu */}
        <div className="shrink-0" onClick={(e) => e.preventDefault()}>
          <ProjectActionMenu
            projectId={project.id}
            projectName={project.name}
            onDelete={onDelete}
          />
        </div>
      </div>
    </Link>
  )
}
