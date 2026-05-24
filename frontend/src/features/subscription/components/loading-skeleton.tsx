export function LoadingSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-8 w-24 bg-muted rounded mb-2"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded"></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="h-4 w-20 bg-muted rounded mb-1"></div>
          <div className="h-8 w-24 bg-muted rounded"></div>
        </div>
        <div>
          <div className="h-4 w-20 bg-muted rounded mb-1"></div>
          <div className="h-8 w-24 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function ErrorMessage({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
      <h3 className="text-lg font-semibold text-destructive mb-2">Ошибка загрузки</h3>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Попробовать снова
        </button>
      )}
    </div>
  )
}
