"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"
import type { ApiTemplateDetail } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCreateProject } from "@/lib/hooks/use-projects"
import Link from "next/link"

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

    createProject.mutate(
      {
        name: template.name,
        templateId: template.id,
        config: template.exampleConfig ?? {},
      },
      {
        onSuccess: (project) => {
          router.push(`/projects/${project.id}/generate`)
        },
        onError: (error) => {
          toast.error(error.message ?? "Не удалось создать проект")
        },
      }
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left column */}
      <div className="lg:w-2/5 flex flex-col gap-5">
        <span className="text-7xl leading-none" aria-hidden="true">
          {"\u{1F916}"}
        </span>

        <h1 className="font-heading text-3xl font-bold">{template.name}</h1>

        <div className="h-px w-full bg-[image:var(--gradient-main)]" />

        <p className="text-muted-foreground">{template.description}</p>

        <Badge variant="secondary" className="w-fit text-base px-3 py-1">
          {"\u{1F48E}"} {template.creditCost} credits
        </Badge>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={handleCreate}
            loading={createProject.isPending}
            disabled={!canCreate}
            className="w-full"
            title={!canCreate ? "Недостаточно кредитов" : undefined}
          >
            Создать проект {"\u2192"}
          </Button>

          {!canCreate && (
            <p className="text-sm text-muted-foreground text-center">
              Недостаточно кредитов.{" "}
              <Link
                href="/settings"
                className="text-primary hover:underline"
              >
                Пополнить {"\u2192"}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="lg:w-3/5 flex flex-col gap-8">
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Что умеет этот бот:
          </h2>
          <ul className="flex flex-col gap-2.5">
            {template.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <Check className="size-5 shrink-0 text-success" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        {template.tags.length > 0 && (
          <section>
            <h2 className="font-heading text-xl font-semibold mb-4">
              Теги:
            </h2>
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
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
