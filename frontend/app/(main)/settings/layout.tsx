import { MainLayout } from "@/components/layout/main-layout"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Настройки</h1>
          <p className="mt-1 text-muted-foreground">
            Управляйте профилем, кредитами и предпочтениями
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <SettingsSidebar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </MainLayout>
  )
}
