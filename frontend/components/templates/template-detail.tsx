"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"
import type { Template } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createProjectFromTemplate } from "@/lib/api/templates"
import Link from "next/link"

interface TemplateDetailProps {
  template: Template
  userCredits: number
}

export function TemplateDetail({ template, userCredits }: TemplateDetailProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const canCreate = userCredits >= template.creditCost

  async function handleCreate() {
    if (!canCreate || isCreating) return

    setIsCreating(true)
    const res = await createProjectFromTemplate(template.slug)

    if (res.success) {
      router.push(res.redirectUrl)
    } else {
      toast.error(res.error)
      setIsCreating(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left column — 40% */}
      <div className="lg:w-2/5 flex flex-col gap-5">
        <span className="text-7xl leading-none" aria-hidden="true">
          {template.emoji}
        </span>

        <h1 className="font-heading text-3xl font-bold">{template.name}</h1>

        <div className="h-px w-full bg-[image:var(--gradient-main)]" />

        <p className="text-muted-foreground">{template.description}</p>

        <Badge variant="secondary" className="w-fit text-base px-3 py-1">
          💎 {template.creditCost} credits
        </Badge>

        <div className="flex flex-col gap-2 mt-2">
          <Button
            onClick={handleCreate}
            loading={isCreating}
            disabled={!canCreate}
            className="w-full"
            title={!canCreate ? "Недостаточно кредитов" : undefined}
          >
            Создать проект →
          </Button>

          {!canCreate && (
            <p className="text-sm text-muted-foreground text-center">
              Недостаточно кредитов.{" "}
              <Link
                href="/settings"
                className="text-primary hover:underline"
              >
                Пополнить →
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right column — 60% */}
      <div className="lg:w-3/5 flex flex-col gap-8">
        {/* Features */}
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

        {/* Config fields */}
        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Что нужно настроить:
          </h2>
          <ul className="flex flex-col gap-2">
            {template.configFields.map((field) => (
              <li key={field.name} className="flex items-start gap-2.5">
                <span className="text-muted-foreground">•</span>
                <span>
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
