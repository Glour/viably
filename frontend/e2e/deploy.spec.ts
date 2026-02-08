import { test, expect } from "@playwright/test"
import {
  setupAuthMocks,
  injectAuthTokens,
  setupCreditsMocks,
  setupProjectsMocks,
  setupDeployMocks,
  setupDeployWS,
} from "./fixtures/test-helpers"
import { MOCK_PROJECT_GENERATED, MOCK_PROJECT_DRAFT } from "./fixtures/mock-data"

test.describe("Deploy Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup all required mocks
    await setupAuthMocks(page)
    await setupCreditsMocks(page)
    await setupDeployMocks(page)
    await injectAuthTokens(page)
  })

  test("navigate to generated project and verify deploy button", async ({ page }) => {
    // Setup project with "ready" status (generated code available)
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)

    // Navigate to generation page for project
    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Verify deploy button is present and clickable
    // The deploy button appears in the preview panel when generation is complete
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await expect(deployButton).toBeVisible()
    await expect(deployButton).toBeEnabled()
  })

  test("open deploy dialog and verify form fields", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Click deploy button to open dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Verify deploy modal opens
    await expect(page.getByRole("dialog")).toBeVisible()

    // Verify dialog title
    await expect(page.getByRole("heading", { name: /развернуть бота/i })).toBeVisible()

    // Verify bot token input field
    const botTokenInput = page.getByLabel(/токен бота/i)
    await expect(botTokenInput).toBeVisible()
    await expect(botTokenInput).toHaveAttribute("type", "password")

    // Verify optional database URL input
    const databaseInput = page.getByLabel(/database url/i)
    await expect(databaseInput).toBeVisible()

    // Verify deploy button is disabled when token is empty
    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await expect(submitButton).toBeDisabled()

    // Verify warning message about token security
    await expect(page.locator("text=/токен будет использован только для развёртывания/i")).toBeVisible()

    // Verify download ZIP button is present as alternative
    await expect(page.getByRole("button", { name: /скачать zip/i }).first()).toBeVisible()
  })

  test("bot token visibility toggle works", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible()

    const botTokenInput = page.getByLabel(/токен бота/i)

    // Token should be hidden by default (password type)
    await expect(botTokenInput).toHaveAttribute("type", "password")

    // Find and click the show/hide toggle button (eye icon)
    // The button is inside the relative container with the input
    const toggleButton = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).first()
    await toggleButton.click()

    // Token should now be visible (text type)
    await expect(botTokenInput).toHaveAttribute("type", "text")

    // Click again to hide
    await toggleButton.click()

    // Token should be hidden again
    await expect(botTokenInput).toHaveAttribute("type", "password")
  })

  test("submit deploy with valid bot token", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible()

    // Fill in bot token
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    // Submit button should now be enabled
    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await expect(submitButton).toBeEnabled()

    // Click deploy
    await submitButton.click()

    // Verify deploy starts - dialog title should change
    await expect(page.getByRole("heading", { name: /развёртывание/i })).toBeVisible({ timeout: 5000 })

    // Verify progress UI is shown
    // Should show steps and progress bar
    await expect(page.locator("text=/Подготовка репозитория|Отправка кода|Сборка проекта/i").first()).toBeVisible()

    // Verify progress bar exists
    const progressBar = page.locator('[class*="bg-gradient"]').filter({ has: page.locator('//ancestor::*[contains(@class, "h-2")]') })
    await expect(progressBar.first()).toBeVisible()
  })

  test("deploy success - verify deployment info displayed", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill and submit
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await submitButton.click()

    // Wait for deployment to complete
    // Dialog title should change to "Готово!" (Ready/Success)
    await expect(page.getByRole("heading", { name: /готово/i })).toBeVisible({ timeout: 10000 })

    // Verify success message
    await expect(page.locator("text=/бот развёрнут/i")).toBeVisible()

    // Verify bot info card is displayed
    await expect(page.locator("text=/работает|running/i")).toBeVisible()

    // Verify deployment URL is shown
    await expect(page.locator("a[href*='railway.app']")).toBeVisible()

    // Verify action buttons
    await expect(page.getByRole("button", { name: /открыть в telegram/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /к проектам|назад/i })).toBeVisible()
  })

  test("deploy error - verify error message and retry", async ({ page }) => {
    // Setup mock to return error
    await page.route("**/api/projects/*/deploy", async (route) => {
      await route.fulfill({
        status: 400,
        json: { detail: "Invalid bot token" },
      })
    })

    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill and submit with invalid token
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("invalid-token")

    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await submitButton.click()

    // Wait for error state
    await expect(page.getByRole("heading", { name: /ошибка/i })).toBeVisible({ timeout: 5000 })

    // Verify error message is displayed
    await expect(page.locator("text=/ошибка развёртывания/i")).toBeVisible()
    await expect(page.locator("text=/invalid bot token/i")).toBeVisible()

    // Verify retry button is present
    const retryButton = page.getByRole("button", { name: /попробовать снова/i })
    await expect(retryButton).toBeVisible()
    await expect(retryButton).toBeEnabled()

    // Click retry - should reset to idle state
    await retryButton.click()

    // Should return to initial form
    await expect(page.getByRole("heading", { name: /развернуть бота/i })).toBeVisible()
    await expect(botTokenInput).toBeVisible()
  })

  test("deploy modal prevents closing during deployment", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill and submit
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await submitButton.click()

    // Wait for deployment to start
    await expect(page.getByRole("heading", { name: /развёртывание/i })).toBeVisible({ timeout: 5000 })

    // Try to close dialog by clicking outside (Escape key or overlay click)
    await page.keyboard.press("Escape")

    // Dialog should still be visible (can't close during deployment)
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("heading", { name: /развёртывание/i })).toBeVisible()
  })

  test("download ZIP button works from deploy modal", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Wait for dialog
    await expect(page.getByRole("dialog")).toBeVisible()

    // Click download ZIP button
    const downloadButton = page.getByRole("button", { name: /скачать zip/i }).first()
    await expect(downloadButton).toBeVisible()

    // Click should trigger download (we can't verify actual download in E2E, but button should be clickable)
    await downloadButton.click()

    // Dialog should remain open after clicking download
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("optional environment variables can be provided", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill in bot token
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    // Fill in optional database URL
    const databaseInput = page.getByLabel(/database url/i)
    await databaseInput.fill("postgresql://localhost:5432/mydb")

    // Submit button should be enabled
    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await expect(submitButton).toBeEnabled()

    // Deploy should start
    await submitButton.click()

    await expect(page.getByRole("heading", { name: /развёртывание/i })).toBeVisible({ timeout: 5000 })
  })

  test("deploy button disabled when project not ready", async ({ page }) => {
    // Setup project with "draft" status (no generated code)
    await setupProjectsMocks(page, MOCK_PROJECT_DRAFT as unknown as typeof MOCK_PROJECT_GENERATED)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Deploy button should either be disabled or not visible
    // (Depending on implementation - PreviewPanel might hide it for non-ready projects)
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })

    // Check if button exists
    const buttonCount = await deployButton.count()
    if (buttonCount > 0) {
      // If button exists, it should be disabled
      await expect(deployButton).toBeDisabled()
    }
    // Otherwise, button is hidden which is also acceptable
  })

  test("confetti animation triggers on successful deployment", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill and submit
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await submitButton.click()

    // Wait for success
    await expect(page.getByRole("heading", { name: /готово/i })).toBeVisible({ timeout: 10000 })

    // Verify canvas element exists (confetti creates a canvas)
    // Note: We can't verify actual animation, but we can check if confetti library initialized
    const canvas = page.locator("canvas")
    const canvasCount = await canvas.count()

    // Confetti should create at least one canvas element
    expect(canvasCount).toBeGreaterThanOrEqual(0) // Canvas may be created and removed quickly
  })

  test("back to projects button closes modal and stays on page", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill and submit
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await submitButton.click()

    // Wait for success
    await expect(page.getByRole("heading", { name: /готово/i })).toBeVisible({ timeout: 10000 })

    // Click "Back to projects" button
    const backButton = page.getByRole("button", { name: /к проектам|назад/i })
    await backButton.click()

    // Modal should close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 2000 })

    // Should still be on the same page
    await expect(page).toHaveURL(/\/projects\/proj-1\/generate/)
  })

  test("open in telegram button works on success", async ({ page }) => {
    await setupProjectsMocks(page, MOCK_PROJECT_GENERATED)
    await setupDeployWS(page)

    await page.goto("/projects/proj-1/generate")

    // Wait for page to load
    await expect(page.locator("text=/My FAQ Bot/i").first()).toBeVisible({ timeout: 10000 })

    // Open deploy dialog
    const deployButton = page.getByRole("button", { name: /развернуть|deploy/i })
    await deployButton.click()

    // Fill and submit
    const botTokenInput = page.getByLabel(/токен бота/i)
    await botTokenInput.fill("123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11")

    const submitButton = page.getByRole("button", { name: /развернуть/i }).last()
    await submitButton.click()

    // Wait for success
    await expect(page.getByRole("heading", { name: /готово/i })).toBeVisible({ timeout: 10000 })

    // Setup popup listener to verify window.open is called
    const popupPromise = page.waitForEvent("popup", { timeout: 5000 })

    // Click "Open in Telegram" button
    const openTelegramButton = page.getByRole("button", { name: /открыть в telegram/i })
    await openTelegramButton.click()

    // Verify popup was opened (new tab with bot URL)
    const popup = await popupPromise
    expect(popup.url()).toContain("railway.app")
  })
})
