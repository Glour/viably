import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Шаблон",
}

export default function TemplateDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
