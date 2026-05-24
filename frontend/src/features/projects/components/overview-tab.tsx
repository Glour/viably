"use client"

import { ExternalLink, Rocket } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Project } from "@/shared/types"

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
  const t = useTranslations("projects")
  return (
    <div className="space-y-8 pt-6">
      {/* Configuration */}
      <section>
        <h3 className="font-heading text-2xl font-semibold mb-6 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
          Конфигурация
        </h3>
        {Object.keys(project.config).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(project.config).map(([key, value]) => (
              <div
                key={key}
                className="relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 backdrop-blur-xl group transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_var(--primary-glow)] hover:border-primary/40"
              >
                {/* Subtle glow on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary-glow)] blur-[40px] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                <div className="relative z-10">
                  <dt className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {key}
                  </dt>
                  <dd className="mt-2 font-medium text-lg">{String(value)}</dd>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative rounded-2xl p-8 overflow-hidden bg-gradient-to-br from-primary/5 via-primary-subtle to-transparent border border-border/50 backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] blur-[60px] opacity-20 rounded-full" />
            <p className="relative z-10 text-base text-muted-foreground">
              Нет параметров конфигурации
            </p>
          </div>
        )}
      </section>

      {/* Deployment Info */}
      <section>
        <h3 className="font-heading text-2xl font-semibold mb-6 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
          {t("deployment")}
        </h3>
        {project.deployment ? (
          <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-card/80 via-card/60 to-card/40 border border-border/50 backdrop-blur-xl group transition-all duration-500 hover:shadow-[0_0_32px_var(--primary-glow)] hover:border-primary/30">
            {/* Decorative orbs */}
            <div
              aria-hidden="true"
              className="absolute top-0 right-0 w-48 h-48 -translate-y-1/4 translate-x-1/4 bg-[var(--primary-glow)] blur-[70px] rounded-full opacity-15 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-40 h-40 translate-y-1/4 -translate-x-1/4 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[50px] rounded-full opacity-15 pointer-events-none"
            />

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* URL */}
              <div className="space-y-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  URL
                </dt>
                <dd>
                  <a
                    href={project.deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-hover transition-colors group/link"
                  >
                    <span className="group-hover/link:underline">
                      {project.deployment.url}
                    </span>
                    <ExternalLink className="size-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                  </a>
                </dd>
              </div>

              {/* Bot Username */}
              <div className="space-y-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Бот
                </dt>
                <dd className="font-medium text-lg">
                  @{project.deployment.botUsername}
                </dd>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Статус
                </dt>
                <dd>
                  <DeploymentStatusBadge status={project.deployment.status} />
                </dd>
              </div>

              {/* Running Since */}
              <div className="space-y-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Запущен с
                </dt>
                <dd className="font-medium text-lg">
                  {project.deployment.runningSince
                    ? dateTimeFormatter.format(
                        new Date(project.deployment.runningSince)
                      )
                    : "---"}
                </dd>
              </div>

              {/* Cost Estimate */}
              <div className="space-y-2 sm:col-span-2">
                <dt className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Стоимость
                </dt>
                <dd className="font-medium text-lg">
                  {project.deployment.costEstimate}
                </dd>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-3xl p-12 overflow-hidden bg-gradient-to-br from-primary/5 via-primary-subtle to-transparent border border-border/50 backdrop-blur-xl">
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-glow)] blur-[70px] opacity-20 rounded-full" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[50px] opacity-20 rounded-full" />

            <div className="relative z-10 text-center">
              <div className="mb-4 animate-float">
                {/* Beautiful gradient background for Rocket icon */}
                <div className="relative inline-flex items-center justify-center w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-full shadow-2xl"></div>
                  <Rocket className="relative z-10 w-10 h-10 text-white" />
                </div>
              </div>
              <p className="text-base text-muted-foreground font-medium">
                Проект ещё не развёрнут
              </p>
            </div>
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
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  },
  stopped: {
    label: "Остановлен",
    className:
      "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20",
  },
  deploying: {
    label: "Деплоится...",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse border border-blue-500/20 shadow-[0_0_12px_rgba(37,99,235,0.15)]",
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
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${config.className} transition-all duration-300`}
    >
      {config.label}
    </span>
  )
}