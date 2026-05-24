import { AppSidebar } from "./app-sidebar"
import { HelpButton } from "@/shared/components/help-button"

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-app)" }}>
      <AppSidebar />
      {/* On mobile: AppSidebar is fixed/overlay, so main takes full width */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
      <HelpButton />
    </div>
  )
}
