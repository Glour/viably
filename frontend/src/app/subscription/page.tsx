'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Crown,
  Gem,
  FolderKanban,
  CalendarClock,
  ArrowRight,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useAuthStore } from '@/features/auth/stores'
import { useCreditBalance } from '@/entities/credit'
import { useProjects } from '@/entities/project'
import { AVAILABLE_PLANS } from '@/shared/lib/data/settings'
import { fadeInUp, staggerContainer } from '@/shared/lib/animations'
import { useReducedMotion } from '@/shared/hooks/use-reduced-motion'
import { useTranslations } from 'next-intl'
import { MainLayout } from '@/widgets/layout'

interface SubscriptionStatus {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('subscription')
  
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
        <CheckCircle2 size={12} />
        {t('active')}
      </span>
    )
  }
  if (status === 'inactive' || status === 'free') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
        <XCircle size={12} />
        {t('free_plan')}
      </span>
    )
  }
  if (status === 'cancelled' || status === 'canceled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-500 border border-orange-500/20">
        <AlertCircle size={12} />
        {t('cancelled')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      {status}
    </span>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function SubscriptionPage() {
  const t = useTranslations('subscription')
  const reduced = useReducedMotion()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const token = typeof window !== 'undefined' ? localStorage.getItem('viably_access_token') : null

  const { data: creditData, isLoading: loadingCredits } = useCreditBalance(isAuthenticated)
  const { data: projectsData, isLoading: loadingProjects } = useProjects(isAuthenticated, { page: 1, perPage: 1 })

  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(false)

  const plan = AVAILABLE_PLANS.find((p) => p.tier === (user?.plan || 'free')) || AVAILABLE_PLANS[0]
  const creditsRemaining = creditData?.credits ?? user?.credits ?? 0
  const deploysUsed = projectsData?.total ?? 0
  const deployLimitLabel = plan.deployLimit !== null ? String(plan.deployLimit) : t('no_limit')

  const isPaidPlan = user?.plan && user.plan !== 'free'

  // Use earlyBirdPrice if available, otherwise fall back to price
  const displayPrice = plan.earlyBirdPrice ?? plan.price

  const loadSubscriptionStatus = async () => {
    if (!token || statusLoaded) return
    setLoadingStatus(true)
    try {
      const res = await fetch('/api/stripe/subscription-status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubStatus(data)
        setStatusLoaded(true)
      }
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false)
    }
  }

  const openPortal = async () => {
    if (!token) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } catch {
      // ignore
    } finally {
      setPortalLoading(false)
    }
  }

  if (isPaidPlan && !statusLoaded && !loadingStatus) {
    loadSubscriptionStatus()
  }

  const isLoading = loadingCredits || loadingProjects || !user

  return (
    <MainLayout>
    <main className="min-h-screen bg-background">
      {/* Header */}
      <motion.section
        className="relative py-14 px-6 overflow-hidden"
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? undefined : 'hidden'}
        animate={reduced ? undefined : 'visible'}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[image:var(--gradient-cool)] opacity-5 blur-[120px] pointer-events-none" />
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          className="mx-auto max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Crown className="size-7 text-primary" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="mt-2 font-body text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>
      </motion.section>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 pb-20 space-y-6">

        {/* Current Plan Card */}
        <motion.div
          variants={reduced ? undefined : fadeInUp}
          initial={reduced ? undefined : 'hidden'}
          animate={reduced ? undefined : 'visible'}
          className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-6 overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-glow)] blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500" />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t('current_plan')}</p>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {plan.name}
                  </span>
                  {isLoading ? (
                    <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                  ) : isPaidPlan && subStatus ? (
                    <StatusBadge status={subStatus.status} />
                  ) : isPaidPlan ? (
                    <StatusBadge status="active" />
                  ) : (
                    <StatusBadge status="free" />
                  )}
                </div>
              </div>
              {displayPrice !== null && (
                <div className="text-right shrink-0">
                  <p className="font-heading text-xl font-bold text-foreground">
                    ${displayPrice} / {t('per_month')}
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border/40 px-4 py-3">
                <Gem className="size-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('credits')}</p>
                  {isLoading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="font-semibold text-sm text-foreground">{creditsRemaining} {t('left')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border/40 px-4 py-3">
                <FolderKanban className="size-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('deploys')}</p>
                  {isLoading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded mt-1" />
                  ) : (
                    <p className="font-semibold text-sm text-foreground">{deploysUsed} / {deployLimitLabel}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Renewal date */}
            {subStatus?.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 mb-5">
                <CalendarClock size={14} className="shrink-0 text-primary" />
                {subStatus.cancel_at_period_end
                  ? `${t('active_until')} ${formatDate(subStatus.current_period_end)}`
                  : `${t('next_renewal')}: ${formatDate(subStatus.current_period_end)}`}
              </div>
            )}

            {/* Cancel at period end warning */}
            {subStatus?.cancel_at_period_end && (
              <div className="flex items-center gap-2 text-sm text-orange-500 px-4 py-3 rounded-xl bg-orange-500/5 border border-orange-500/15 mb-5">
                <AlertCircle size={14} className="shrink-0" />
                Автопродление отключено. Доступ сохранится до конца периода.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {isPaidPlan ? (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {portalLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CreditCard size={14} />
                  )}
                  {t('manage')}
                  <ExternalLink size={12} className="opacity-70" />
                </button>
              ) : null}

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted/50 transition-colors text-foreground"
              >
                {isPaidPlan ? t('change_plan') : t('choose_plan')}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Features of current plan */}
        {plan.features && plan.features.length > 0 && (
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            initial={reduced ? undefined : 'hidden'}
            animate={reduced ? undefined : 'visible'}
            className="rounded-2xl border border-border/50 bg-card/60 p-6"
          >
            <h2 className="font-heading text-base font-semibold text-foreground mb-4">
              {t('whats_included')}
            </h2>
            <ul className="space-y-2">
              {(plan.features ?? []).map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Upgrade CTA for free users */}
        {!isPaidPlan && (
          <motion.div
            variants={reduced ? undefined : fadeInUp}
            initial={reduced ? undefined : 'hidden'}
            animate={reduced ? undefined : 'visible'}
            className="relative rounded-2xl overflow-hidden p-6"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <h2 className="font-heading text-xl font-bold text-white mb-2">
                {t('upgrade_title')}
              </h2>
              <p className="text-white/80 text-sm mb-5">
                {t('upgrade_desc')}
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sm font-semibold transition-all hover:bg-white/90"
                style={{ color: 'var(--primary)' }}
              >
                {t('view_plans')}
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </main>
    </MainLayout>
  )
}
