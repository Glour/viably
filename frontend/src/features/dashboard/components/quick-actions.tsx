import Link from "next/link"
import { Plus, Layers } from "lucide-react"

import { Button } from "@/shared/ui/button"

export function QuickActions() {
  return (
    <div className="flex gap-3">
      <Button
        asChild
        className="bg-violet-600 hover:bg-violet-700 text-white gap-2 h-9 px-4 text-sm font-medium rounded-lg"
      >
        <Link href="/projects/new">
          <Plus className="w-4 h-4" />
          Новый проект
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        className="border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground gap-2 h-9 px-4 text-sm font-medium rounded-lg"
      >
        <Link href="/templates">
          <Layers className="w-4 h-4" />
          Из шаблона
        </Link>
      </Button>
    </div>
  )
}
