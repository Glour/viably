"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BookOpen, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Template } from "@/shared/types"
import { Button } from "@/shared/ui/button"
import { IconRenderer } from "@/shared/components/icon-renderer"
import { useCreateProject } from "@/entities/project"

interface TemplateCardProps {
  template: Template
}

function getDocSlugForCategory(category: Template["category"]): string {
  const categoryMap: Partial<Record<Template["category"], string>> = {
    telegram_bot: "telegram",
    discord_bot: "discord",
    web_app: "web",
    website: "web",
    webapp: "web",
    api: "api",
    automation: "automation",
  }
  return categoryMap[category] || "custom"
}

const CATEGORY_LABEL: Partial<Record<string, string>> = {
  telegram_bot: "Telegram",
  discord_bot: "Discord",
  web_app: "Web App",
  website: "Website",
  webapp: "Web App",
  api: "API",
  automation: "Auto",
}

export function TemplateCard({ template }: TemplateCardProps) {
  const t = useTranslations("projects")
  const docSlug = getDocSlugForCategory(template.category)
  const router = useRouter()
  const createProject = useCreateProject()
  const [isCreating, setIsCreating] = useState(false)

  async function handleInstantCreate(e: React.MouseEvent) {
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

  const categoryLabel = CATEGORY_LABEL[template.category] ?? "Custom"

  return (
    <article className="group rounded-xl border border-border/60 dark:border-white/[0.08] bg-card dark:bg-[#1E1E2E] shadow-sm dark:shadow-none hover:border-violet-500/30 hover:shadow-md dark:hover:shadow-black/30 hover:dark:bg-[#1E1E35] transition-all duration-200 cursor-pointer overflow-hidden">
      {/* Preview area */}
      <Link href={`/templates/${template.slug}`} className="block">
        {template.previewImageUrl ? (
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            <Image
              src={template.previewImageUrl}
              alt={template.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-[#1A1A2E] dark:to-[#252540]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(124,58,237,0.12),transparent_65%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/60 dark:bg-white/[0.07] border border-violet-200/60 dark:border-white/[0.08] flex items-center justify-center shadow-lg">
                <IconRenderer name={template.emoji} className="w-7 h-7 text-violet-500 dark:text-white/60" />
              </div>
              <span className="text-violet-400/70 dark:text-white/30 text-xs font-medium tracking-wide uppercase">{template.category || ''}</span>
            </div>
            <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle, #7C3AED 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
          </div>
        )}
      </Link>

      {/* Info area */}
      <div className="p-4 border-t border-border/40 dark:border-white/[0.06]">
        <div className="flex items-start justify-between mb-1 gap-2">
          <Link href={`/templates/${template.slug}`} className="block flex-1 min-w-0">
            <h3 className="font-semibold text-foreground/90 text-sm truncate group-hover:text-foreground transition-colors">
              {template.name}
            </h3>
          </Link>
          <span className="text-muted-foreground/60 text-xs shrink-0">{template.creditCost} кр.</span>
        </div>
        <p className="text-muted-foreground/70 text-xs line-clamp-2 mb-3 leading-relaxed">
          {template.description}
        </p>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="inline-block rounded-md bg-muted/60 dark:bg-white/[0.05] border border-border/50 dark:border-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 dark:text-white/40"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="inline-block rounded-md bg-muted/60 dark:bg-white/[0.05] border border-border/50 dark:border-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-muted-foreground/70 dark:text-white/40">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button
            className="flex-1 h-8 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white border-0"
            onClick={handleInstantCreate}
            disabled={isCreating || createProject.isPending}
          >
            {isCreating || createProject.isPending ? (
              <><Loader2 className="mr-1.5 size-3.5 animate-spin" />Создаём...</>
            ) : (
              <>Использовать<ArrowRight className="ml-1.5 size-3.5" /></>
            )}
          </Button>
          <Link
            href={`/docs/templates/${docSlug}`}
            className="shrink-0 flex items-center justify-center size-8 rounded-lg text-muted-foreground/50 border border-border/50 dark:border-white/[0.08] transition-all duration-200 hover:text-foreground hover:border-border hover:bg-muted/40 dark:hover:bg-white/[0.04]"
            onClick={(e) => e.stopPropagation()}
            title={t("documentation")}
          >
            <BookOpen className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
