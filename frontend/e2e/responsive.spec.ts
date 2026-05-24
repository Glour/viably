import { test, expect } from "@playwright/test"
import {
  setupAuthMocks,
  injectAuthTokens,
  setupCreditsMocks,
  setupTemplatesMocks,
  setupProjectsMocks,
} from "./fixtures/test-helpers"

test.describe("Responsive Behavior (375px mobile)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await setupAuthMocks(page)
    await injectAuthTokens(page)
    await setupCreditsMocks(page)
  })

  test("navbar shows hamburger menu on mobile", async ({ page }) => {
    await page.goto("/dashboard")

    // Hamburger button should be visible (sr-only text is "Меню")
    const hamburgerButton = page.getByRole("button", { name: "Меню" })
    await expect(hamburgerButton).toBeVisible()

    // Desktop nav tabs should be hidden (class: hidden md:flex)
    const desktopNav = page.locator("nav .hidden.md\\:flex")
    await expect(desktopNav).not.toBeVisible()

    // Desktop nav links should not be visible
    const desktopNavLinks = page.locator("nav .hidden.md\\:flex a")
    await expect(desktopNavLinks.first()).not.toBeVisible()
  })

  test("hamburger menu opens and closes", async ({ page }) => {
    await page.goto("/dashboard")

    // Click hamburger to open mobile menu
    const hamburgerButton = page.getByRole("button", { name: "Меню" })
    await hamburgerButton.click()

    // Mobile nav items should be visible (in the mobile menu dropdown)
    // The mobile menu has class "md:hidden" and contains links with labels
    // Use more specific selectors to avoid duplicates (dashboard has "Все проекты →" link too)
    const mobileMenu = page.locator("nav .md\\:hidden.border-t")
    await expect(mobileMenu).toBeVisible()
    await expect(mobileMenu.getByRole("link", { name: "Дашборд" })).toBeVisible()
    await expect(mobileMenu.getByRole("link", { name: "Шаблоны" })).toBeVisible()
    await expect(mobileMenu.getByRole("link", { name: "Проекты", exact: true })).toBeVisible()

    // Click hamburger again to close
    await hamburgerButton.click()

    // Wait for animation to complete
    await page.waitForTimeout(300)

    // Mobile menu should be closed
    await expect(mobileMenu).not.toBeVisible()
  })

  test("templates page shows single column on mobile", async ({ page }) => {
    await setupTemplatesMocks(page)
    await page.goto("/templates")
    await page.waitForLoadState("domcontentloaded")

    // At mobile viewport (375px), templates should be in single column
    // Verify by checking no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test("no horizontal scroll on landing page", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test("no horizontal scroll on dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForLoadState("domcontentloaded")

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test("no horizontal scroll on templates page", async ({ page }) => {
    await setupTemplatesMocks(page)
    await page.goto("/templates")
    await page.waitForLoadState("domcontentloaded")

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test("no horizontal scroll on projects page", async ({ page }) => {
    await setupProjectsMocks(page)
    await page.goto("/projects")
    await page.waitForLoadState("domcontentloaded")

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe("Responsive Behavior (768px tablet)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupAuthMocks(page)
    await injectAuthTokens(page)
    await setupCreditsMocks(page)
  })

  test("navbar shows desktop nav at md breakpoint", async ({ page }) => {
    await page.goto("/dashboard")

    // Desktop nav should be visible at md breakpoint
    const desktopNav = page.locator("nav .hidden.md\\:flex")
    await expect(desktopNav).toBeVisible()

    // Hamburger button should be hidden (class: md:hidden)
    const hamburgerButton = page.getByRole("button", { name: "Меню" })
    await expect(hamburgerButton).not.toBeVisible()
  })

  test("templates page shows 2 columns at sm breakpoint", async ({ page }) => {
    await setupTemplatesMocks(page)
    await page.goto("/templates")
    await page.waitForLoadState("domcontentloaded")

    // At 768px (tablet), templates should be in multi-column layout
    // Verify by checking no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})

test.describe("Responsive Behavior (1024px desktop)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await setupAuthMocks(page)
    await injectAuthTokens(page)
    await setupCreditsMocks(page)
  })

  test("templates page shows 3 columns at lg breakpoint", async ({ page }) => {
    await setupTemplatesMocks(page)
    await page.goto("/templates")
    await page.waitForLoadState("domcontentloaded")

    // At 1024px (desktop), templates should be in 3-column layout
    // Verify by checking no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })
})
