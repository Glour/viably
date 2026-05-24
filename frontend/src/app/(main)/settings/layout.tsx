import { MainLayout } from "@/widgets/layout"
import { SettingsSidebar } from "@/features/settings/components/settings-sidebar"
import { AuthProtection } from "./auth-protection"
import { getTranslations } from "next-intl/server"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("settings")
  
  return (
    <AuthProtection>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 max-w-4xl">
            <SettingsSidebar />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </MainLayout>
    </AuthProtection>
  )
}
