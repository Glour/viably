import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Оплата прошла успешно",
}

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Оплата прошла успешно!
        </h1>
        <p className="mt-4 text-muted-foreground">
          Ваш тариф активирован. Спасибо за покупку!
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Перейти в дашборд
        </Link>
      </div>
    </main>
  )
}
