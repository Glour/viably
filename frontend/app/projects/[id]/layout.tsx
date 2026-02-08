import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Проект",
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children
}
