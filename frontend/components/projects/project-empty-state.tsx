import Link from "next/link"
import { FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProjectEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-6">
        <FolderOpen className="size-10 text-muted-foreground" />
      </div>
      <h3 className="font-heading text-xl font-semibold">
        У тебя пока нет проектов
      </h3>
      <p className="mt-2 text-muted-foreground">
        Создай первый бот за 60 секунд!
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild className="bg-[image:var(--gradient-main)] text-white border-0 hover:opacity-90">
          <Link href="/templates">Выбрать шаблон →</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/projects/new">Создать с нуля →</Link>
        </Button>
      </div>
    </div>
  )
}
