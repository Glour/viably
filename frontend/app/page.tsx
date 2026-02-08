import type { Metadata } from "next"
import { LandingNav } from "@/components/landing/landing-nav"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { TemplatesPreview } from "@/components/landing/templates-preview"
import { Pricing } from "@/components/landing/pricing"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Viably — AI-Powered Bot Builder",
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
      <LandingNav />
      <main className="min-h-screen">
        <Hero />
        <HowItWorks />
        <TemplatesPreview />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
