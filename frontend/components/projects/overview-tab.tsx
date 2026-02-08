"use client"

import { ExternalLink } from "lucide-react"
import type { Project } from "@/types"

/* ------------------------------------------------------------------ */
/*  Date formatter                                                      */
/* ------------------------------------------------------------------ */

const dateTimeFormatter = new Intl.DateTimeFormat("ru", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

/* ------------------------------------------------------------------ */
/*  OverviewTab                                                         */
/* ------------------------------------------------------------------ */

interface OverviewTabProps {
  project: Project
}

export function OverviewTab({ project }: OverviewTabProps) {
  return (
    <div className="space-y-8 pt-6">
      {/* Configuration */}
      <section>
        <h3 className="font-heading text-lg font-semibold mb-4">
          Конфигурация
        </h3>
        {Object.keys(project.config).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(project.config).map(([key, value]) => (
              <div key={key} className="rounded-xl border bg-card p-4">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  {key}
                </dt>
                <dd className="mt-1 font-medium">{String(value)}</dd>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Нет параметров конфигурации
          </p>
        )}
      </section>

      {/* Deployment Info */}
      <section>
        <h3 className="font-heading text-lg font-semibold mb-4">
          Деплоймент
        </h3>
        {project.deployment ? (
          <div className="rounded-2xl border bg-card p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* URL */}
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  URL
                </dt>
                <dd className="mt-1">
                  <a
                    href={project.deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    {project.deployment.url}
                    <ExternalLink className="size-3.5" />
                  </a>
                </dd>
              </div>

              {/* Bot Username */}
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Бот
                </dt>
                <dd className="mt-1 font-medium">
                  @{project.deployment.botUsername}
                </dd>
              </div>

              {/* Status */}
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Статус
                </dt>
                <dd className="mt-1">
                  <DeploymentStatusBadge status={project.deployment.status} />
                </dd>
              </div>

              {/* Running Since */}
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Запущен с
                </dt>
                <dd className="mt-1 font-medium">
                  {project.deployment.runningSince
                    ? dateTimeFormatter.format(
                        new Date(project.deployment.runningSince)
                      )
                    : "---"}
                </dd>
              </div>

              {/* Cost Estimate */}
              <div>
                <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                  Стоимость
                </dt>
                <dd className="mt-1 font-medium">
                  {project.deployment.costEstimate}
                </dd>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Проект ещё не развёрнут
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DeploymentStatusBadge (local helper)                                */
/* ------------------------------------------------------------------ */

const DEPLOYMENT_STATUS_MAP: Record<
  "running" | "stopped" | "deploying",
  { label: string; className: string }
> = {
  running: {
    label: "Работает",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  stopped: {
    label: "Остановлен",
    className: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
  },
  deploying: {
    label: "Деплоится...",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse",
  },
}

function DeploymentStatusBadge({
  status,
}: {
  status: "running" | "stopped" | "deploying"
}) {
  const config = DEPLOYMENT_STATUS_MAP[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
