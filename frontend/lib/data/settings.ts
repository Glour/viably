import type { CreditTransaction, CreditPackage, SubscriptionPlan, UserPlanInfo } from "@/types"

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "pkg-50", credits: 50, price: 490, badge: null },
  { id: "pkg-100", credits: 100, price: 890, badge: "popular" },
  { id: "pkg-250", credits: 250, price: 1990, badge: "best value" },
]

export const AVAILABLE_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    tier: "free",
    price: 0,
    period: "month",
    features: ["3 проекта", "5 кредитов/день (бонус)", "Базовые шаблоны", "Поддержка сообщества"],
    projectLimit: 3,
    creditsPerMonth: 50,
    isPopular: false,
  },
  {
    id: "plan-starter",
    name: "Starter",
    tier: "starter",
    price: 990,
    period: "month",
    features: ["10 проектов", "100 кредитов/мес", "Все шаблоны", "Приоритетная поддержка", "Кастомный брендинг"],
    projectLimit: 10,
    creditsPerMonth: 100,
    isPopular: false,
  },
  {
    id: "plan-pro",
    name: "Pro",
    tier: "pro",
    price: 2490,
    period: "month",
    features: ["Безлимитные проекты", "500 кредитов/мес", "Все шаблоны + ранний доступ", "Приоритетная поддержка", "Кастомный брендинг", "API доступ"],
    projectLimit: null,
    creditsPerMonth: 500,
    isPopular: true,
  },
  {
    id: "plan-business",
    name: "Business",
    tier: "business",
    price: 7990,
    period: "month",
    features: ["Безлимитные проекты", "2000 кредитов/мес", "Все шаблоны + ранний доступ", "Выделенная поддержка", "Кастомный брендинг", "API доступ", "Управление командой", "Аналитика"],
    projectLimit: null,
    creditsPerMonth: 2000,
    isPopular: false,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    tier: "enterprise",
    price: null,
    period: null,
    features: ["Всё из Business", "Безлимитные кредиты", "Кастомные интеграции", "SLA гарантия", "Персональный менеджер", "On-premise развёртывание"],
    projectLimit: null,
    creditsPerMonth: null,
    isPopular: false,
  },
]

// Generate 25 mock transactions with varied types and Russian descriptions
export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: "tx-1", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-02-06T09:00:00Z" },
  { id: "tx-2", amount: -15, type: "spent", description: "Генерация Shop Bot", createdAt: "2026-02-05T14:30:00Z" },
  { id: "tx-3", amount: 100, type: "purchased", description: "Покупка кредитов (100 шт.)", createdAt: "2026-02-04T11:00:00Z" },
  { id: "tx-4", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-02-04T09:00:00Z" },
  { id: "tx-5", amount: -10, type: "spent", description: "Генерация FAQ Bot", createdAt: "2026-02-03T16:45:00Z" },
  { id: "tx-6", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-02-03T09:00:00Z" },
  { id: "tx-7", amount: -20, type: "spent", description: "Генерация CRM Bot", createdAt: "2026-02-02T13:20:00Z" },
  { id: "tx-8", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-02-02T09:00:00Z" },
  { id: "tx-9", amount: 250, type: "purchased", description: "Покупка кредитов (250 шт.)", createdAt: "2026-02-01T10:15:00Z" },
  { id: "tx-10", amount: -15, type: "spent", description: "Генерация Support Bot", createdAt: "2026-01-31T15:00:00Z" },
  { id: "tx-11", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-31T09:00:00Z" },
  { id: "tx-12", amount: -10, type: "spent", description: "Генерация Notification Bot", createdAt: "2026-01-30T11:30:00Z" },
  { id: "tx-13", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-30T09:00:00Z" },
  { id: "tx-14", amount: -15, type: "spent", description: "Генерация Order Bot", createdAt: "2026-01-29T17:00:00Z" },
  { id: "tx-15", amount: 50, type: "purchased", description: "Покупка кредитов (50 шт.)", createdAt: "2026-01-29T10:00:00Z" },
  { id: "tx-16", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-29T09:00:00Z" },
  { id: "tx-17", amount: -10, type: "spent", description: "Генерация Feedback Bot", createdAt: "2026-01-28T14:00:00Z" },
  { id: "tx-18", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-28T09:00:00Z" },
  { id: "tx-19", amount: -20, type: "spent", description: "Генерация Analytics Bot", createdAt: "2026-01-27T12:00:00Z" },
  { id: "tx-20", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-27T09:00:00Z" },
  { id: "tx-21", amount: -10, type: "spent", description: "Генерация Quiz Bot", createdAt: "2026-01-26T16:30:00Z" },
  { id: "tx-22", amount: 100, type: "purchased", description: "Покупка кредитов (100 шт.)", createdAt: "2026-01-26T08:00:00Z" },
  { id: "tx-23", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-26T09:00:00Z" },
  { id: "tx-24", amount: -15, type: "spent", description: "Генерация Booking Bot", createdAt: "2026-01-25T13:45:00Z" },
  { id: "tx-25", amount: 5, type: "earned", description: "Ежедневный бонус", createdAt: "2026-01-25T09:00:00Z" },
]

export const MOCK_USER_PLAN: UserPlanInfo = {
  plan: AVAILABLE_PLANS[1], // Starter
  usage: {
    projectsUsed: 4,
    creditsRemaining: 47,
  },
  renewalDate: "2026-03-06",
}
