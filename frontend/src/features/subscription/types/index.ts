export interface PlanDetails {
  id: string
  name: string
  creditsPerMonth: number
  deployLimit: number | null
  priceMonthly: number
  priceYearly: number
}

export interface PlanUsage {
  creditsRemaining: number
  deploysUsed: number
}

export interface SubscriptionDetails {
  status: 'active' | 'inactive' | 'cancelled'
  renewalDate: string | null
  cancelAtPeriodEnd: boolean
}

export interface Transaction {
  id: string
  amount: number
  type: 'earned' | 'spent' | 'bonus' | 'refund'
  description: string
  createdAt: string
}

export interface UserPlanData {
  plan: PlanDetails
  usage: PlanUsage
  subscription: SubscriptionDetails
  transactions: Transaction[]
}

export interface UserPlanResponse {
  data: UserPlanData
}
