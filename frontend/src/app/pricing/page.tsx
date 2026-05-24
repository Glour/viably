import type { Metadata } from "next"
import { AppHeader } from "@/widgets/layout"
import { Pricing } from "@/shared/components/landing/pricing"
import { Footer } from "@/shared/components/landing/footer"

export const metadata: Metadata = {
  title: "Тарифы",
  description: "Тарифы и планы Viably — от бесплатного до Enterprise.",
}

const faqItems = [
  {
    q: "Что такое кредит?",
    a: "Кредит — это одна генерация. Разные шаблоны стоят от 2 до 5 кредитов за генерацию.",
  },
  {
    q: "Можно ли попробовать бесплатно?",
    a: "Да! Бесплатный план даёт 5 кредитов в день — этого достаточно, чтобы попробовать платформу.",
  },
  {
    q: "Как работает оплата?",
    a: "Ежемесячная подписка с автопродлением. Вы можете отменить в любой момент из настроек аккаунта.",
  },
  {
    q: "Что входит в Enterprise?",
    a: "Кастомные интеграции, SLA, выделенный персональный менеджер и приоритетная поддержка. Свяжитесь с нами для обсуждения.",
  },
]

export default function PricingPage() {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen">
        <Pricing />

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
            Часто задаваемые вопросы
          </h2>
          <div className="divide-y divide-border rounded-lg border">
            {faqItems.map((item) => (
              <details key={item.q} className="group p-4">
                <summary className="flex cursor-pointer items-center justify-between font-medium transition-colors hover:text-primary">
                  {item.q}
                  <span className="ml-2 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
