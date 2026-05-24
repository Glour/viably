"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/shared/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-bold tracking-tight">
          Что-то пошло не так
        </h2>
        <p className="max-w-md text-muted-foreground">
          Произошла непредвиденная ошибка. Наша команда уже уведомлена
          и работает над исправлением. Попробуйте ещё раз.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            ID ошибки: {error.digest}
          </p>
        )}
      </div>

      <Button onClick={reset} variant="default" size="lg">
        Попробовать снова
      </Button>
    </div>
  )
}
