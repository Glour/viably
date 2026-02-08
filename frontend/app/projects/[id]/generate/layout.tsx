import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Генерация",
}

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return children
}
