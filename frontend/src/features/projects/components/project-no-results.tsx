import { SearchX } from "lucide-react"
import { Button } from "@/shared/ui/button"

interface ProjectNoResultsProps {
  onReset: () => void
}

export function ProjectNoResults({ onReset }: ProjectNoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="size-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-heading text-lg font-semibold">Ничего не найдено</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Попробуй изменить поисковый запрос или сбросить фильтры
      </p>
      <Button variant="secondary" className="mt-4" onClick={onReset}>
        Сбросить фильтры
      </Button>
    </div>
  )
}
