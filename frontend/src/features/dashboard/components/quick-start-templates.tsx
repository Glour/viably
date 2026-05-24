"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, Layers } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/shared/ui/button"
import { Shimmer } from "@/shared/ui/shimmer"
import { useTemplates } from "@/entities/template"
import { useCreateProject } from "@/entities/project"
import type { ApiTemplate } from "@/entities/template"

const CATEGORY_LABEL: Record<string, string> = {
  telegram_bot: "Telegram",
  discord_bot: "Discord",
  web_app: "Web App",
  website: "Website",
  webapp: "Web App",
  api: "API",
  automation: "Авто",
}

const CATEGORY_COLOR: Record<string, string> = {
  telegram_bot: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  discord_bot: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  web_app: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  website: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  api: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  automation: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-500",
  "from-purple-500 to-violet-500",
]

function TemplateQuickCard({ template }: { template: ApiTemplate }) {
  const router = useRouter()
  const createProject = useCreateProject()
  const [isCreating, setIsCreating] = useState(false)

  const categoryLabel = CATEGORY_LABEL[template.category] ?? "Custom"
  const categoryColor = CATEGORY_COLOR[template.category] ?? "bg-muted/60 text-muted-foreground"
  const initial = (template.name?.[0] ?? "T").toUpperCase()
  const gradient = AVATAR_GRADIENTS[template.name.charCodeAt(0) % AVATAR_GRADIENTS.length]

  async function handleUse(e: React.MouseEvent) {
    e.preventDefault()
    if (isCreating || createProject.isPending) return
    setIsCreating(true)
    createProject.mutate(
      { name: template.name, templateId: template.id, config: {} },
      {
        onSuccess: (project) => { router.push(`/projects/${project.id}/ai`) },
        onError: (error) => { toast.error(error.message ?? "Не удалось создать проект"); setIsCreating(false) },
      }
    )
  }

  return (
    <div className="group flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-violet-300/50 dark:hover:border-violet-500/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          {/* Gradient avatar */}
          <div className={`size-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
            <span className="text-sm font-bold text-white">{initial}</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {template.name}
            </h4>
            <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 ${categoryColor}`}>
              {categoryLabel}
            </span>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground/60 shrink-0 mt-0.5">{template.creditCost} кр.</span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2 mb-3 flex-1">
        {template.description}
      </p>

      {/* CTA */}
      <Button
        size="sm"
        className="w-full h-8 text-xs font-medium bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_8px_var(--primary-glow)] transition-all duration-200 hover:bg-[position:100%_100%] hover:shadow-[0_0_14px_var(--primary-glow)] hover:-translate-y-0.5 text-white border-0"
        onClick={handleUse}
        disabled={isCreating || createProject.isPending}
      >
        {isCreating || createProject.isPending ? (
          <><Loader2 className="mr-1.5 size-3 animate-spin" />Создаём...</>
        ) : (
          <>Использовать<ArrowRight className="ml-1.5 size-3" /></>
        )}
      </Button>
    </div>
  )
}

export function QuickStartTemplates() {
  const { data: templates, isLoading } = useTemplates()

  // Top 4 by usageCount
  const top4 = templates
    ? [...templates].sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0)).slice(0, 4)
    : []

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="size-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight">Быстрый старт</h2>
        </div>
        <Link
          href="/templates"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
        >
          <span>Все шаблоны</span>
          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Shimmer key={i} className="rounded-2xl" height="9.5rem" />
          ))}
        </div>
      ) : top4.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {top4.map((template) => (
            <TemplateQuickCard key={template.id} template={template} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
