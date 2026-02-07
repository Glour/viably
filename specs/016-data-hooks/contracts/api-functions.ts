/**
 * API Functions Contract — raw API call functions used by hooks
 *
 * All functions use the existing `api` ky instance from lib/api/client.ts
 * All functions accept AbortSignal for React Query cancellation
 * All responses are mapped from snake_case to camelCase
 */

// ─── User API ────────────────────────────────────────────────

/**
 * fetchCurrentUser(signal?) → Promise<AuthUser>
 * GET /api/users/me
 * Maps: full_name→fullName, avatar_url→avatarUrl, etc.
 */

/**
 * updateProfile(payload: UpdateProfilePayload, signal?) → Promise<AuthUser>
 * PATCH /api/users/me
 * Sends: { full_name, avatar_url }
 * Returns mapped AuthUser
 */

// ─── Credits API ─────────────────────────────────────────────

/**
 * fetchCreditBalance(signal?) → Promise<CreditBalance>
 * GET /api/credits/balance
 * Maps: daily_bonus.claimed_today→claimedToday, streak_days→streakDays
 */

/**
 * fetchDailyBonusStatus(signal?) → Promise<DailyBonusInfo>
 * GET /api/credits/daily-bonus
 */

/**
 * claimDailyBonus() → Promise<DailyBonusClaim>
 * POST /api/credits/daily-bonus
 * Maps: new_balance→newBalance, next_available_at→nextAvailableAt
 */

/**
 * fetchCreditTransactions(params: { offset?: number; limit?: number; type?: string }, signal?) → Promise<TransactionsPaginated>
 * GET /api/credits/transactions?offset=&limit=&type=
 * Maps: balance_after→balanceAfter, transaction_type→transactionType
 */

// ─── Templates API ───────────────────────────────────────────

/**
 * fetchTemplates(params?: { category?: string; search?: string }, signal?) → Promise<Template[]>
 * GET /api/templates?category=&search=
 * Maps: credit_cost→creditCost, preview_image_url→previewImageUrl, usage_count→usageCount
 */

/**
 * fetchTemplate(slugOrId: string, signal?) → Promise<TemplateDetail>
 * GET /api/templates/{slugOrId}
 * Maps: config_schema→configSchema, example_config→exampleConfig
 */

// ─── Projects API ────────────────────────────────────────────

/**
 * fetchProjects(params?: { status?: string; page?: number; per_page?: number }, signal?) → Promise<ProjectsPaginated>
 * GET /api/projects?status=&page=&per_page=
 * Maps: user_id→userId, template_id→templateId, is_public→isPublic
 * Status mapping: ready→generated, error→failed
 */

/**
 * fetchProject(id: string, signal?) → Promise<Project>
 * GET /api/projects/{id}
 * Includes: generatedCode, generationLogs, deployedUrl, etc.
 */

/**
 * createProject(payload: CreateProjectPayload) → Promise<Project>
 * POST /api/projects
 * Sends: { name, description, template_id, config }
 */

/**
 * deleteProject(id: string) → Promise<void>
 * DELETE /api/projects/{id}
 * Returns: 204 No Content
 */

/**
 * updateProject(id: string, payload: UpdateProjectPayload) → Promise<Project>
 * PATCH /api/projects/{id}
 * Sends: { name?, description?, config?, is_public? }
 */
