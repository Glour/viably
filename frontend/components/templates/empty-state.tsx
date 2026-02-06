import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  onReset?: () => void
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-6xl mb-4" aria-hidden="true">
        📭
      </span>
      <p className="font-heading text-lg font-semibold">
        Шаблоны не найдены
      </p>
      <p className="text-muted-foreground mt-1">
        Попробуйте изменить параметры поиска
      </p>
      {onReset && (
        <Button variant="secondary" className="mt-4" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}
    </div>
  )
}
