import { test, expect } from "@playwright/test"
import {
  setupAuthMocks,
  injectAuthTokens,
  setupCreditsMocks,
} from "./fixtures/test-helpers"
import { TEST_EMAIL, TEST_PASSWORD, TEST_NAME } from "./fixtures/mock-data"

test.describe("Auth Flow", () => {
  test("register → redirect to dashboard", async ({ page }) => {
    await setupAuthMocks(page)
    await setupCreditsMocks(page)

    await page.goto("/register")

    // Wait for form to be visible
    await expect(page.getByLabel(/full name/i)).toBeVisible()

    // Fill registration form with actual field labels from register page
    await page.getByLabel(/full name/i).fill(TEST_NAME)
    await page.getByLabel(/email/i).first().fill(TEST_EMAIL)

    // Use more specific selector for password field (not the button)
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD)
    await page.locator('input[type="password"]').nth(1).fill(TEST_PASSWORD)

    // Check the terms and conditions checkbox
    await page.getByRole("checkbox").check()

    // Submit form - actual button text is "Create Account"
    await page.getByRole("button", { name: /create account/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test("login → redirect to dashboard", async ({ page }) => {
    await setupAuthMocks(page)
    await setupCreditsMocks(page)

    await page.goto("/login")

    // Wait for form to be visible
    await expect(page.getByLabel(/email/i)).toBeVisible()

    // Fill login form with actual field labels from login page
    await page.getByLabel(/email/i).fill(TEST_EMAIL)

    // Use more specific selector for password input (avoid matching the toggle button)
    await page.locator('input[type="password"]').fill(TEST_PASSWORD)

    // Submit form - actual button text is "Sign In"
    await page.getByRole("button", { name: /sign in/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test("authenticated user sees navbar with credits", async ({ page }) => {
    await setupAuthMocks(page)
    await setupCreditsMocks(page)
    await injectAuthTokens(page)

    await page.goto("/dashboard")

    // Verify navbar is visible
    await expect(page.locator("nav")).toBeVisible()

    // Verify credits badge is visible (gem icon + credits number)
    // Wait for credits to load
    await page.waitForTimeout(1000)
    const creditsBadge = page.locator('nav').getByText("100")
    await expect(creditsBadge).toBeVisible()

    // Verify user settings button is visible
    const settingsButton = page.locator('nav a[href="/settings"]')
    await expect(settingsButton).toBeVisible()
  })

  test("can access login page after clearing tokens", async ({ page }) => {
    await page.goto("/login")

    // Verify we can access login page
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("unauthenticated user redirected to login from dashboard", async ({
    page,
  }) => {
    // Mock users/me to return 401 (not authenticated)
    await page.route("**/api/users/me", async (route) => {
      await route.fulfill({
        status: 401,
        json: { detail: "Not authenticated" },
      })
    })

    // Don't inject tokens - user is not authenticated
    await page.goto("/dashboard")

    // Should redirect to login since not authenticated
    // ProtectedRoute checks if user is null and redirects to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("authenticated user redirected from login to dashboard", async ({
    page,
  }) => {
    await setupAuthMocks(page)
    await setupCreditsMocks(page)
    await injectAuthTokens(page)

    // Try to access login page while authenticated
    await page.goto("/login")

    // AuthGuard should redirect authenticated users to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test("form fields are required for login", async ({ page }) => {
    await page.goto("/login")

    // Try to submit empty form
    await page.getByRole("button", { name: /sign in/i }).click()

    // Form should not submit (button remains visible, no navigation)
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("display validation error on short password during registration", async ({
    page,
  }) => {
    await setupAuthMocks(page)
    await setupCreditsMocks(page)

    await page.goto("/register")

    // Fill with short password
    await page.getByLabel(/full name/i).fill(TEST_NAME)
    await page.getByLabel(/email/i).first().fill(TEST_EMAIL)
    await page.locator('input[type="password"]').first().fill("123")
    await page.locator('input[type="password"]').nth(1).fill("123")
    await page.getByRole("checkbox").check()

    // Submit form
    await page.getByRole("button", { name: /create account/i }).click()

    // Should show password validation error
    await expect(
      page.locator("text=/password.*must.*at least/i")
    ).toBeVisible()
  })

  test("password visibility toggle works on login page", async ({ page }) => {
    await setupAuthMocks(page)

    await page.goto("/login")

    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.getByRole("button", { name: /show password/i })

    // Password should be hidden by default
    await expect(passwordInput).toBeVisible()
    await expect(passwordInput).toHaveAttribute("type", "password")

    // Click toggle to show password
    await toggleButton.click()

    // Password should now be visible as text
    const passwordTextInput = page.locator('input[placeholder*="password"]')
    await expect(passwordTextInput).toHaveAttribute("type", "text")

    // Button text should change to "Hide password"
    await expect(
      page.getByRole("button", { name: /hide password/i })
    ).toBeVisible()
  })

  test("navigation links work on auth pages", async ({ page }) => {
    await setupAuthMocks(page)

    await page.goto("/login")
    await page.waitForLoadState("domcontentloaded")

    // Click "Sign up" link
    const signUpLink = page.getByRole("link", { name: /sign up/i })
    await expect(signUpLink).toBeVisible()
    await signUpLink.click()

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/, { timeout: 10000 })

    // Click "Sign in" link
    const signInLink = page.getByRole("link", { name: /sign in/i })
    await expect(signInLink).toBeVisible()
    await signInLink.click()

    // Should navigate back to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("forgot password link visible on login page", async ({ page }) => {
    await page.goto("/login")

    // Verify forgot password link is visible
    const forgotPasswordLink = page.getByRole("link", {
      name: /forgot password/i,
    })
    await expect(forgotPasswordLink).toBeVisible()
    await expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password")
  })
})
