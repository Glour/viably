import type { Metadata } from "next"
import Link from "next/link"
import { XCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Оплата отменена",
}

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Оплата отменена
        </h1>
        <p className="mt-4 text-muted-foreground">
          Платёж не был завершён. Вы можете попробовать снова.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Вернуться к тарифам
        </Link>
      </div>
    </main>
  )
}
