import { Navbar } from "@/components/layout/navbar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {children}
      </main>
    </div>
  )
}
