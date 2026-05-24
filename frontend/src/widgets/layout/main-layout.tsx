import { AppHeader } from "@/widgets/layout/navbar"
import { SidebarLayout } from "./sidebar-layout"

interface MainLayoutProps {
  children: React.ReactNode
  fullscreen?: boolean
  variant?: "app" | "page"
}

export function MainLayout({
  children,
  fullscreen = false,
  variant = "app",
}: MainLayoutProps) {
  if (variant === "page") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        {fullscreen ? (
          <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
        ) : (
          <main className="mx-auto max-w-[1280px] px-6 py-8 w-full">{children}</main>
        )}
      </div>
    )
  }

  // 'app' variant — sidebar layout
  if (fullscreen) {
    return (
      <SidebarLayout>
        <div className="flex-1 flex flex-col h-full overflow-hidden">{children}</div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="px-4 pt-14 pb-8 md:px-6 md:pt-8">{children}</div>
    </SidebarLayout>
  )
}
