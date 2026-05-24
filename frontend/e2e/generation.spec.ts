import { test, expect } from "@playwright/test"
import {
  setupAuthMocks,
  injectAuthTokens,
  setupCreditsMocks,
  setupTemplatesMocks,
  setupProjectsMocks,
  setupGenerationWS,
} from "./fixtures/test-helpers"
import { MOCK_TEMPLATE, MOCK_PROJECT_DRAFT } from "./fixtures/mock-data"

test.describe("Template → Project → Generation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Inject tokens FIRST, before any navigation
    await injectAuthTokens(page)

    // Setup all required mocks for authenticated user
    await setupAuthMocks(page)
    await setupCreditsMocks(page, 100)
    await setupTemplatesMocks(page)
    await setupProjectsMocks(page)
  })

  test("browse templates → see template cards", async ({ page }) => {
    await page.goto("/templates", { waitUntil: "domcontentloaded" })

    // Wait for templates heading to appear (indicating successful page load)
    await expect(page.getByRole("heading", { name: /шаблоны ботов/i })).toBeVisible({ timeout: 15000 })

    // Verify page description
    await expect(page.getByText(/выбери шаблон и создай бота/i)).toBeVisible()

    // Verify search bar is present
    const searchInput = page.getByPlaceholder(/поиск/i)
    await expect(searchInput).toBeVisible()

    // Verify template card is visible with correct data
    const templateCard = page.locator("article").filter({ hasText: MOCK_TEMPLATE.name })
    await expect(templateCard).toBeVisible({ timeout: 10000 })

    // Verify template card shows the name
    await expect(templateCard.getByRole("heading", { name: MOCK_TEMPLATE.name })).toBeVisible()

    // Verify template card shows description
    await expect(templateCard.getByText(MOCK_TEMPLATE.description)).toBeVisible()

    // Verify credit cost badge
    await expect(templateCard.getByText(new RegExp(`${MOCK_TEMPLATE.credit_cost} credits`, "i"))).toBeVisible()

    // Verify "Использовать" button
    await expect(templateCard.getByRole("button", { name: /использовать/i })).toBeVisible()
  })

  test("template detail → click template card → navigate to detail page", async ({ page }) => {
    await page.goto("/templates")

    // Wait for templates to load
    await expect(page.getByRole("heading", { name: /шаблоны ботов/i })).toBeVisible()

    // Click on template card
    const templateCard = page.getByRole("article").filter({ hasText: MOCK_TEMPLATE.name })
    await templateCard.click()

    // Should navigate to detail page
    await expect(page).toHaveURL(`/templates/${MOCK_TEMPLATE.slug}`)

    // Verify detail page shows template info
    await expect(page.getByRole("heading", { name: MOCK_TEMPLATE.name })).toBeVisible()
    await expect(page.getByText(MOCK_TEMPLATE.description)).toBeVisible()

    // Verify credit cost badge
    await expect(page.getByText(new RegExp(`${MOCK_TEMPLATE.credit_cost} credits`, "i"))).toBeVisible()

    // Verify "Создать проект" button
    await expect(page.getByRole("button", { name: /создать проект/i })).toBeVisible()

    // Verify features section
    await expect(page.getByRole("heading", { name: /что умеет этот бот/i })).toBeVisible()

    // Verify at least one feature is shown
    for (const feature of MOCK_TEMPLATE.features.slice(0, 3)) {
      await expect(page.getByText(feature)).toBeVisible()
    }

    // Verify back link
    await expect(page.getByRole("link", { name: /назад к шаблонам/i })).toBeVisible()
  })

  test("create project → click create button → redirect to generation page", async ({ page }) => {
    await page.goto(`/templates/${MOCK_TEMPLATE.slug}`)

    // Wait for detail page to load
    await expect(page.getByRole("heading", { name: MOCK_TEMPLATE.name })).toBeVisible()

    // Click "Создать проект" button
    await page.getByRole("button", { name: /создать проект/i }).click()

    // Should redirect to generation page
    await expect(page).toHaveURL(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Verify compact navbar is visible
    await expect(page.locator("nav")).toBeVisible()

    // Verify chat panel is visible (desktop view)
    const chatPanel = page.locator('[class*="flex"][class*="h-full"][class*="flex-col"]').filter({ hasText: /генерировать/i }).first()
    await expect(chatPanel).toBeVisible({ timeout: 10000 })

    // Verify template info header shows template name
    await expect(page.getByText(MOCK_TEMPLATE.name)).toBeVisible()

    // Verify AI welcome message
    await expect(page.getByText(/привет.*давай настроим/i)).toBeVisible()

    // Verify "Генерировать" button is present
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeVisible()

    // Verify preview panel tabs are visible
    await expect(page.getByRole("tab", { name: /preview/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /code/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /logs/i })).toBeVisible()

    // Verify idle state message in preview panel
    await expect(page.getByText(/нажми.*генерировать.*чтобы начать/i)).toBeVisible()
  })

  test("generation progress → start generation → verify progress updates", async ({ page }) => {
    // Setup WebSocket mock for generation progress
    await setupGenerationWS(page)

    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for page to load
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeVisible()

    // Click "Генерировать" button
    await page.getByRole("button", { name: /генерировать/i }).first().click()

    // Verify button state changes to "Генерируем..."
    await expect(page.getByRole("button", { name: /генерируем/i }).first()).toBeVisible({ timeout: 5000 })

    // Verify progress heading appears in preview panel
    await expect(page.getByRole("heading", { name: /генерация кода/i })).toBeVisible({ timeout: 5000 })

    // Verify progress steps appear (check for at least one step message)
    // Using more flexible selectors to find step text
    const progressContainer = page.locator('[class*="space-y"]').filter({ hasText: /генерация кода/i }).first()

    // Wait for any progress message to appear
    await expect(progressContainer.getByText(/анализ|архитектур|генерация|проверка|тестирование|финализация/i).first()).toBeVisible({ timeout: 3000 })

    // Verify progress bar is visible
    const progressBar = page.locator('[class*="h-2"][class*="bg-muted"][class*="rounded-full"]')
    await expect(progressBar).toBeVisible({ timeout: 2000 })

    // Verify progress percentage is shown
    await expect(page.getByText(/%$/)).toBeVisible({ timeout: 2000 })

    // Verify cancel button is visible during generation
    await expect(page.getByRole("button", { name: /отменить/i })).toBeVisible({ timeout: 2000 })
  })

  test("code display → after generation completes → verify code is visible", async ({ page }) => {
    // Setup WebSocket mock for generation progress
    await setupGenerationWS(page)

    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for page to load
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeVisible()

    // Click "Генерировать" button
    await page.getByRole("button", { name: /генерировать/i }).first().click()

    // Wait for generation to complete (WebSocket sends completion after ~3s)
    // Check for completion state by looking for deploy/download buttons or code tab auto-switch
    await expect(page.getByRole("button", { name: /развернуть|deploy/i })).toBeVisible({ timeout: 10000 })

    // Verify code tab is now active (auto-switches on completion)
    const codeTab = page.getByRole("tab", { name: /code/i })
    await expect(codeTab).toHaveAttribute("data-state", "active", { timeout: 5000 })

    // Verify code editor or code display is visible
    // Monaco editor typically has a contenteditable div
    const codeEditor = page.locator('[class*="monaco"]').or(page.locator('[contenteditable="true"]')).first()
    await expect(codeEditor).toBeVisible({ timeout: 5000 })

    // Verify action buttons are visible
    await expect(page.getByRole("button", { name: /скачать|download/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /развернуть|deploy/i })).toBeVisible()
  })

  test("mobile view → tabs switch between chat and preview", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for page to load
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeVisible()

    // On mobile, verify tabs are present at bottom
    // The MobileTabs component should have "Чат" and "Превью" tabs
    await expect(page.getByRole("button", { name: /чат/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /превью/i })).toBeVisible()

    // Initially "Чат" should be active
    const chatTab = page.getByRole("button", { name: /чат/i })
    await expect(chatTab).toHaveAttribute("data-state", "active")

    // Click on "Превью" tab
    await page.getByRole("button", { name: /превью/i }).click()

    // Verify preview tab is now active
    const previewTab = page.getByRole("button", { name: /превью/i })
    await expect(previewTab).toHaveAttribute("data-state", "active")

    // Verify idle state message is visible
    await expect(page.getByText(/нажми.*генерировать.*чтобы начать/i)).toBeVisible()
  })

  test("insufficient credits → show error message", async ({ page }) => {
    // Setup mocks with insufficient credits (less than template cost)
    await setupCreditsMocks(page, 5) // Template costs 10 credits

    await page.goto(`/templates/${MOCK_TEMPLATE.slug}`)

    // Wait for detail page to load
    await expect(page.getByRole("heading", { name: MOCK_TEMPLATE.name })).toBeVisible()

    // Verify "Создать проект" button is disabled
    const createButton = page.getByRole("button", { name: /создать проект/i })
    await expect(createButton).toBeDisabled()

    // Verify insufficient credits message
    await expect(page.getByText(/недостаточно кредитов/i)).toBeVisible()

    // Verify link to replenish credits
    await expect(page.getByRole("link", { name: /пополнить/i })).toBeVisible()
  })

  test("search templates → filter by name", async ({ page }) => {
    await page.goto("/templates")

    // Wait for templates to load
    await expect(page.getByRole("heading", { name: /шаблоны ботов/i })).toBeVisible()

    // Type in search bar
    const searchInput = page.getByPlaceholder(/поиск/i)
    await searchInput.fill("FAQ")

    // Verify template card with "FAQ" in name is visible
    await expect(page.getByRole("article").filter({ hasText: "FAQ Bot" })).toBeVisible()

    // Clear search
    await searchInput.fill("")

    // Verify all templates are visible again
    await expect(page.getByRole("article").filter({ hasText: MOCK_TEMPLATE.name })).toBeVisible()
  })

  test("filter tabs → switch between categories", async ({ page }) => {
    await page.goto("/templates")

    // Wait for templates to load
    await expect(page.getByRole("heading", { name: /шаблоны ботов/i })).toBeVisible()

    // Verify "Все" tab is active by default
    const allTab = page.getByRole("tab", { name: /все/i })
    await expect(allTab).toHaveAttribute("data-state", "active")

    // Click on "Популярные" tab
    const popularTab = page.getByRole("tab", { name: /популярные/i })
    await popularTab.click()

    // Verify tab is now active
    await expect(popularTab).toHaveAttribute("data-state", "active")

    // Click back on "Все" tab
    await allTab.click()

    // Verify all templates are visible again
    await expect(page.getByRole("article").filter({ hasText: MOCK_TEMPLATE.name })).toBeVisible()
  })

  test("back navigation → detail page back link works", async ({ page }) => {
    await page.goto(`/templates/${MOCK_TEMPLATE.slug}`)

    // Wait for detail page to load
    await expect(page.getByRole("heading", { name: MOCK_TEMPLATE.name })).toBeVisible()

    // Click back link
    await page.getByRole("link", { name: /назад к шаблонам/i }).click()

    // Should navigate back to templates list
    await expect(page).toHaveURL("/templates")

    // Verify templates list is visible
    await expect(page.getByRole("heading", { name: /шаблоны ботов/i })).toBeVisible()
  })

  test("keyboard navigation → template card is keyboard accessible", async ({ page }) => {
    await page.goto("/templates")

    // Wait for templates to load
    await expect(page.getByRole("heading", { name: /шаблоны ботов/i })).toBeVisible()

    // Template cards are wrapped in <Link>, so they should be keyboard accessible
    const templateCard = page.getByRole("article").filter({ hasText: MOCK_TEMPLATE.name }).locator("..")

    // Focus on the card link and press Enter
    await templateCard.focus()
    await templateCard.press("Enter")

    // Should navigate to detail page
    await expect(page).toHaveURL(`/templates/${MOCK_TEMPLATE.slug}`)
  })

  test("generation error → show retry and modify buttons", async ({ page }) => {
    // Setup mocks to simulate error state
    await page.route("**/api/projects/*/generate", async (route) => {
      await route.fulfill({
        status: 500,
        json: { detail: "Generation failed" },
      })
    })

    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for page to load
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeVisible()

    // Click "Генерировать" button
    await page.getByRole("button", { name: /генерировать/i }).first().click()

    // Wait for error state (should show error message)
    // The error boundary or error state component should display error
    await expect(page.getByText(/ошибка|error|failed/i)).toBeVisible({ timeout: 10000 })

    // Verify retry button is visible
    await expect(page.getByRole("button", { name: /повторить|retry/i })).toBeVisible({ timeout: 5000 })

    // Verify modify button is visible
    await expect(page.getByRole("button", { name: /изменить|modify/i })).toBeVisible({ timeout: 5000 })
  })

  test("free text input → type and submit custom prompt", async ({ page }) => {
    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for page to load
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeVisible()

    // Find free text input (textarea)
    const _freeTextInput = page.locator("textarea").filter({ hasText: "" }).or(page.getByPlaceholder(/описать|опиши|подробнее/i))

    // If no placeholder matches, just get the first textarea in chat panel
    const textarea = page.locator("textarea").first()

    // Type custom prompt
    await textarea.fill("Добавь команду /help с подробным описанием")

    // Verify text is entered
    await expect(textarea).toHaveValue(/добавь команду/i)

    // The form should allow submission with custom text
    // Generate button should still be available
    await expect(page.getByRole("button", { name: /генерировать/i }).first()).toBeEnabled()
  })

  test("project name displayed in navbar", async ({ page }) => {
    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for navbar to load
    await expect(page.locator("nav")).toBeVisible()

    // Verify project name is shown (from MOCK_PROJECT_DRAFT)
    await expect(page.getByText(MOCK_PROJECT_DRAFT.name)).toBeVisible()
  })

  test("credits displayed in navbar", async ({ page }) => {
    await page.goto(`/projects/${MOCK_PROJECT_DRAFT.id}/generate`)

    // Wait for navbar to load
    await expect(page.locator("nav")).toBeVisible()

    // Verify credits are shown (mocked to 100)
    await expect(page.locator("nav").getByText(/100|150/)).toBeVisible()
  })
})
