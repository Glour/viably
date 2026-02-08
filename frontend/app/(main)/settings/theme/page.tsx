import type { Metadata } from "next"

import { FadeInUp } from "@/components/motion/fade-in-up"
import { ThemeSelector } from "@/components/settings/theme-selector"

export const metadata: Metadata = {
  title: "Оформление",
}

export default function ThemeSettingsPage() {
  return (
    <div className="space-y-6">
      <FadeInUp delay={0}>
        <ThemeSelector />
      </FadeInUp>
    </div>
  )
}
