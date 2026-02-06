"use client"

import { motion, AnimatePresence } from "motion/react"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { usePricingToggle, type BillingPeriod } from "@/lib/hooks/use-pricing-toggle"
import { AVAILABLE_PLANS } from "@/lib/data/settings"
import type { SubscriptionPlan } from "@/types"
import { Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const YEARLY_DISCOUNT = 0.8 // 20% off
const LANDING_TIERS = ["free", "starter", "pro"] as const

/** Only the 3 plans shown on the landing page */
const LANDING_PLANS = AVAILABLE_PLANS.filter((p) =>
  (LANDING_TIERS as readonly string[]).includes(p.tier),
)

const CTA_HREFS: Record<string, string> = {
  free: "/register",
  starter: "/pricing/starter",
  pro: "/pricing/pro",
}

const CTA_LABELS: Record<string, string> = {
  free: "Начать бесплатно",
  starter: "Выбрать Starter",
  pro: "Выбрать Pro",
}

/* ------------------------------------------------------------------ */
/*  Price helpers                                                      */
/* ------------------------------------------------------------------ */

function getYearlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * YEARLY_DISCOUNT)
}

function getMonthlyEquivalent(yearlyPrice: number): number {
  return Math.round(yearlyPrice / 12)
}

function formatPrice(value: number): string {
  return value.toLocaleString("ru-RU")
}

/* ------------------------------------------------------------------ */
/*  Pricing Section                                                    */
/* ------------------------------------------------------------------ */

export function Pricing() {
  const reduced = useReducedMotion()
  const { period, togglePeriod } = usePricingToggle()

  return (
    <section id="pricing" className="py-20 lg:py-32">
      <motion.div
        className="mx-auto max-w-[1280px] px-6"
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? undefined : "hidden"}
        whileInView={reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Heading */}
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Простые и прозрачные{" "}
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              цены
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Начните бесплатно. Масштабируйтесь, когда будете готовы.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          className="mb-10 flex items-center justify-center gap-3"
        >
          <BillingToggle
            period={period}
            onToggle={togglePeriod}
            reduced={reduced}
          />
        </motion.div>

        {/* Plan cards grid */}
        <motion.div
          variants={reduced ? undefined : staggerContainer}
          className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8"
        >
          {LANDING_PLANS.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              period={period}
              index={index}
              reduced={reduced}
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Billing Toggle                                                     */
/* ------------------------------------------------------------------ */

function BillingToggle({
  period,
  onToggle,
  reduced,
}: {
  period: BillingPeriod
  onToggle: (next: BillingPeriod) => void
  reduced: boolean
}) {
  return (
    <div
      className="relative inline-flex items-center rounded-xl border border-border bg-muted/50 p-1"
      role="radiogroup"
      aria-label="Период оплаты"
    >
      <ToggleButton
        label="Ежемесячно"
        value="monthly"
        active={period === "monthly"}
        onClick={() => onToggle("monthly")}
        reduced={reduced}
      />
      <ToggleButton
        label="Ежегодно"
        value="yearly"
        active={period === "yearly"}
        onClick={() => onToggle("yearly")}
        reduced={reduced}
        badge="-20%"
      />
    </div>
  )
}

function ToggleButton({
  label,
  value,
  active,
  onClick,
  reduced,
  badge,
}: {
  label: string
  value: BillingPeriod
  active: boolean
  onClick: () => void
  reduced: boolean
  badge?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "relative z-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "text-white"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* Animated background indicator */}
      {active && (
        reduced ? (
          <span className="absolute inset-0 rounded-lg bg-[image:var(--gradient-main)]" />
        ) : (
          <motion.span
            layoutId="billing-toggle-bg"
            className="absolute inset-0 rounded-lg bg-[image:var(--gradient-main)]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )
      )}
      <span className="relative flex items-center gap-1.5">
        {label}
        {badge && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold leading-none">
            {badge}
          </span>
        )}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Plan Card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  plan,
  period,
  index,
  reduced,
}: {
  plan: SubscriptionPlan
  period: BillingPeriod
  index: number
  reduced: boolean
}) {
  const isPopular = plan.isPopular
  const monthlyPrice = plan.price ?? 0
  const yearlyTotal = getYearlyPrice(monthlyPrice)
  const yearlyMonthly = getMonthlyEquivalent(yearlyTotal)
  const isFree = monthlyPrice === 0

  const displayPrice = period === "monthly" || isFree ? monthlyPrice : yearlyMonthly
  const ctaHref = CTA_HREFS[plan.tier] ?? "/pricing"
  const ctaLabel = CTA_LABELS[plan.tier] ?? "Выбрать"

  const cardVariants = reduced
    ? undefined
    : {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, delay: index * 0.15, ease: "easeOut" as const },
        },
      }

  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 lg:p-8",
        isPopular
          ? "border-transparent bg-card shadow-xl shadow-primary-glow/10"
          : "border-border bg-card/60",
      )}
    >
      {/* Gradient border for popular plan */}
      {isPopular && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl"
          style={{
            background: "var(--gradient-main)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "2px",
          }}
          aria-hidden="true"
        />
      )}

      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-[image:var(--gradient-main)] px-3 py-1 text-xs font-semibold text-white shadow-[0_0_16px_var(--primary-glow)]">
            Популярный
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>

      {/* Price display */}
      <div className="mt-4 flex items-baseline gap-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${plan.id}-${period}`}
            initial={reduced ? undefined : { opacity: 0, y: -10 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="font-heading text-4xl font-bold"
          >
            {isFree ? "Бесплатно" : `${formatPrice(displayPrice)} ₽`}
          </motion.span>
        </AnimatePresence>
        {!isFree && (
          <span className="text-sm text-muted-foreground">/мес</span>
        )}
      </div>

      {/* Yearly note: crossed-out original monthly price */}
      {!isFree && period === "yearly" && (
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="line-through">{formatPrice(monthlyPrice)} ₽/мес</span>
          <span className="ml-2 font-medium text-success">
            {formatPrice(yearlyTotal)} ₽/год
          </span>
        </p>
      )}

      {/* Divider */}
      <div className="my-6 h-px bg-border" />

      {/* Features */}
      <ul className="flex-1 space-y-3" role="list" aria-label={`Возможности ${plan.name}`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                isPopular ? "text-primary" : "text-success",
              )}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <Link
        href={ctaHref}
        className={cn(
          "mt-8 flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300",
          isPopular
            ? "text-white bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_24px_var(--primary-glow)] hover:bg-[position:100%_100%] hover:shadow-[0_0_36px_var(--primary-glow)]"
            : "border border-border text-foreground hover:bg-accent",
        )}
      >
        {ctaLabel}
      </Link>
    </motion.div>
  )
}
