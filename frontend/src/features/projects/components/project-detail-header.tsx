"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowLeft, ExternalLink, RefreshCw, Download, Settings, Edit, Sparkles } from "lucide-react"
import { IconRenderer } from "@/shared/components/icon-renderer"
import { toast } from "sonner"
import { downloadProjectZip } from "@/features/generation/api"
import { Button } from "@/shared/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { StatusBadge } from "@/features/projects/components/project-list-row"
import type { Project } from "@/shared/types"

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
  const t = useTranslations("projects")
  const isDeployed = project.status === "deployed"
  const canRedeploy = project.status === "deployed" || project.status === "stopped"
  const telegramUrl = project.deployment?.botUsername 
    ? `https://t.me/${project.deployment.botUsername}`
    : null

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Назад к проектам
      </Link>

      {/* Project info card */}
      <div className="relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 backdrop-blur-xl group transition-all duration-500 hover:shadow-[0_0_40px_var(--primary-glow)] hover:border-primary/30">
        {/* Decorative orbs */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-48 h-48 -translate-y-1/4 translate-x-1/4 bg-[var(--primary-glow)] blur-[80px] rounded-full opacity-20 pointer-events-none animate-glow-pulse"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-40 h-40 translate-y-1/4 -translate-x-1/4 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[60px] rounded-full opacity-20 pointer-events-none"
        />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Row 1: Emoji + Name + Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
              aria-hidden="true"
            >
              <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center">
                <IconRenderer name={project.emoji} className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-2xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent mb-1.5">
                {project.name}
              </h2>
              <StatusBadge status={project.status} />
            </div>
          </div>

          {/* Row 2: Category + Created date */}
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="font-medium">{project.category}</span>
            <span aria-hidden="true">&middot;</span>
            <span>Создан {dateFormatter.format(new Date(project.createdAt))}</span>
          </div>

          {/* Row 3: Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    className="h-10 px-4 text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_32px_rgba(139,92,246,0.7)] hover:scale-105 text-white"
                  >
                    <Link href={`/projects/${project.id}/ai`}>
                      <Sparkles className="size-4" />
                      AI Editor
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Открыть AI редактор с диалогами</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 px-4 text-sm font-semibold border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/50 transition-all duration-300"
                  >
                    <Link href={`/projects/${project.id}/generate`}>
                      <Edit className="size-4" />
                      Генерация
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Legacy генератор кода</TooltipContent>
              </Tooltip>

              {/* Telegram Bot Link - показываем только если deployed и есть botUsername */}
              {isDeployed && telegramUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 px-4 text-sm font-semibold border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/50 transition-all duration-300"
                    >
                      <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                        Открыть в Telegram
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Открыть бота в Telegram</TooltipContent>
                </Tooltip>
              )}

              {/* Redeploy button - показываем только если НЕ deployed */}
              {!isDeployed && canRedeploy && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 px-4 text-sm font-semibold border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/50 transition-all duration-300"
                      onClick={() => toast.info("Функция редеплоя скоро будет доступна")}
                    >
                      <RefreshCw className="size-4" />
                      Редеплоить
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Пересобрать и развернуть проект</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={async () => { toast.info("Скачивание начато..."); try { await downloadProjectZip(project.id) } catch { toast.error("Не удалось скачать ZIP") } }}
                    className="h-10 px-4 text-sm font-semibold border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 hover:border-primary/50 transition-all duration-300"
                  >
                    <Download className="size-4" />
                    Скачать ZIP
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Скачать исходный код проекта</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    disabled
                    className="size-10 border-border/60 bg-card/40 backdrop-blur-sm disabled:opacity-50"
                  >
                    <Settings className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("settings_soon")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  )
}
