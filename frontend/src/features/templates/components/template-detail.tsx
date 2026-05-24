"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Check, Gem } from "lucide-react"
import { toast } from "sonner"
import type { ApiTemplateDetail } from "@/entities/template"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { useCreateProject } from "@/entities/project"
import { IconRenderer } from "@/shared/components/icon-renderer"

const CATEGORY_ICON: Record<string, string> = {
  telegram_bot: "bot",
  discord_bot: "bot",
  website: "globe",
  web_app: "globe",
  webapp: "smartphone",
  api: "zap",
  automation: "wrench",
}

interface TemplateDetailProps {
  template: ApiTemplateDetail
  userCredits: number
}

export function TemplateDetail({ template, userCredits }: TemplateDetailProps) {
  const router = useRouter()
  const createProject = useCreateProject()
  const canCreate = userCredits >= template.creditCost

  async function handleCreate() {
    if (!canCreate || createProject.isPending) return

    console.log("[TemplateDetail] Creating project:", {
      name: template.name,
      templateId: template.id,
      config: template.exampleConfig,
      userCredits,
      templateCost: template.creditCost,
    })

    createProject.mutate(
      {
        name: template.name,
        templateId: template.id,
        config: template.exampleConfig ?? {},
      },
      {
        onSuccess: (project) => {
          console.log("[TemplateDetail] Project created successfully:", project)
          router.push(`/projects/${project.id}/ai`)
        },
        onError: (error) => {
          console.error("[TemplateDetail] Failed to create project:", error)
          toast.error(error.message ?? "Не удалось создать проект")
        },
      }
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left column */}
      <div className="relative lg:w-2/5 flex flex-col gap-6 rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8 overflow-hidden group">
        {/* Hover glow orbs */}
        <div className="absolute inset-0 bg-[image:var(--gradient-cool)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--primary-glow)] blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

        <div className="relative z-10 animate-float">
          {template.previewImageUrl ? (
            <Image
              src={template.previewImageUrl}
              alt={template.name}
              width={96}
              height={96}
              className="rounded-2xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <IconRenderer name={CATEGORY_ICON[template.category] || "bot"} className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        <h1 className="relative z-10 font-heading text-4xl font-bold bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
          {template.name}
        </h1>

        <div className="relative z-10 h-px w-full bg-[image:var(--gradient-main)]" />

        <p className="relative z-10 text-base text-muted-foreground leading-relaxed">
          {template.description}
        </p>

        <Badge variant="secondary" className="relative z-10 w-fit text-base px-4 py-2 bg-primary-subtle border border-primary/20 text-primary font-semibold flex items-center gap-2">
          <Gem className="w-4 h-4" /> {template.creditCost} кредитов
        </Badge>

        <div className="relative z-10 flex flex-col gap-3 mt-2">
          <Button
            onClick={handleCreate}
            loading={createProject.isPending}
            disabled={!canCreate}
            size="lg"
            className="w-full h-12 text-base font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_32px_var(--primary-glow)] hover:scale-[1.02]"
            title={!canCreate ? "Недостаточно кредитов" : undefined}
          >
            Создать проект {"\u2192"}
          </Button>

          {!canCreate && (
            <p className="text-sm text-muted-foreground text-center">
              Недостаточно кредитов.{" "}
              <Link
                href="/settings"
                className="text-primary font-semibold hover:underline"
              >
                Пополнить {"\u2192"}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="lg:w-3/5 flex flex-col gap-8">
        <section className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8 overflow-hidden group">
          {/* Hover glow */}
          <div className="absolute inset-0 bg-[image:var(--gradient-warm)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-500/10 to-emerald-500/10 blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

          <h2 className="relative z-10 font-heading text-2xl font-bold mb-6 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
            Что умеет этот бот:
          </h2>
          <ul className="relative z-10 flex flex-col gap-3">
            {template.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 group/item">
                <Check className="size-5 shrink-0 text-success transition-transform duration-300 group-hover/item:scale-110" />
                <span className="text-base group-hover/item:text-foreground transition-colors duration-300">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {template.tags.length > 0 && (
          <section className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl p-8 overflow-hidden group">
            {/* Hover glow */}
            <div className="absolute inset-0 bg-[image:var(--gradient-cool)] opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary-glow)] blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

            <h2 className="relative z-10 font-heading text-2xl font-bold mb-6 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              Теги:
            </h2>
            <div className="relative z-10 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-primary-subtle border border-primary/20 text-primary font-semibold hover:scale-105 transition-transform duration-300"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
