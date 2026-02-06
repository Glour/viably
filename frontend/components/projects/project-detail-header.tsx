"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink, RefreshCw, Download, Settings } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StatusBadge } from "@/components/projects/project-list-row"
import type { Project } from "@/types"

/* ------------------------------------------------------------------ */
/*  Date formatter                                                      */
/* ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("ru", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

/* ------------------------------------------------------------------ */
/*  ProjectDetailHeader                                                 */
/* ------------------------------------------------------------------ */

interface ProjectDetailHeaderProps {
  project: Project
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  const isDeployed = project.status === "deployed"
  const canRedeploy = project.status === "deployed" || project.status === "stopped"

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Назад к проектам
      </Link>

      {/* Project info card */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        {/* Row 1: Emoji + Name + Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-4xl" aria-hidden="true">
            {project.emoji}
          </span>
          <h2 className="font-heading text-2xl font-bold">{project.name}</h2>
          <StatusBadge status={project.status} />
        </div>

        {/* Row 2: Category + Created date */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{project.category}</span>
          <span aria-hidden="true">&middot;</span>
          <span>Создан {dateFormatter.format(new Date(project.createdAt))}</span>
        </div>

        {/* Row 3: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" disabled={!isDeployed}>
                  <ExternalLink className="size-4" />
                  Открыть в Telegram
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDeployed
                  ? "Открыть бота в Telegram"
                  : "Доступно только для запущенных проектов"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" disabled={!canRedeploy}>
                  <RefreshCw className="size-4" />
                  Редеплоить
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {canRedeploy
                  ? "Пересобрать и развернуть проект"
                  : "Недоступно для текущего статуса"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => toast.success("Скачивание начато...")}
                >
                  <Download className="size-4" />
                  Скачать ZIP
                </Button>
              </TooltipTrigger>
              <TooltipContent>Скачать исходный код проекта</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" disabled>
                  <Settings className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Настройки (скоро)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}
