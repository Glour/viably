import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AuthProtection } from "./auth-protection"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav')
  return {
    title: t('projects'),
  }
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <AuthProtection>{children}</AuthProtection>
}