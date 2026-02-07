/**
 * Hooks API Contract — public interface of all data hooks
 *
 * Each hook returns React Query result objects.
 * Queries: { data, isLoading, error, refetch, ... }
 * Mutations: { mutate, mutateAsync, isPending, error, ... }
 */

// ─── User Hooks ──────────────────────────────────────────────

/**
 * useCurrentUser() → UseQueryResult<AuthUser>
 * Source: GET /api/users/me
 * Used in: Navbar, Dashboard WelcomeCard, Settings
 */

/**
 * useUpdateProfile() → UseMutationResult<AuthUser, ApiError, UpdateProfilePayload>
 * Source: PATCH /api/users/me
 * onSuccess: invalidate queryKeys.user.me
 */

// ─── Credits Hooks ───────────────────────────────────────────

/**
 * useCreditBalance() → UseQueryResult<CreditBalance>
 * Source: GET /api/credits/balance
 * Used in: Navbar badge, Dashboard, DailyBonus card
 */

/**
 * useDailyBonusStatus() → UseQueryResult<DailyBonusInfo>
 * Source: GET /api/credits/daily-bonus
 * Used in: Dashboard DailyBonus card
 */

/**
 * useClaimDailyBonus() → UseMutationResult<DailyBonusClaim, ApiError, void>
 * Source: POST /api/credits/daily-bonus
 * onSuccess: invalidate credits.balance + credits.dailyBonus
 * Optimistic: update balance in cache immediately
 */

/**
 * useCreditTransactions(filters?) → UseInfiniteQueryResult<TransactionsPaginated>
 * Source: GET /api/credits/transactions?offset=&limit=&type=
 * Pagination: offset-based infinite query
 * Used in: Settings/Billing page
 */

// ─── Templates Hooks ─────────────────────────────────────────

/**
 * useTemplates(filters?) → UseQueryResult<Template[]>
 * Source: GET /api/templates?category=&search=
 * staleTime: 30 minutes
 * Used in: Templates Gallery, Dashboard QuickActions
 */

/**
 * useTemplate(slugOrId) → UseQueryResult<TemplateDetail>
 * Source: GET /api/templates/{slugOrId}
 * staleTime: 30 minutes
 * Used in: Template detail page
 */

// ─── Projects Hooks ──────────────────────────────────────────

/**
 * useProjects(filters?) → UseQueryResult<ProjectsPaginated>
 * Source: GET /api/projects?status=&page=&per_page=
 * Used in: Projects list page
 */

/**
 * useProject(id) → UseQueryResult<Project>
 * Source: GET /api/projects/{id}
 * Used in: Project detail page (overview, code, logs tabs)
 */

/**
 * useRecentProjects(limit?) → UseQueryResult<Project[]>
 * Source: GET /api/projects?page=1&per_page={limit}
 * Used in: Dashboard RecentProjects card
 */

/**
 * useCreateProject() → UseMutationResult<Project, ApiError, CreateProjectPayload>
 * Source: POST /api/projects
 * onSuccess: invalidate projects.all + projects.recent → navigate to /projects/{id}/generate
 */

/**
 * useDeleteProject() → UseMutationResult<void, ApiError, string>
 * Source: DELETE /api/projects/{id}
 * onSuccess: invalidate projects.all + projects.recent
 * Optimistic: remove from list immediately, rollback on error
 */

/**
 * useUpdateProject() → UseMutationResult<Project, ApiError, { id: string; data: UpdateProjectPayload }>
 * Source: PATCH /api/projects/{id}
 * onSuccess: invalidate projects.detail(id) + projects.all
 */
