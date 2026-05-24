"use client"

import Link from "next/link"
import { FolderOpen, ArrowRight, Clock, Rocket } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Shimmer } from "@/shared/ui/shimmer"
import { formatRelativeTime } from "@/shared/lib/utils/format-relative-time"
import { useRecentProjects } from "@/entities/project"
import { useAuthStore } from "@/features/auth/stores"
import type { ProjectStatus } from "@/shared/types"

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; dot: string; text: string }
> = {
  draft:      { label: "Черновик",     dot: "bg-zinc-400",   text: "text-zinc-500" },
  generating: { label: "Генерация",    dot: "bg-amber-400 animate-pulse", text: "text-amber-600" },
  generated:  { label: "Сгенерирован", dot: "bg-violet-400", text: "text-violet-600" },
  deployed:   { label: "Запущен",      dot: "bg-emerald-400",text: "text-emerald-600" },
  failed:     { label: "Ошибка",       dot: "bg-red-400",    text: "text-red-600" },
  stopped:    { label: "Остановлен",   dot: "bg-zinc-400",   text: "text-zinc-500" },
}

const INITIAL_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-violet-500",
]

export function RecentProjects() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: projects, isLoading } = useRecentProjects(isAuthenticated, 3)

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight">Недавние</h2>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <span>Все проекты</span>
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Shimmer className="rounded-2xl" height="5.5rem" />
          <Shimmer className="rounded-2xl" height="5.5rem" />
          <Shimmer className="rounded-2xl" height="5.5rem" />
        </div>
      ) : projects && projects.length > 0 ? (
        /* Projects — compact horizontal grid */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {projects.map((project) => {
            const s = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.draft
            const initial = (project.name?.[0] ?? "P").toUpperCase()
            const gradient = INITIAL_GRADIENTS[project.name.charCodeAt(0) % INITIAL_GRADIENTS.length]
            const time = project.updatedAt
              ? formatRelativeTime(project.updatedAt)
              : formatRelativeTime(project.createdAt)

            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-violet-300/50 dark:hover:border-violet-500/30">
                  {/* Avatar */}
                  <div className={`size-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-sm font-bold text-white">{initial}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Status dot */}
                      <div className="flex items-center gap-1">
                        <span className={`size-1.5 rounded-full ${s.dot}`} />
                        <span className={`text-[11px] font-medium ${s.text}`}>{s.label}</span>
                      </div>
                      <span className="text-muted-foreground/30">·</span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                        <Clock className="size-3" />
                        {time}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8 text-center">
          <span className="text-4xl mb-3 block">📦</span>
          <h3 className="font-heading text-base font-bold mb-1.5">Проектов пока нет</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
            Создайте первый бот за 60 секунд — выберите шаблон ниже.
          </p>
          <Button
            asChild
            size="sm"
            className="h-9 px-5 text-sm font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_10px_var(--primary-glow)] transition-all duration-200 hover:bg-[position:100%_100%] hover:shadow-[0_0_18px_var(--primary-glow)] hover:-translate-y-0.5"
          >
            <Link href="/templates">
              <Rocket className="size-3.5 mr-1.5" />
              Создать первый проект
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
