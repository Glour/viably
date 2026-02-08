import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Шаблоны ботов",
}

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children
}
