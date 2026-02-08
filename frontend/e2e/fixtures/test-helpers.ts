import { Page } from "@playwright/test"
import * as mock from "./mock-data"

// Setup auth API mocks + inject token into localStorage
export async function setupAuthMocks(page: Page) {
  // Mock POST auth/login
  await page.route(`${mock.API_BASE}auth/login`, async (route) => {
    await route.fulfill({ json: mock.MOCK_AUTH_RESPONSE })
  })
  // Mock POST auth/register
  await page.route(`${mock.API_BASE}auth/register`, async (route) => {
    await route.fulfill({ status: 201, json: mock.MOCK_AUTH_RESPONSE })
  })
  // Mock POST auth/logout
  await page.route(`${mock.API_BASE}auth/logout`, async (route) => {
    await route.fulfill({ json: { success: true } })
  })
  // Mock GET users/me
  await page.route(`${mock.API_BASE}users/me`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: mock.MOCK_ME_RESPONSE })
    } else {
      await route.fulfill({ json: mock.MOCK_ME_RESPONSE })
    }
  })
}

// Inject auth tokens into localStorage before page load
export async function injectAuthTokens(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("viably_access_token", "mock-access-token")
    localStorage.setItem("viably_refresh_token", "mock-refresh-token")
    document.cookie = "viably_session=1; path=/; samesite=lax; max-age=604800"
  })
}

// Setup credits mocks with configurable balance
export async function setupCreditsMocks(page: Page, credits = 100) {
  const balance = { ...mock.MOCK_CREDITS_BALANCE, data: { ...mock.MOCK_CREDITS_BALANCE.data, credits } }

  await page.route(`${mock.API_BASE}credits/balance`, async (route) => {
    await route.fulfill({ json: balance })
  })
  await page.route(`${mock.API_BASE}credits/daily-bonus`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { data: balance.data.daily_bonus } })
    } else {
      // POST - claim bonus
      await route.fulfill({ json: mock.MOCK_DAILY_BONUS_CLAIMED })
    }
  })
  await page.route(`${mock.API_BASE}credits/transactions*`, async (route) => {
    await route.fulfill({ json: { data: [], meta: { total: 0, limit: 20, offset: 0 } } })
  })
}

// Setup templates mocks
export async function setupTemplatesMocks(page: Page) {
  await page.route(`${mock.API_BASE}templates`, async (route) => {
    // Match both GET /templates and GET /templates?category=...
    await route.fulfill({ json: mock.MOCK_TEMPLATES_LIST })
  })
  await page.route(`${mock.API_BASE}templates/*`, async (route) => {
    // Match GET /templates/{slug}
    const url = route.request().url()
    if (!url.endsWith("/templates") && !url.includes("?")) {
      await route.fulfill({ json: mock.MOCK_TEMPLATE_DETAIL_RESPONSE })
    } else {
      await route.fulfill({ json: mock.MOCK_TEMPLATES_LIST })
    }
  })
}

// Setup projects mocks
export async function setupProjectsMocks(page: Page, project = mock.MOCK_PROJECT_GENERATED) {
  await page.route(`${mock.API_BASE}projects`, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 201, json: mock.MOCK_PROJECT_DRAFT })
    } else {
      await route.fulfill({ json: mock.MOCK_PROJECTS_LIST })
    }
  })
  await page.route(`${mock.API_BASE}projects/*/generate`, async (route) => {
    await route.fulfill({ json: mock.MOCK_GENERATE_RESPONSE })
  })
  await page.route(`${mock.API_BASE}projects/*/code`, async (route) => {
    await route.fulfill({ json: mock.MOCK_CODE_RESPONSE })
  })
  await page.route(`${mock.API_BASE}projects/*/cancel-generation`, async (route) => {
    await route.fulfill({ json: { data: { credits_refunded: 10 } } })
  })
  await page.route(`${mock.API_BASE}projects/*`, async (route) => {
    const method = route.request().method()
    if (method === "GET") {
      await route.fulfill({ json: project })
    } else if (method === "PATCH") {
      await route.fulfill({ json: project })
    } else if (method === "DELETE") {
      await route.fulfill({ status: 204 })
    } else {
      await route.continue()
    }
  })
}

// Setup WebSocket mock for generation flow
export async function setupGenerationWS(page: Page) {
  await page.routeWebSocket(/.*\/ws\/.*/, (ws) => {
    ws.onMessage((message) => {
      // No response needed for client messages — just simulate server-initiated progress
    })

    // Send generation progress messages with delays
    let delay = 300
    for (const msg of mock.WS_GENERATION_MESSAGES) {
      setTimeout(() => {
        ws.send(JSON.stringify(msg))
      }, delay)
      delay += 500
    }
  })
}

// Setup WebSocket mock for deploy flow
export async function setupDeployWS(page: Page) {
  await page.routeWebSocket(/.*\/ws\/.*/, (ws) => {
    let delay = 300
    for (const msg of mock.WS_DEPLOY_MESSAGES) {
      setTimeout(() => {
        ws.send(JSON.stringify(msg))
      }, delay)
      delay += 400
    }
  })
}

// Setup deploy mocks
export async function setupDeployMocks(page: Page) {
  await page.route(`${mock.API_BASE}projects/*/deploy`, async (route) => {
    await route.fulfill({ json: mock.MOCK_DEPLOY_RESPONSE })
  })
}

// Full setup for authenticated user with all mocks
export async function setupAllMocks(page: Page) {
  await setupAuthMocks(page)
  await setupCreditsMocks(page)
  await setupTemplatesMocks(page)
  await setupProjectsMocks(page)
}

// Login as test user (fills form and submits)
export async function loginAsTestUser(page: Page) {
  await setupAuthMocks(page)
  await setupCreditsMocks(page)
  await page.goto("/login")
  await page.getByLabel(/email/i).fill(mock.TEST_EMAIL)
  await page.getByLabel(/пароль|password/i).fill(mock.TEST_PASSWORD)
  await page.getByRole("button", { name: /войти|sign in|вход/i }).click()
  await page.waitForURL("**/dashboard")
}
