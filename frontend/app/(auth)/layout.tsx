import { AuthDecorativePanel } from "@/components/auth/auth-decorative-panel"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      {/* Decorative Panel - hidden on mobile, 45% width on desktop */}
      <div className="hidden md:block w-[45%] shrink-0 min-h-dvh">
        <AuthDecorativePanel />
      </div>

      {/* Form Area - full width on mobile, remaining space on desktop */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <span className="font-heading text-2xl font-bold">
              <span className="text-primary">V</span>iably
            </span>
          </div>

          {/* Page content (login, register, etc.) */}
          {children}
        </div>
      </main>
    </div>
  )
}
