import type {
  AuthUser,
  ProjectStatus,
  BackendProjectStatus,
  CreditBalance,
  DailyBonusInfo,
  DailyBonusClaim,
  ApiCreditTransaction,
  TransactionsPaginated,
  ApiTemplate,
  ApiTemplateDetail,
  ApiProject,
  ProjectsPaginated,
  UpdateProfilePayload,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/types"

// === Status Mapping ===

const STATUS_MAP: Record<BackendProjectStatus, ProjectStatus> = {
  draft: "draft",
  generating: "generating",
  ready: "generated",
  deploying: "generating",
  deployed: "deployed",
  error: "failed",
}

export function mapProjectStatus(status: string): ProjectStatus {
  return STATUS_MAP[status as BackendProjectStatus] ?? "draft"
}

// === User Mappers ===

export function mapUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: raw.id as string,
    email: raw.email as string,
    fullName: (raw.full_name as string | null) ?? null,
    avatarUrl: (raw.avatar_url as string | null) ?? null,
    plan: raw.plan as AuthUser["plan"],
    credits: raw.credits as number,
    referralCode: raw.referral_code as string,
    isVerified: raw.is_verified as boolean,
    createdAt: raw.created_at as string,
    lastLoginAt: (raw.last_login_at as string | null) ?? null,
  }
}

// === Credits Mappers ===

export function mapDailyBonusInfo(raw: Record<string, unknown>): DailyBonusInfo {
  return {
    amount: raw.amount as number,
    claimedToday: raw.claimed_today as boolean,
    nextAvailableAt: (raw.next_available_at as string | null) ?? null,
    streakDays: (raw.streak_days as number) ?? 0,
  }
}

export function mapCreditBalance(raw: Record<string, unknown>): CreditBalance {
  const dailyBonusRaw = raw.daily_bonus as Record<string, unknown> | null
  return {
    credits: raw.credits as number,
    plan: raw.plan as string,
    dailyBonus: dailyBonusRaw ? mapDailyBonusInfo(dailyBonusRaw) : null,
  }
}

export function mapDailyBonusClaim(raw: Record<string, unknown>): DailyBonusClaim {
  return {
    claimed: raw.claimed as boolean,
    amount: raw.amount as number,
    newBalance: raw.new_balance as number,
    nextAvailableAt: raw.next_available_at as string,
  }
}

export function mapCreditTransaction(raw: Record<string, unknown>): ApiCreditTransaction {
  return {
    id: raw.id as string,
    amount: raw.amount as number,
    balanceAfter: raw.balance_after as number,
    transactionType: raw.transaction_type as string,
    description: (raw.description as string | null) ?? null,
    projectId: (raw.project_id as string | null) ?? null,
    relatedUserId: (raw.related_user_id as string | null) ?? null,
    extraData: (raw.extra_data as Record<string, unknown>) ?? {},
    createdAt: raw.created_at as string,
  }
}

export function mapTransactionsPaginated(raw: Record<string, unknown>): TransactionsPaginated {
  const data = raw.data as Record<string, unknown>[] | undefined
  const meta = raw.meta as Record<string, unknown> | undefined
  return {
    transactions: Array.isArray(data) ? data.map(mapCreditTransaction) : [],
    meta: {
      total: (meta?.total as number) ?? 0,
      limit: (meta?.limit as number) ?? 20,
      offset: (meta?.offset as number) ?? 0,
    },
  }
}

// === Template Mappers ===

export function mapTemplate(raw: Record<string, unknown>): ApiTemplate {
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: raw.slug as string,
    description: raw.description as string,
    category: raw.category as string,
    creditCost: raw.credit_cost as number,
    previewImageUrl: (raw.preview_image_url as string | null) ?? null,
    features: (raw.features as string[]) ?? [],
    tags: (raw.tags as string[]) ?? [],
    usageCount: (raw.usage_count as number) ?? 0,
    createdAt: raw.created_at as string,
  }
}

export function mapTemplateDetail(raw: Record<string, unknown>): ApiTemplateDetail {
  return {
    ...mapTemplate(raw),
    configSchema: (raw.config_schema as Record<string, unknown> | null) ?? null,
    exampleConfig: (raw.example_config as Record<string, unknown> | null) ?? null,
  }
}

// === Project Mappers ===

export function mapProject(raw: Record<string, unknown>): ApiProject {
  const generatedCodeRaw = raw.generated_code as Record<string, unknown> | null
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    name: raw.name as string,
    description: (raw.description as string | null) ?? null,
    templateId: raw.template_id as string,
    config: (raw.config as Record<string, unknown>) ?? {},
    status: mapProjectStatus(raw.status as string),
    isPublic: (raw.is_public as boolean) ?? false,
    createdAt: raw.created_at as string,
    updatedAt: (raw.updated_at as string | null) ?? null,
    generatedCode: generatedCodeRaw
      ? {
          files: (generatedCodeRaw.files as Record<string, string>) ?? {},
          entryPoint: (generatedCodeRaw.entry_point as string) ?? "main.py",
          runtime: (generatedCodeRaw.runtime as string) ?? "python3.11",
        }
      : null,
    generationLogs: (raw.generation_logs as string | null) ?? null,
    aiModelUsed: (raw.ai_model_used as string | null) ?? null,
    errorMessage: (raw.error_message as string | null) ?? null,
    deployedUrl: (raw.deployed_url as string | null) ?? null,
    deployPlatform: (raw.deploy_platform as string | null) ?? null,
    generatedAt: (raw.generated_at as string | null) ?? null,
    deployedAt: (raw.deployed_at as string | null) ?? null,
  }
}

export function mapProjectsPaginated(raw: Record<string, unknown>): ProjectsPaginated {
  const items = raw.items as Record<string, unknown>[] | undefined
  return {
    items: Array.isArray(items) ? items.map(mapProject) : [],
    total: (raw.total as number) ?? 0,
    page: (raw.page as number) ?? 1,
    perPage: (raw.per_page as number) ?? 20,
    pages: (raw.pages as number) ?? 1,
  }
}

// === Payload Mappers (camelCase → snake_case for backend) ===

export function toUpdateProfilePayload(data: UpdateProfilePayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.fullName !== undefined) payload.full_name = data.fullName
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl
  return payload
}

export function toCreateProjectPayload(data: CreateProjectPayload): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    template_id: data.templateId,
    config: data.config,
  }
}

export function toUpdateProjectPayload(data: UpdateProjectPayload): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.description !== undefined) payload.description = data.description
  if (data.config !== undefined) payload.config = data.config
  if (data.isPublic !== undefined) payload.is_public = data.isPublic
  return payload
}
