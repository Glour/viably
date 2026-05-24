import type { Metadata } from "next"
import { ArrowRight, Sparkles, BookOpen, Coins } from "lucide-react"
import Link from "next/link"
import { Button } from "@/shared/ui/button"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs")
  return {
    title: t("title"),
    description: t("page_subtitle"),
  }
}

export default async function DocsPage() {
  const t = await getTranslations("docs")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-heading mb-4">
          {t("welcome")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t("page_subtitle")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 not-prose">
        <Link href="/docs/quickstart" className="group">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <Sparkles className="size-5 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              {t("quick_start_title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("quick_start_desc")}
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              {t("start_btn")}
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/docs/templates/guide" className="group">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <BookOpen className="size-5 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              {t("templates_guide_title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("templates_guide_desc")}
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              {t("view_templates_btn")}
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link href="/docs/credits" className="group">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <Coins className="size-5 text-primary mb-3" />
            <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
              {t("credits_title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("credits_desc")}
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              {t("learn_more_btn")}
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-accent/50 rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-3">{t("help_title")}</h2>
        <p className="text-muted-foreground mb-4">
          {t("help_desc")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="mailto:support@viably.dev">
              {t("contact_support")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
