import Link from "next/link"
import { FolderOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProjectEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FolderOpen className="size-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-heading text-lg font-semibold">
        Пока нет проектов
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Создайте первый проект из шаблона
      </p>
      <Button asChild className="mt-4">
        <Link href="/projects/new">
          <Plus className="size-4" />
          Новый проект
        </Link>
      </Button>
    </div>
  )
}
