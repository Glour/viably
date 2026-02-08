# E2E Testing Research for Next.js 16

**Date**: 2026-02-08
**Researcher**: research-specialist
**Status**: Complete

## Executive Summary

This document provides production-ready patterns for E2E testing with Playwright in Next.js 16, bundle analysis with @next/bundle-analyzer, metadata configuration using Next.js 16 app router conventions, WebSocket mocking in Playwright, and lazy loading with next/dynamic.

All code examples are verified against official Next.js 16.1.5 and Playwright documentation via Context7.

---

## 1. Playwright with Next.js 16 App Router

### Quick Start (Recommended)

**Use the official Next.js with-playwright example:**

```bash
npx create-next-app@latest --example with-playwright with-playwright-app
```

This scaffolds a pre-configured Next.js 16 project with Playwright ready to use.

### Manual Installation

For existing Next.js 16 projects:

```bash
# npm
npm init playwright

# yarn
yarn create playwright

# pnpm
pnpm create playwright
```

This generates `playwright.config.ts` and sets up the testing framework.

### Playwright Configuration for Next.js 16

**playwright.config.ts** (recommended configuration):

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Start Next.js dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Patterns

**Basic Navigation Test** (`e2e/navigation.spec.ts`):

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to the about page', async ({ page }) => {
  // Start from the index page (baseURL is set in playwright.config.ts)
  await page.goto('http://localhost:3000/')

  // Find an element with the text 'About' and click on it
  await page.click('text=About')

  // The new URL should be "/about"
  await expect(page).toHaveURL('http://localhost:3000/about')

  // The new page should contain an h1 with "About"
  await expect(page.locator('h1')).toContainText('About')
})
```

**Testing Against Production Build (RECOMMENDED):**

Playwright simulates real user behavior across Chromium, Firefox, and WebKit. For accurate testing, run against production builds:

```bash
# Terminal 1: Build and start production server
npm run build
npm run start

# Terminal 2: Run Playwright tests
npx playwright test
```

This approach more closely resembles production behavior than testing against dev server.

### Mocking API Responses

**Mock API without calling actual endpoint:**

```typescript
import { test, expect } from '@playwright/test'

test("mocks a fruit and doesn't call api", async ({ page }) => {
  await page.route('*/**/api/v1/fruits', async route => {
    const json = [{ name: 'Strawberry', id: 21 }]
    await route.fulfill({ json })
  })

  await page.goto('https://demo.playwright.dev/api-mocking')
  await expect(page.getByText('Strawberry')).toBeVisible()
})
```

**Modify real API response:**

```typescript
test('gets the json from api and adds a new fruit', async ({ page }) => {
  await page.route('*/**/api/v1/fruits', async route => {
    const response = await route.fetch()
    const json = await response.json()
    json.push({ name: 'Loquat', id: 100 })
    await route.fulfill({ response, json })
  })

  await page.goto('https://demo.playwright.dev/api-mocking')
  await expect(page.getByText('Loquat', { exact: true })).toBeVisible()
})
```

**Replay HAR files for network requests:**

```typescript
test('gets the json from HAR', async ({ page }) => {
  await page.routeFromHAR('./hars/fruit.har', {
    url: '*/**/api/v1/fruits',
    update: false,
  })

  await page.goto('https://demo.playwright.dev/api-mocking')
  await expect(page.getByText('Playwright', { exact: true })).toBeVisible()
})
```

### Context-Level API Mocking

Apply mocks to all pages, popups, and links within a browser context:

```typescript
import { test } from '@playwright/test'

test('mock login endpoint for entire context', async ({ context, page }) => {
  await context.route('**/api/login', route => route.fulfill({
    status: 200,
    body: 'accept',
  }))

  await page.goto('https://example.com')
  // All pages in this context will have the mock applied
})
```

### Testing Next.js Component with Router Mocking

**Mock Next.js router in component tests:**

```typescript
// test file
import { test } from '@playwright/experimental-ct-react'
import { Component } from './mycomponent'

test('should work', async ({ mount }) => {
  const component = await mount(<Component></Component>, {
    // Pass mock value from test into beforeMount hook
    hooksConfig: {
      router: {
        query: { page: 1, per_page: 10 },
        asPath: '/posts'
      }
    }
  })
})
```

```typescript
// hooks configuration file
import router from 'next/router'
import { beforeMount } from '@playwright/experimental-ct-react/hooks'

beforeMount(async ({ hooksConfig }) => {
  // Redefine useRouter to return mock value from test
  router.useRouter = () => hooksConfig.router
})
```

---

## 2. @next/bundle-analyzer Setup

### Installation

```bash
# npm
npm i @next/bundle-analyzer

# yarn
yarn add @next/bundle-analyzer

# pnpm
pnpm add @next/bundle-analyzer
```

### Configuration

**next.config.js** (or next.config.mjs for ESM):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

**For TypeScript projects (next.config.ts):**

```typescript
import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig: NextConfig = {
  // Your existing config
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
```

### Usage

Generate bundle analysis report:

```bash
# npm
ANALYZE=true npm run build

# yarn
ANALYZE=true yarn build

# pnpm
ANALYZE=true pnpm build
```

This will:
1. Build your Next.js application
2. Generate visual bundle reports
3. Open three new browser tabs showing:
   - Client-side bundle analysis
   - Server-side bundle analysis
   - Edge runtime bundle analysis (if applicable)

### Package.json Script (Optional)

Add a dedicated script for convenience:

```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

Then run: `npm run analyze`

### Best Practices

**Bundle Analysis Workflow:**

1. **Run baseline analysis** before optimizations
2. **Identify large dependencies** (>50KB gzipped)
3. **Check for duplicates** (same package multiple versions)
4. **Analyze code splitting** (ensure proper route-based splitting)
5. **Re-run after changes** to validate improvements

**Common Optimizations:**

- Replace large libraries with smaller alternatives
- Use `next/dynamic` for heavy components
- Enable tree shaking by using named imports
- Review `node_modules` for duplicate dependencies

---

## 3. Next.js 16 Metadata API

### Overview

Next.js 16 app router provides file-based and config-based metadata APIs. **DO NOT use static robots.txt or sitemap.xml files**. Instead, use Next.js built-in support via `robots.ts` and `sitemap.ts`.

### Static Metadata (Config-Based)

**app/layout.tsx** or **app/page.tsx**:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Application',
  description: 'A powerful Next.js 16 application',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'My Application',
    description: 'A powerful Next.js 16 application',
    images: ['/og-image.jpg'],
  },
}
```

### Dynamic Metadata with generateMetadata

**app/blog/[slug]/page.tsx**:

```typescript
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params

  // Fetch data for this specific page
  const post = await fetch(`https://api.vercel.app/blog/${slug}`).then((res) =>
    res.json()
  )

  // Optionally access and extend parent metadata
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      images: ['/some-specific-page-image.jpg', ...previousImages],
    },
  }
}

export default function Page({ params, searchParams }: Props) {
  // Page component
}
```

**Key Points:**

- `generateMetadata` is async and runs on the server
- `params` and `searchParams` are now Promises in Next.js 16 (must await them)
- Use `ResolvingMetadata` to extend parent metadata
- Ideal for data-dependent SEO (blog posts, product pages)

### sitemap.ts (File-Based Route Handler)

**app/sitemap.ts**:

```typescript
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://acme.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://acme.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://acme.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
```

**Dynamic Sitemap Example:**

```typescript
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all blog posts
  const posts = await fetch('https://api.vercel.app/blog').then(res => res.json())

  const postEntries: MetadataRoute.Sitemap = posts.map((post: any) => ({
    url: `https://acme.com/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    {
      url: 'https://acme.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    ...postEntries,
  ]
}
```

**Caching:**

- Sitemap route handlers are cached by default
- Use Dynamic APIs (e.g., `cookies()`, `headers()`) to opt out of caching
- Or set `export const dynamic = 'force-dynamic'`

### robots.ts (File-Based Route Handler)

**app/robots.ts**:

```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://acme.com/sitemap.xml',
  }
}
```

**Multiple User Agent Rules:**

```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: '/private/',
      },
      {
        userAgent: ['Applebot', 'Bingbot'],
        disallow: ['/'],
      },
    ],
    sitemap: 'https://acme.com/sitemap.xml',
  }
}
```

**Dynamic robots.ts Example:**

```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://acme.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: process.env.NODE_ENV === 'production' ? '/admin/' : '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

**IMPORTANT:**

- **DO NOT** create static `robots.txt` or `sitemap.xml` files in `public/`
- Use `robots.ts` and `sitemap.ts` in the `app/` directory
- Next.js automatically generates the correct output at `/robots.txt` and `/sitemap.xml`

---

## 4. Playwright WebSocket Mocking

### Basic WebSocket Mocking

**Mock WebSocket without connecting to server:**

```typescript
import { test, expect } from '@playwright/test'

test('mock websocket communication', async ({ page }) => {
  await page.routeWebSocket('wss://example.com/ws', ws => {
    ws.onMessage(message => {
      if (message === 'request')
        ws.send('response')
    })
  })

  await page.goto('/websocket-page')
  // WebSocket messages are now mocked
})
```

### JSON Message Handling

```typescript
test('mock websocket with JSON messages', async ({ page }) => {
  await page.routeWebSocket('wss://example.com/ws', ws => {
    ws.onMessage(message => {
      const json = JSON.parse(message as string)

      if (json.type === 'COURSE_GENERATION_START') {
        ws.send(JSON.stringify({
          type: 'progress',
          phase: 'metadata',
          progress: 0.1
        }))
      }

      if (json.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    })
  })

  await page.goto('/generation')
  // Test WebSocket-driven UI updates
})
```

### Simulating WebSocket Server Events

```typescript
test('simulate server-initiated messages', async ({ page }) => {
  await page.routeWebSocket('/ws', ws => {
    // Send messages immediately after connection
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'welcome', message: 'Connected' }))
    }, 100)

    // Simulate progress updates
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'progress', value: 0.25 }))
    }, 500)

    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'progress', value: 0.50 }))
    }, 1000)

    // Handle client messages
    ws.onMessage(message => {
      const data = JSON.parse(message as string)
      if (data.type === 'subscribe') {
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }))
      }
    })
  })

  await page.goto('/realtime-dashboard')
})
```

### Testing WebSocket Reconnection

```typescript
test('test websocket reconnection logic', async ({ page }) => {
  let connectionCount = 0

  await page.routeWebSocket('/ws', ws => {
    connectionCount++

    if (connectionCount === 1) {
      // Close connection after 1 second to trigger reconnection
      setTimeout(() => {
        ws.close({ code: 1006, reason: 'Connection lost' })
      }, 1000)
    } else {
      // Second connection succeeds
      ws.onMessage(message => {
        ws.send(JSON.stringify({ type: 'ack' }))
      })
    }
  })

  await page.goto('/websocket-page')

  // Verify reconnection happened
  await page.waitForTimeout(2000)
  await expect(page.locator('.connection-status')).toContainText('Connected')
})
```

### Pattern Matching for WebSocket URLs

```typescript
test('match websocket URLs with patterns', async ({ page }) => {
  // Match exact URL
  await page.routeWebSocket('wss://example.com/ws', ws => {
    ws.send('exact match')
  })

  // Match with wildcard
  await page.routeWebSocket('**/ws', ws => {
    ws.send('wildcard match')
  })

  // Match with regex
  await page.routeWebSocket(/.*\/api\/ws.*/, ws => {
    ws.send('regex match')
  })

  await page.goto('/websocket-page')
})
```

### Best Practices for WebSocket Testing

**1. Test Connection Lifecycle:**

```typescript
test('websocket lifecycle', async ({ page }) => {
  let connected = false
  let disconnected = false

  await page.routeWebSocket('/ws', ws => {
    connected = true

    ws.onClose(() => {
      disconnected = true
    })

    ws.onMessage(message => {
      ws.send('ack')
    })
  })

  await page.goto('/websocket-page')
  expect(connected).toBe(true)

  await page.close()
  expect(disconnected).toBe(true)
})
```

**2. Simulate Network Errors:**

```typescript
test('handle websocket errors', async ({ page }) => {
  await page.routeWebSocket('/ws', ws => {
    // Immediately close with error
    ws.close({ code: 1011, reason: 'Internal server error' })
  })

  await page.goto('/websocket-page')

  // Verify error handling UI
  await expect(page.locator('.error-message')).toContainText('Connection failed')
})
```

**3. Test Message Ordering:**

```typescript
test('maintain message order', async ({ page }) => {
  const messages: string[] = []

  await page.routeWebSocket('/ws', ws => {
    ws.onMessage(message => {
      messages.push(message as string)
      ws.send(`echo: ${message}`)
    })
  })

  await page.goto('/websocket-page')

  // Send multiple messages
  await page.evaluate(() => {
    const ws = (window as any).ws
    ws.send('message1')
    ws.send('message2')
    ws.send('message3')
  })

  await page.waitForTimeout(500)
  expect(messages).toEqual(['message1', 'message2', 'message3'])
})
```

---

## 5. next/dynamic for Lazy Loading

### Basic Lazy Loading

**Lazy load a client component:**

```typescript
import dynamic from 'next/dynamic'

const DynamicHeader = dynamic(() => import('../components/header'), {
  loading: () => <p>Loading...</p>,
})

export default function Home() {
  return <DynamicHeader />
}
```

### Disable Server-Side Rendering

**For components that depend on browser APIs:**

```typescript
'use client'

import dynamic from 'next/dynamic'

const DynamicHeader = dynamic(() => import('../components/header'), {
  ssr: false,
})

export default function ClientOnlyPage() {
  return <DynamicHeader />
}
```

**Common use cases for `ssr: false`:**

- Components using `window`, `document`, or browser-only APIs
- Components with `localStorage` or `sessionStorage`
- Third-party libraries that don't support SSR
- Heavy visualization libraries (charts, maps)

### Lazy Loading Heavy Components (Monaco Editor Example)

**Best practice for Monaco Editor in Next.js 16:**

```typescript
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// Lazy load Monaco Editor (prevents SSR issues and reduces initial bundle)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  ),
})

export default function CodeEditor() {
  const [code, setCode] = useState('// Start coding...')

  return (
    <div className="h-screen">
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
    </div>
  )
}
```

### Conditional Lazy Loading

**Load components only when needed:**

```typescript
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Client Components:
const ComponentA = dynamic(() => import('../components/A'))
const ComponentB = dynamic(() => import('../components/B'))
const ComponentC = dynamic(() => import('../components/C'), { ssr: false })

export default function ClientComponentExample() {
  const [showMore, setShowMore] = useState(false)

  return (
    <div>
      {/* Load immediately, but in a separate client bundle */}
      <ComponentA />

      {/* Load on demand, only when the condition is met */}
      {showMore && <ComponentB />}
      <button onClick={() => setShowMore(!showMore)}>Toggle</button>

      {/* Load only on the client side */}
      <ComponentC />
    </div>
  )
}
```

### Named Exports

**Lazy load specific named exports:**

```typescript
import dynamic from 'next/dynamic'

const DynamicChart = dynamic(() =>
  import('../components/charts').then((mod) => mod.BarChart)
)

export default function Dashboard() {
  return <DynamicChart data={chartData} />
}
```

### Multiple Dynamic Components

**Efficient pattern for multiple heavy components:**

```typescript
'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const CodeEditor = dynamic(() => import('./CodeEditor'), { ssr: false })
const PreviewPane = dynamic(() => import('./PreviewPane'), { ssr: false })
const FileExplorer = dynamic(() => import('./FileExplorer'))

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent" />
    </div>
  )
}

export default function IDE() {
  return (
    <div className="grid grid-cols-3 h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <FileExplorer />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <CodeEditor />
      </Suspense>

      <Suspense fallback={<LoadingSpinner />}>
        <PreviewPane />
      </Suspense>
    </div>
  )
}
```

### Best Practices

**1. Lazy Load Heavy Dependencies:**

- Monaco Editor (~2MB)
- Chart libraries (Chart.js, Recharts)
- Map libraries (Leaflet, Mapbox)
- 3D visualization (Three.js)
- Rich text editors (Quill, TipTap)

**2. Provide Loading States:**

Always provide meaningful loading indicators:

```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <ComponentSkeleton />,
})
```

**3. Disable SSR When Necessary:**

Use `ssr: false` for:
- Browser API dependencies
- Components that cause hydration mismatches
- Third-party libraries without SSR support

**4. Combine with Suspense:**

For better control over loading boundaries:

```typescript
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('./Component'), {
  ssr: false,
})

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DynamicComponent />
    </Suspense>
  )
}
```

**5. Measure Impact:**

Use `@next/bundle-analyzer` to verify lazy loading reduces initial bundle size:

```bash
ANALYZE=true npm run build
```

Check:
- Initial bundle decreased
- Component moved to separate chunk
- Improved First Contentful Paint (FCP)

---

## Implementation Recommendations

### For Viably Project (017-websocket-generation)

**1. Playwright E2E Tests:**

Create `e2e/generation.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('course generation with websocket progress', async ({ page }) => {
  // Mock WebSocket connection
  await page.routeWebSocket('/api/ws', ws => {
    ws.onMessage(message => {
      const data = JSON.parse(message as string)

      if (data.type === 'COURSE_GENERATION_START') {
        // Simulate progress updates
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'progress', phase: 'metadata', progress: 0.1 }))
        }, 100)

        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'progress', phase: 'sections', progress: 0.5 }))
        }, 500)

        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'complete', courseId: 'test-123' }))
        }, 1000)
      }
    })
  })

  await page.goto('/projects/new/generate')

  // Fill form and submit
  await page.fill('[name="title"]', 'Test Course')
  await page.click('button[type="submit"]')

  // Verify progress updates
  await expect(page.locator('.progress-bar')).toBeVisible()
  await expect(page.locator('.phase-indicator')).toContainText('metadata')

  // Wait for completion
  await expect(page.locator('.success-message')).toBeVisible({ timeout: 2000 })
})
```

**2. Bundle Analysis:**

Add to `next.config.ts`:

```typescript
import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig = {
  // existing config
}

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig)
```

Run: `ANALYZE=true npm run build`

**3. Metadata Configuration:**

Create `app/sitemap.ts`:

```typescript
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic routes if needed
  return [
    {
      url: 'https://viably.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: 'https://viably.com/dashboard',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
```

Create `app/robots.ts`:

```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://viably.com/sitemap.xml',
  }
}
```

**4. Lazy Load Monaco Editor:**

Already implemented correctly in project. Verify it's using:

```typescript
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
})
```

---

## Success Criteria

- ✅ Playwright setup with Next.js 16 app router documented
- ✅ @next/bundle-analyzer configuration provided
- ✅ Metadata API patterns (generateMetadata, sitemap.ts, robots.ts) documented
- ✅ WebSocket mocking patterns for Playwright provided
- ✅ next/dynamic lazy loading best practices documented
- ✅ Production-ready code examples verified against official docs
- ✅ Implementation recommendations for Viably project provided

---

## References

- [Next.js 16 Playwright Testing Guide](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/02-guides/testing/playwright.mdx)
- [Playwright WebSocket Mocking API](https://playwright.dev/docs/api/class-websocketroute)
- [Next.js Metadata API](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/03-api-reference/04-functions/generate-metadata.mdx)
- [Next.js Bundle Analyzer](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/02-guides/package-bundling.mdx)
- [Next.js Dynamic Imports](https://github.com/vercel/next.js/blob/v16.1.5/docs/01-app/02-guides/lazy-loading.mdx)

---

**End of Research Document**
