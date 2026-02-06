import Link from "next/link"
import type { Project, ProjectStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { ProjectActionMenu } from "./project-action-menu"

interface ProjectCardProps {
  project: Project
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: "secondary" | "info" | "warning" | "success" | "destructive" | "neutral-dark"; pulse?: boolean }
> = {
  draft: { label: "Черновик", variant: "secondary" },
  generating: { label: "Генерация...", variant: "info", pulse: true },
  generated: { label: "Готов", variant: "warning" },
  deployed: { label: "Запущен", variant: "success" },
  failed: { label: "Ошибка", variant: "destructive" },
  stopped: { label: "Остановлен", variant: "neutral-dark" },
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "только что"
  if (minutes < 60) {
    if (minutes === 1) return "1 минуту назад"
    if (minutes >= 2 && minutes <= 4) return `${minutes} минуты назад`
    return `${minutes} минут назад`
  }
  if (hours < 24) {
    if (hours === 1) return "1 час назад"
    if (hours >= 2 && hours <= 4) return `${hours} часа назад`
    return `${hours} часов назад`
  }
  if (days === 1) return "вчера"
  if (days >= 2 && days <= 4) return `${days} дня назад`
  if (days <= 30) return `${days} дней назад`

  const months = Math.floor(days / 30)
  if (months === 1) return "1 месяц назад"
  if (months >= 2 && months <= 4) return `${months} месяца назад`
  if (months <= 12) return `${months} месяцев назад`

  return new Date(dateString).toLocaleDateString("ru-RU")
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status]

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <article className="relative flex flex-col gap-3 rounded-2xl border bg-card p-6 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:shadow-lg hover:border-primary-subtle">
        {/* Gradient line top */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-[image:var(--gradient-main)] opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

        {/* Header: Emoji + Name */}
        <div className="flex items-center gap-3">
          <span className="text-[2rem] leading-none shrink-0" aria-hidden="true">
            {project.emoji}
          </span>
          <h3 className="font-heading text-base font-semibold truncate">
            {project.name}
          </h3>
        </div>

        {/* Status badge */}
        <Badge
          variant={statusConfig.variant}
          className={statusConfig.pulse ? "animate-pulse" : undefined}
        >
          {statusConfig.label}
        </Badge>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Footer: relative time + action menu */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <time className="text-xs text-muted-foreground" dateTime={project.updatedAt}>
            {formatRelativeTime(project.updatedAt)}
          </time>
          <ProjectActionMenu
            projectId={project.id}
            projectName={project.name}
            onDelete={onDelete}
          />
        </div>
      </article>
    </Link>
  )
}
