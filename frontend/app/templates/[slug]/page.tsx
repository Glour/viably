"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { FadeInUp } from "@/components/motion/fade-in-up"
import { Shimmer } from "@/components/ui/shimmer"
import { Button } from "@/components/ui/button"
import { TemplateDetail } from "@/components/templates/template-detail"
import { useTemplatesStore } from "@/stores/templates"
import { useDashboardStore } from "@/stores/dashboard"

export default function TemplateDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { templates, isLoading, loadTemplates, getTemplateBySlug } =
    useTemplatesStore()
  const { user, loadDashboard } = useDashboardStore()

  useEffect(() => {
    if (templates.length === 0) loadTemplates()
    if (!user) loadDashboard()
  }, [templates.length, loadTemplates, user, loadDashboard])

  const template = getTemplateBySlug(slug)
  const userCredits = user?.credits ?? 0

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Back navigation */}
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Назад к шаблонам
        </Link>

        {isLoading ? (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="lg:w-2/5 flex flex-col gap-4">
              <Shimmer height="4rem" width="4rem" className="rounded-xl" />
              <Shimmer height="2rem" width="60%" />
              <Shimmer height="1px" />
              <Shimmer height="4rem" />
              <Shimmer height="2.5rem" width="8rem" />
              <Shimmer height="2.75rem" />
            </div>
            <div className="lg:w-3/5 flex flex-col gap-4">
              <Shimmer height="1.5rem" width="50%" />
              <Shimmer height="6rem" />
              <Shimmer height="1.5rem" width="50%" />
              <Shimmer height="4rem" />
            </div>
          </div>
        ) : template ? (
          <FadeInUp delay={0}>
            <TemplateDetail
              template={template}
              userCredits={userCredits}
            />
          </FadeInUp>
        ) : (
          <FadeInUp delay={0}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-6xl mb-4" aria-hidden="true">
                🔍
              </span>
              <p className="font-heading text-lg font-semibold">
                Шаблон не найден
              </p>
              <p className="text-muted-foreground mt-1">
                Возможно, он был удалён или ссылка некорректна
              </p>
              <Button variant="secondary" className="mt-4" asChild>
                <Link href="/templates">Назад к шаблонам</Link>
              </Button>
            </div>
          </FadeInUp>
        )}
      </div>
    </MainLayout>
  )
}
