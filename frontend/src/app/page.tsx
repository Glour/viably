import type { Metadata } from "next"
import { AppHeader } from "@/widgets/layout"
import { Hero } from "@/shared/components/landing/hero"
import { HowItWorks } from "@/shared/components/landing/how-it-works"
import { TemplatesPreview } from "@/shared/components/landing/templates-preview"
import { Pricing } from "@/shared/components/landing/pricing"
import { Footer } from "@/shared/components/landing/footer"

export const metadata: Metadata = {
  title: "Viably — AI-конструктор ботов",
  description: "Viably превращает твои идеи в работающие Telegram-боты. Без кода. Без знаний. За 60 секунд.",
  openGraph: {
    title: "Viably — AI-Powered Telegram Bot Builder",
    description: "Создавай Telegram-ботов за 60 секунд. Без кода. Без знаний. Просто опиши идею.",
    url: "https://viably.dev",
    siteName: "Viably",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viably — AI-Powered Telegram Bot Builder",
    description: "Создавай Telegram-ботов за 60 секунд.",
  },
}

export default function LandingPage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen">
        <Hero />
        <div className="mx-auto max-w-5xl px-6"><div className="h-px bg-border/50" /></div>
        <HowItWorks />
        <div className="mx-auto max-w-5xl px-6"><div className="h-px bg-border/50" /></div>
        <TemplatesPreview />
        <div className="mx-auto max-w-5xl px-6"><div className="h-px bg-border/50" /></div>
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
