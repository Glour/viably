import type { Metadata } from "next"
import { AuthProtection } from "./auth-protection"

export const metadata: Metadata = {
  title: "Дашборд",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProtection>{children}</AuthProtection>
}
