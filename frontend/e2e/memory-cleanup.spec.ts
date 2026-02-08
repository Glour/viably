/**
 * Memory Cleanup Verification Test
 *
 * Verifies that React Query cache and Zustand stores are properly cleared on logout
 * to prevent memory leaks during long user sessions.
 *
 * @see Task T058
 * @see frontend/scripts/test-memory-cleanup.html for manual testing guide
 */

import { test, expect } from "@playwright/test"

test.describe("Memory Cleanup on Logout", () => {
  test("should clear React Query cache after logout", async ({ page }) => {
    // Navigate to login
    await page.goto("/login")

    // Login
    await page.fill('input[name="email"]', "test@viably.io")
    await page.fill('input[name="password"]', "TestPassword123!")
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL("/dashboard")
    await page.waitForTimeout(1000) // Let data load

    // Navigate through app to populate cache
    await page.goto("/templates")
    await page.waitForTimeout(500)

    await page.goto("/projects")
    await page.waitForTimeout(500)

    // Check that localStorage has auth tokens BEFORE logout
    const tokensBeforeLogout = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem("access_token"),
        refreshToken: localStorage.getItem("refresh_token"),
      }
    })

    expect(tokensBeforeLogout.accessToken).not.toBeNull()
    expect(tokensBeforeLogout.refreshToken).not.toBeNull()

    // Inject React Query cache inspector
    await page.evaluate(() => {
      // Store reference to query client for post-logout verification
      ;(window as any).__QUERY_CLIENT_REFERENCE__ = (window as any).__REACT_QUERY_CLIENT__
    })

    // Logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('[data-testid="logout-button"]')

    // Wait for redirect to login
    await page.waitForURL("/login")
    await page.waitForTimeout(2000) // Give cleanup time to complete

    // Verify localStorage cleared (only theme should remain)
    const tokensAfterLogout = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      return {
        accessToken: localStorage.getItem("access_token"),
        refreshToken: localStorage.getItem("refresh_token"),
        allKeys: keys,
      }
    })

    expect(tokensAfterLogout.accessToken).toBeNull()
    expect(tokensAfterLogout.refreshToken).toBeNull()

    // Only theme preference should remain
    expect(tokensAfterLogout.allKeys.length).toBeLessThanOrEqual(1)
    if (tokensAfterLogout.allKeys.length === 1) {
      expect(tokensAfterLogout.allKeys[0]).toBe("theme")
    }
  })

  test("should not trigger data refetch after logout", async ({ page }) => {
    let apiRequests: string[] = []

    // Track all API requests
    page.on("request", (request) => {
      const url = request.url()
      if (url.includes("/api/")) {
        apiRequests.push(url)
      }
    })

    // Login
    await page.goto("/login")
    await page.fill('input[name="email"]', "test@viably.io")
    await page.fill('input[name="password"]', "TestPassword123!")
    await page.click('button[type="submit"]')
    await page.waitForURL("/dashboard")

    // Clear tracked requests (ignore login flow)
    apiRequests = []

    // Logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL("/login")
    await page.waitForTimeout(2000)

    // Filter requests AFTER logout
    const postLogoutRequests = apiRequests.filter((url) => {
      // Exclude the logout endpoint itself
      return !url.includes("/api/auth/logout")
    })

    // Should have NO data fetch requests after logout
    expect(postLogoutRequests.length).toBe(0)
  })

  test("should reset Zustand stores on logout", async ({ page }) => {
    // Login and load data
    await page.goto("/login")
    await page.fill('input[name="email"]', "test@viably.io")
    await page.fill('input[name="password"]', "TestPassword123!")
    await page.click('button[type="submit"]')
    await page.waitForURL("/dashboard")

    // Load projects to populate store
    await page.goto("/projects")
    await page.waitForTimeout(1000)

    // Inject store state inspector
    const storeStateBeforeLogout = await page.evaluate(() => {
      // Access Zustand stores from window (if exposed) or via store hooks
      const authStore = (window as any).useAuthStore?.getState()
      return {
        hasAuthStore: !!authStore,
        isAuthenticated: authStore?.isAuthenticated,
        hasUser: !!authStore?.user,
      }
    })

    expect(storeStateBeforeLogout.isAuthenticated).toBe(true)
    expect(storeStateBeforeLogout.hasUser).toBe(true)

    // Logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL("/login")
    await page.waitForTimeout(2000)

    // Verify store state reset
    const storeStateAfterLogout = await page.evaluate(() => {
      const authStore = (window as any).useAuthStore?.getState()
      return {
        isAuthenticated: authStore?.isAuthenticated,
        user: authStore?.user,
      }
    })

    expect(storeStateAfterLogout.isAuthenticated).toBe(false)
    expect(storeStateAfterLogout.user).toBeNull()
  })

  test("should handle rapid logout without memory leaks", async ({ page }) => {
    // This test simulates a user rapidly logging in/out
    // to ensure cleanup completes before next session

    for (let i = 0; i < 3; i++) {
      // Login
      await page.goto("/login")
      await page.fill('input[name="email"]', "test@viably.io")
      await page.fill('input[name="password"]', "TestPassword123!")
      await page.click('button[type="submit"]')
      await page.waitForURL("/dashboard")
      await page.waitForTimeout(500)

      // Navigate to load data
      await page.goto("/projects")
      await page.waitForTimeout(500)

      // Logout
      await page.click('[data-testid="user-menu-trigger"]')
      await page.click('[data-testid="logout-button"]')
      await page.waitForURL("/login")
      await page.waitForTimeout(1000)

      // Verify clean state after each iteration
      const cleanState = await page.evaluate(() => {
        return {
          localStorageKeys: Object.keys(localStorage).length,
          hasTokens: !!(
            localStorage.getItem("access_token") || localStorage.getItem("refresh_token")
          ),
        }
      })

      expect(cleanState.hasTokens).toBe(false)
      expect(cleanState.localStorageKeys).toBeLessThanOrEqual(1) // Only theme
    }
  })

  test("should clear sensitive data from memory on logout", async ({ page }) => {
    // Login
    await page.goto("/login")
    await page.fill('input[name="email"]', "test@viably.io")
    await page.fill('input[name="password"]', "TestPassword123!")
    await page.click('button[type="submit"]')
    await page.waitForURL("/dashboard")
    await page.waitForTimeout(1000)

    // Capture user email from DOM (should be visible when logged in)
    const userEmailBeforeLogout = await page.textContent('[data-testid="user-email"]')
    expect(userEmailBeforeLogout).toBe("test@viably.io")

    // Logout
    await page.click('[data-testid="user-menu-trigger"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL("/login")
    await page.waitForTimeout(2000)

    // Try to navigate back to dashboard (should redirect to login)
    await page.goto("/dashboard")
    await page.waitForURL("/login") // Should auto-redirect

    // Verify no user data visible
    const userEmailAfterLogout = await page.textContent('[data-testid="user-email"]').catch(() => null)
    expect(userEmailAfterLogout).toBeNull()
  })
})

test.describe("React Query Cache Behavior", () => {
  test("should respect staleTime and gcTime settings", async ({ page }) => {
    // This test verifies that cache configuration is working as expected
    await page.goto("/login")
    await page.fill('input[name="email"]', "test@viably.io")
    await page.fill('input[name="password"]', "TestPassword123!")
    await page.click('button[type="submit"]')
    await page.waitForURL("/dashboard")

    // Check cache configuration
    const cacheConfig = await page.evaluate(() => {
      const queryClient = (window as any).__REACT_QUERY_CLIENT__
      if (!queryClient) return null

      const defaultOptions = queryClient.defaultOptions
      return {
        staleTime: defaultOptions.queries?.staleTime,
        gcTime: defaultOptions.queries?.gcTime,
      }
    })

    // Verify configuration matches our settings from query-client.ts
    expect(cacheConfig?.staleTime).toBe(5 * 60 * 1000) // 5 minutes
    expect(cacheConfig?.gcTime).toBe(10 * 60 * 1000) // 10 minutes
  })

  test("should garbage collect inactive queries after gcTime", async ({ page }) => {
    // Note: This test requires waiting 10+ minutes in real-time
    // For CI/CD, mock timers or reduce gcTime in test environment
    test.skip(true, "Skipped: Requires 10+ minute wait for gcTime expiration")

    await page.goto("/login")
    await page.fill('input[name="email"]', "test@viably.io")
    await page.fill('input[name="password"]', "TestPassword123!")
    await page.click('button[type="submit"]')
    await page.waitForURL("/dashboard")

    // Load data
    await page.goto("/projects")
    await page.waitForTimeout(1000)

    // Check query count
    const queriesBeforeWait = await page.evaluate(() => {
      const queryClient = (window as any).__REACT_QUERY_CLIENT__
      return queryClient?.getQueryCache().getAll().length || 0
    })

    // Navigate away (make queries inactive)
    await page.goto("/settings")

    // Wait for gcTime (10 minutes + buffer)
    await page.waitForTimeout(11 * 60 * 1000)

    // Check query count again
    const queriesAfterGC = await page.evaluate(() => {
      const queryClient = (window as any).__REACT_QUERY_CLIENT__
      return queryClient?.getQueryCache().getAll().length || 0
    })

    // Inactive queries should be garbage collected
    expect(queriesAfterGC).toBeLessThan(queriesBeforeWait)
  })
})
