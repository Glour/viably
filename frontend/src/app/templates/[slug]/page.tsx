"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MainLayout } from "@/widgets/layout"
import { FadeInUp } from "@/shared/components/motion/fade-in-up"
import { Shimmer } from "@/shared/ui/shimmer"
import { Button } from "@/shared/ui/button"
import { TemplateDetail } from "@/features/templates/components/template-detail"
import { useTemplate } from "@/shared/hooks/use-templates"
import { useCreditBalance } from "@/shared/hooks/use-credits"

export default function TemplateDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: template, isLoading } = useTemplate(slug)
  const { data: creditBalance } = useCreditBalance()
  const userCredits = creditBalance?.credits ?? 0

  return (
    <MainLayout>
      <div className="space-y-8">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-card/40 backdrop-blur-sm border border-border/40 rounded-xl hover:text-foreground hover:bg-card hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] w-fit"
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
            <TemplateDetail template={template} userCredits={userCredits} />
          </FadeInUp>
        ) : (
          <FadeInUp delay={0}>
            <div className="relative rounded-3xl p-12 md:p-16 overflow-hidden bg-gradient-to-br from-primary/5 via-primary-subtle to-transparent border border-border/50 backdrop-blur-xl">
              {/* Decorative orbs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary-glow)] blur-[80px] opacity-20 rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 blur-[60px] opacity-20 rounded-full" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="mb-6 animate-float">
                  <span className="text-8xl drop-shadow-lg" aria-hidden="true">
                    {"\u{1F50D}"}
                  </span>
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold mb-2 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
                  Шаблон не найден
                </h3>
                <p className="text-muted-foreground text-base md:text-lg mb-6 max-w-md">
                  Возможно, он был удалён или ссылка некорректна
                </p>
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300 hover:bg-[position:100%_100%] hover:shadow-[0_0_32px_var(--primary-glow)] hover:scale-105"
                >
                  <Link href="/templates">Назад к шаблонам</Link>
                </Button>
              </div>
            </div>
          </FadeInUp>
        )}
      </div>
    </MainLayout>
  )
}
