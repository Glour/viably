"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { createPaymentAndRedirect } from "@/shared/lib/payments"
import { PaymentMethodModal } from "@/shared/components/payment-method-modal"
import { useTranslations } from "next-intl"

import { motion, AnimatePresence } from "motion/react"
import { fadeInUp, staggerContainer } from "@/shared/lib/animations"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { useHasMounted } from "@/shared/hooks/use-has-mounted"
import { usePricingToggle, type BillingPeriod } from "@/shared/hooks/use-pricing-toggle"
import { AVAILABLE_PLANS } from "@/shared/lib/data/settings"
import type { SubscriptionPlan } from "@/shared/types"
import { Check } from "lucide-react"
import Link from "next/link"
import { cn } from "@/shared/lib/utils"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const YEARLY_DISCOUNT = 0.8 // 20% off
const LANDING_TIERS = ["free", "starter", "pro", "business", "enterprise"] as const

/** All plans shown on the landing page */
const LANDING_PLANS = AVAILABLE_PLANS.filter((p) =>
  (LANDING_TIERS as readonly string[]).includes(p.tier),
)

const CTA_HREFS: Record<string, string> = {
  free: "/register",
}

const PAID_PLANS = new Set(["starter", "pro", "business"])

/** Early Bird pricing for first 100 users */
const EARLY_BIRD_PRICES: Record<string, number> = {
  starter: 12,
  pro: 29,
  business: 99,
}

/** Stripe Price IDs mapping */
const STRIPE_PRICE_IDS = {
  starter: {
    earlyBird: {
      monthly: "price_1T2UzgJu7HyIEuVbpT6A6bVZ",
      yearly: "price_1T2VALJu7HyIEuVbEB4BARju",
    },
    regular: {
      monthly: "price_1T2VD6Ju7HyIEuVbZWLcSFNL",
      yearly: "price_1T2VD6Ju7HyIEuVbvOPR9lMI",
    },
  },
  pro: {
    earlyBird: {
      monthly: "price_1T2VHRJu7HyIEuVbPaucMy5P",
      yearly: "price_1T2VHRJu7HyIEuVbGn56LrOa",
    },
    regular: {
      monthly: "price_1T2VIMJu7HyIEuVb5HYHcPJB",
      yearly: "price_1T2VIMJu7HyIEuVbQgwJUY1H",
    },
  },
  business: {
    earlyBird: {
      monthly: "price_1T2VKRJu7HyIEuVbZZHu7LNa",
      yearly: "price_1T2VKRJu7HyIEuVbsH0LXFJC",
    },
    regular: {
      monthly: "price_1T2VOtJu7HyIEuVbuDnGJ3yg",
      yearly: "price_1T2VOtJu7HyIEuVbYN4V7rNr",
    },
  },
} as const

/** Early bird status - first 100 users get early bird pricing */
const EARLY_BIRD_ENABLED = true // TODO: Disable after first 100 users

/**
 * Get correct Stripe price ID based on tier, period, and early bird status
 */
function getStripePriceId(
  tier: string,
  period: BillingPeriod,
  isEarlyBird: boolean
): string | null {
  if (tier === "free") return null
  
  const tierPrices = STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS]
  if (!tierPrices) return null

  const priceType = isEarlyBird ? tierPrices.earlyBird : tierPrices.regular
  return priceType[period]
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
  return value.toLocaleString("en-US")
}

/* ------------------------------------------------------------------ */
/*  Pricing Section                                                    */
/* ------------------------------------------------------------------ */

export function Pricing() {
  const t = useTranslations("pricing")
  const t_pf = useTranslations("plan_features")
  const reduced = useReducedMotion()
  const mounted = useHasMounted()
  const { period, togglePeriod } = usePricingToggle()

  return (
    <section id="pricing" className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-[image:var(--gradient-cool)] opacity-5 blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[image:var(--gradient-warm)] opacity-5 blur-[120px] pointer-events-none" aria-hidden="true" />

      <motion.div
        className="mx-auto max-w-[1400px] px-6 relative"
        variants={reduced ? undefined : staggerContainer}
        initial={!mounted || reduced ? undefined : "hidden"}
        whileInView={!mounted || reduced ? undefined : "visible"}
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Heading */}
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[image:var(--gradient-main)]" />
          <p className="mt-4 font-body text-lg md:text-xl leading-relaxed text-muted-foreground">
            {t("subtitle")}
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
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-6"
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
  const t = useTranslations("pricing")
  const t_pf = useTranslations("plan_features")
  return (
    <div
      className="relative inline-flex items-center rounded-xl border border-border bg-muted/50 p-1"
      role="radiogroup"
      aria-label={t("billing_period_aria")}
    >
      <ToggleButton
        label={t("monthly")}
        value="monthly"
        active={period === "monthly"}
        onClick={() => onToggle("monthly")}
        reduced={reduced}
      />
      <ToggleButton
        label={t("yearly")}
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
        "relative z-10 rounded-lg px-4 py-2 text-sm font-body font-medium transition-colors",
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
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-body font-bold leading-none">
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
  const t = useTranslations("pricing")
  const t_pf = useTranslations("plan_features")
  const isPopular = plan.isPopular
  const monthlyPrice = plan.price ?? 0
  const earlyBirdPrice = EARLY_BIRD_PRICES[plan.tier] ?? monthlyPrice
  const hasEarlyBird = plan.tier in EARLY_BIRD_PRICES && EARLY_BIRD_ENABLED
  
  const yearlyTotal = getYearlyPrice(hasEarlyBird ? earlyBirdPrice : monthlyPrice)
  const yearlyMonthly = getMonthlyEquivalent(yearlyTotal)
  const isFree = plan.tier === "free"
  const isEnterprise = plan.tier === "enterprise"

  const displayPrice = period === "monthly" || isFree 
    ? (hasEarlyBird ? earlyBirdPrice : monthlyPrice)
    : yearlyMonthly
  
  const originalPrice = period === "monthly" || isFree
    ? monthlyPrice
    : getMonthlyEquivalent(getYearlyPrice(monthlyPrice))

  const ctaHref = CTA_HREFS[plan.tier] ?? "/pricing"
  const ctaLabel = isFree 
    ? t("get_started")
    : isEnterprise 
    ? t("contact_us") 
    : t("choose")

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
      whileHover={reduced ? undefined : {
        y: isPopular ? -12 : -8,
        transition: { duration: 0.3 }
      }}
      className="relative flex flex-col min-w-[260px] mt-[3.5rem]"
    >
      {/* Card */}
      <div
        className={cn(
          "group relative flex flex-col flex-1 rounded-2xl border transition-all duration-300",
          isPopular
            ? "border-transparent bg-card/40 dark:bg-card/80 backdrop-blur-xl shadow-xl shadow-primary-glow/20"
            : "border-border/50 dark:border-border bg-card/40 dark:bg-card/80 backdrop-blur-xl shadow-lg hover:shadow-[0_0_24px_var(--primary-glow)]",
        )}
      >
      {/* Gradient border for popular plan */}
      {isPopular && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 group-hover:opacity-100"
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

      {/* Early Bird badge — своё место на краю */}
      {hasEarlyBird && (
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: 0, transform: "translateY(-50%)", zIndex: 20 }}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-body font-semibold text-white shadow-lg">
            🔥 {t("early_bird")}
          </span>
        </div>
      )}

      {/* Popular badge — прямо над Early Bird (или на месте если нет Early Bird) */}
      {isPopular && (
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: 0, transform: hasEarlyBird ? "translateY(calc(-50% - 26px))" : "translateY(-50%)", zIndex: 21 }}
        >
          <span className="inline-flex items-center rounded-full bg-[image:var(--gradient-main)] px-3 py-1 text-xs font-body font-semibold text-white shadow-[0_0_20px_var(--primary-glow)]">
            &#9733; {t("popular")}
          </span>
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-6 lg:px-7 lg:pb-7">
        {/* Plan name */}
        <h3 className="font-heading text-xl lg:text-2xl font-bold tracking-tight text-foreground">
          {plan.name}
        </h3>

        {/* Price block */}
        <div className="mt-4 min-h-[5.5rem]">
          <div className="h-5 mb-1">
            {hasEarlyBird && (
              <span className="line-through text-muted-foreground text-sm">
                {formatPrice(originalPrice)} $
              </span>
            )}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${plan.id}-${period}`}
              initial={reduced ? undefined : { opacity: 0, y: -10 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {isFree ? (
                <div>
                  <span className="font-heading text-2xl font-extrabold tracking-tight">
                    {t("free_forever")}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">{t("forever")}</p>
                </div>
              ) : isEnterprise ? (
                <div>
                  <span className="font-heading text-2xl font-extrabold tracking-tight">
                    {t("individual")}
                  </span>
                  <p className="mt-1 text-sm text-muted-foreground">{t("contact_us_enterprise")}</p>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "font-heading text-3xl lg:text-4xl font-extrabold tracking-tight",
                    (isPopular || hasEarlyBird) && "bg-[image:var(--gradient-main)] bg-clip-text text-transparent"
                  )}>
                    {formatPrice(displayPrice)} $
                  </span>
                  <span className="text-sm text-muted-foreground">{t("per_month")}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {/* Yearly note */}
          {!isFree && !isEnterprise && period === "yearly" && (
            <p className="mt-1 text-sm font-body text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <span>{formatPrice(yearlyTotal)} {t("per_year_short")}</span>
                <span className="text-xs">&#10003;</span>
              </span>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="my-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Features */}
        <ul className="flex-1 space-y-3" role="list" aria-label={`${t('features_aria')} ${plan.name}`}>
          {(plan.featureKeys ?? plan.features ?? []).map((featureKey) => (
            <li key={featureKey} className="flex items-start gap-2.5 text-sm">
              <Check
                className={cn(
                  "mt-0.5 size-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                  isPopular ? "text-primary" : "text-success",
                )}
                aria-hidden="true"
              />
              <span className="font-body leading-relaxed text-muted-foreground break-words">
                {plan.featureKeys ? t_pf(featureKey as any) : featureKey}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <PlanCTAButton
          tier={plan.tier}
          ctaHref={ctaHref}
          ctaLabel={ctaLabel}
          isPopular={isPopular}
        />
      </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Plan CTA Button                                                    */
/* ------------------------------------------------------------------ */

function PlanCTAButton({
  tier,
  ctaHref,
  ctaLabel,
  isPopular,
}: {
  tier: string
  ctaHref: string
  ctaLabel: string
  isPopular: boolean
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const handleClick = useCallback(async () => {
    if (tier === "enterprise") {
      window.location.href = "mailto:hello@viably.dev?subject=Enterprise%20Plan%20Inquiry"
      return
    }

    if (!PAID_PLANS.has(tier)) {
      router.push(ctaHref)
      return
    }

    const token = typeof window !== "undefined"
      ? localStorage.getItem("viably_access_token")
      : null

    if (!token) {
      router.push("/login")
      return
    }

    setShowModal(true)
  }, [tier, ctaHref, router])

  return (
    <>
      {showModal && (
        <PaymentMethodModal
          tier={tier}
          onClose={() => setShowModal(false)}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
      className={cn(
        "mt-6 flex h-11 w-full items-center justify-center rounded-xl text-sm lg:text-base font-body font-semibold transition-all duration-300 cursor-pointer",
        isPopular
          ? "text-white bg-[image:var(--gradient-main)] bg-[length:200%_200%] bg-[position:0%_0%] shadow-[0_0_24px_var(--primary-glow)] hover:bg-[position:100%_100%] hover:shadow-[0_0_40px_var(--primary-glow)] hover:scale-105"
          : "border-2 border-border/60 text-foreground hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_16px_var(--primary-glow)]",
      )}
    >
        {ctaLabel}
      </button>
    </>
  )
}
