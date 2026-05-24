# Lazy Loading Strategy Guide

Comprehensive guide for implementing lazy loading and code splitting in the Viably frontend application.

## Table of Contents

- [Overview](#overview)
- [When to Use Lazy Loading](#when-to-use-lazy-loading)
- [Implementation Patterns](#implementation-patterns)
  - [Next.js Dynamic Imports](#nextjs-dynamic-imports)
  - [React.lazy with Suspense](#reactlazy-with-suspense)
  - [Conditional Loading](#conditional-loading)
- [Currently Lazy-Loaded Components](#currently-lazy-loaded-components)
- [Loading States Best Practices](#loading-states-best-practices)
- [Bundle Size Analysis](#bundle-size-analysis)
- [Performance Metrics](#performance-metrics)
- [Optimization Opportunities](#optimization-opportunities)
- [Anti-Patterns](#anti-patterns)

---

## Overview

Lazy loading is a technique that defers loading of non-critical resources until they are needed. This improves:

- **Initial page load time**: Smaller initial JavaScript bundle
- **Time to Interactive (TTI)**: Faster user interaction readiness
- **Memory consumption**: Components only loaded when used
- **Network bandwidth**: Reduced data transfer for unused features

**Trade-offs**:

- **Runtime delay**: Small delay when loading components on-demand
- **Layout shift risk**: Must handle loading states properly
- **Complexity**: More code to manage loading states

**Current project stats**:
- **node_modules**: 1.1GB
- **.next cache**: 344MB
- **Largest packages**: Monaco Editor (76MB), Sentry (52MB), PostHog (32MB), Lucide Icons (45MB)

---

## When to Use Lazy Loading

### Always Lazy Load

Components that meet ANY of these criteria should be lazy loaded:

1. **Heavy third-party libraries** (>100KB gzipped)
   - Monaco Editor, Chart.js, PDF viewers
   - Video players, rich text editors
   - 3D graphics libraries, data visualization tools

2. **Route-specific components** (only used on certain pages)
   - Admin panels, settings pages
   - Authentication flows, onboarding wizards
   - Feature-specific modals and dialogs

3. **Below-the-fold content** (not visible on initial render)
   - Footer components, infinite scroll items
   - Tabs, accordions, collapsed sections
   - Modal content, tooltips, popovers

4. **Conditionally rendered content** (based on user actions)
   - Feature flags, A/B tests
   - Premium features, role-based components
   - Device-specific components (mobile vs desktop)

### Never Lazy Load

Components that should NOT be lazy loaded:

1. **Above-the-fold critical content**
   - Hero sections, navigation bars
   - Critical UI elements (buttons, forms on landing page)
   - SEO-critical content

2. **Small components** (<10KB)
   - Icon components, badges, labels
   - Simple UI primitives (Button, Input, Card)
   - Utility components with no dependencies

3. **Frequently reused components**
   - Layout components, common wrappers
   - Shared UI components across many routes
   - Components that would be downloaded anyway

---

## Implementation Patterns

### Next.js Dynamic Imports

**Recommended for most use cases in this project.**

Next.js 15+ provides `next/dynamic` for easy lazy loading with SSR support.

#### Basic Dynamic Import

```typescript
import dynamic from 'next/dynamic';
import { Shimmer } from '@/components/ui/shimmer';

// Lazy load a component with loading state
const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
  loading: () => <Shimmer height="400px" className="rounded-xl" />,
  ssr: false, // Disable SSR if component is client-only
});

export function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <HeavyComponent />
    </div>
  );
}
```

#### Dynamic Import with Named Export

```typescript
import dynamic from 'next/dynamic';

// Import a named export
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  {
    loading: () => <div>Loading editor...</div>,
    ssr: false,
  }
);
```

#### Dynamic Import with Props

```typescript
import dynamic from 'next/dynamic';

// Type-safe props with generics
const CodeEditor = dynamic<{ code: string; language: string }>(
  () => import('@/components/code-editor'),
  { ssr: false }
);

export function Page() {
  return <CodeEditor code="console.log('hi')" language="javascript" />;
}
```

#### Conditional Dynamic Import

```typescript
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Only load when modal is opened
const SettingsModal = dynamic(() => import('@/components/settings-modal'), {
  loading: () => <div>Loading settings...</div>,
});

export function Toolbar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>Settings</button>
      {showSettings && <SettingsModal />}
    </div>
  );
}
```

### React.lazy with Suspense

**Use for React-only projects or when Next.js dynamic is not available.**

```typescript
import { lazy, Suspense } from 'react';
import { Shimmer } from '@/components/ui/shimmer';

// Lazy load component
const HeavyChart = lazy(() => import('@/components/heavy-chart'));

export function Dashboard() {
  return (
    <Suspense fallback={<Shimmer height="400px" />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

#### Preloading Components

```typescript
import { lazy } from 'react';

const Modal = lazy(() => import('@/components/modal'));

// Preload on hover (before user clicks)
function Button() {
  return (
    <button
      onMouseEnter={() => {
        // Webpack/Vite will start downloading the chunk
        import('@/components/modal');
      }}
    >
      Open Modal
    </button>
  );
}
```

### Conditional Loading

**Load analytics and monitoring tools only in production.**

```typescript
// lib/posthog.ts
export async function initPostHog() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('PostHog disabled in development');
    return null;
  }

  // Dynamic import - 32MB saved in development
  const { default: posthog } = await import('posthog-js');

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  return posthog;
}
```

```typescript
// lib/sentry.ts
export async function initSentry() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Dynamic import - 52MB saved in development
  const Sentry = await import('@sentry/nextjs');

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}
```

```typescript
// app/providers.tsx
'use client';

import { useEffect } from 'react';

export function AnalyticsProvider({ children }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Load analytics only in production
      import('@/lib/posthog').then(({ initPostHog }) => initPostHog());
      import('@/lib/sentry').then(({ initSentry }) => initSentry());
    }
  }, []);

  return <>{children}</>;
}
```

---

## Currently Lazy-Loaded Components

### Status: NONE (as of 2026-02-08)

**No components are currently using lazy loading.**

### Immediate Candidates for Lazy Loading

Based on bundle size analysis, these should be lazy loaded:

#### 1. Monaco Editor (CRITICAL - 76MB)

**Current usage**: `components/projects/code-viewer.tsx`

**Problem**: Monaco Editor loads on every page that imports CodeViewer, even if not used.

**Solution**: Replace with `prism-react-renderer` (already installed) or lazy load Monaco.

**Option A: Lazy Load Monaco** (Quick fix, ~70MB saved)

```typescript
// components/projects/code-viewer-monaco.tsx (NEW)
'use client';

import dynamic from 'next/dynamic';
import { Shimmer } from '@/components/ui/shimmer';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => ({ default: mod.Editor })),
  {
    loading: () => <Shimmer height="100%" className="rounded-lg" />,
    ssr: false,
  }
);

export function CodeViewerMonaco({ code, language }) {
  return (
    <MonacoEditor
      value={code}
      language={language}
      theme="vs-dark"
      options={{ readOnly: true }}
    />
  );
}
```

**Option B: Replace with Prism** (Best long-term solution)

```typescript
// components/projects/code-viewer-prism.tsx (NEW)
'use client';

import { Highlight, themes } from 'prism-react-renderer';

export function CodeViewerPrism({ code, language }) {
  return (
    <Highlight theme={themes.vsDark} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="line-number">{i + 1}</span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
```

**See**: [Memory Optimization Report](/.tmp/current/memory-optimization-report.md) for detailed analysis.

#### 2. YouTube Embed (Already optimized!)

**Current usage**: `components/video/lite-youtube.tsx`

**Status**: Already uses lazy loading pattern (thumbnail → iframe on click).

**No action needed** - this is a good reference implementation.

#### 3. Chart/Visualization Components (If any)

**Not currently used, but plan ahead:**

```typescript
// Future: components/dashboard/charts.tsx
import dynamic from 'next/dynamic';
import { Shimmer } from '@/components/ui/shimmer';

const RevenueChart = dynamic(() => import('./revenue-chart'), {
  loading: () => <Shimmer height="300px" className="rounded-xl" />,
  ssr: false,
});

const UserActivityChart = dynamic(() => import('./user-activity-chart'), {
  loading: () => <Shimmer height="300px" className="rounded-xl" />,
  ssr: false,
});
```

#### 4. Settings and Modal Components

**Current usage**: Multiple modals across the app.

**Recommendation**: Lazy load modals that are opened on user action.

```typescript
// components/settings/buy-credits-modal.tsx
// Before (loads immediately):
import { BuyCreditsModal } from '@/components/settings/buy-credits-modal';

// After (loads on button click):
import dynamic from 'next/dynamic';

const BuyCreditsModal = dynamic(
  () => import('@/components/settings/buy-credits-modal'),
  { ssr: false }
);

export function CreditBalance() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowModal(true)}>Buy Credits</button>
      {showModal && <BuyCreditsModal onClose={() => setShowModal(false)} />}
    </>
  );
}
```

---

## Loading States Best Practices

### Use Existing Shimmer Component

The project has a reusable `Shimmer` component for loading states.

```typescript
import { Shimmer } from '@/components/ui/shimmer';

// Match the dimensions of the component being loaded
<Shimmer height="400px" className="rounded-xl" />
<Shimmer height="100%" width="100%" />
```

### Skeleton Screens

For complex layouts, create specific skeleton screens:

```typescript
// components/projects/project-skeleton.tsx
export function ProjectSkeleton() {
  return (
    <div className="space-y-4">
      <Shimmer height="60px" className="rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <Shimmer height="200px" className="rounded-lg" />
        <Shimmer height="200px" className="rounded-lg" />
        <Shimmer height="200px" className="rounded-lg" />
      </div>
    </div>
  );
}

// Usage with dynamic import
const ProjectList = dynamic(() => import('./project-list'), {
  loading: () => <ProjectSkeleton />,
});
```

### Suspense Boundaries

Use React Suspense to handle multiple loading states at once:

```typescript
import { Suspense } from 'react';

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Load multiple components in parallel */}
      <Suspense fallback={<Shimmer height="200px" />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<Shimmer height="400px" />}>
        <RecentProjects />
      </Suspense>

      <Suspense fallback={<Shimmer height="300px" />}>
        <ActivityChart />
      </Suspense>
    </div>
  );
}
```

### Error Boundaries

Always wrap lazy-loaded components in error boundaries:

```typescript
// components/generation/error-boundary.tsx (already exists)
import { ErrorBoundary } from '@/components/generation/error-boundary';

export function Page() {
  return (
    <ErrorBoundary fallback={<div>Failed to load component</div>}>
      <Suspense fallback={<Shimmer height="400px" />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## Bundle Size Analysis

### Current Bundle Breakdown

Run this command to analyze the bundle:

```bash
cd frontend
ANALYZE=true npm run build
```

This generates an interactive bundle analyzer at `.next/analyze/`.

### Key Metrics to Track

1. **Initial bundle size**: Should be <200KB gzipped for fast load
2. **Route-specific chunks**: Each route should have its own chunk
3. **Shared chunks**: Common dependencies should be shared
4. **Largest dependencies**: Identify heavy packages to lazy load

### Expected Improvements

After implementing lazy loading for Monaco Editor:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| node_modules | 1.1GB | ~1.03GB | -70MB |
| Initial bundle | TBD | TBD | -70MB |
| TTI (Time to Interactive) | TBD | TBD | ~15-20% faster |
| Page load time | TBD | TBD | ~10-15% faster |

### Measuring Bundle Size

```bash
# Check package size before installing
npx bundle-phobia <package-name>

# Example: Check monaco-editor size
npx bundle-phobia monaco-editor
# Result: 76MB unpacked, ~1.2MB gzipped

# Find duplicate dependencies
npm ls <package-name>

# Clean up unused dependencies
npx depcheck
```

---

## Performance Metrics

### Lighthouse Scores Target

- **Performance**: >90
- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.8s
- **Total Blocking Time (TBT)**: <200ms

### Measuring Performance

```typescript
// lib/performance.ts
export function measureComponentLoad(componentName: string) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${componentName} loaded in ${duration.toFixed(2)}ms`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // posthog.capture('component_load', { componentName, duration });
    }
  };
}

// Usage with dynamic import
const HeavyComponent = dynamic(
  () => {
    const measure = measureComponentLoad('HeavyComponent');
    return import('@/components/heavy').then((mod) => {
      measure();
      return mod;
    });
  },
  { ssr: false }
);
```

### Real User Monitoring

Track lazy loading performance in production:

```typescript
// app/providers.tsx
'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Track route changes and chunk loads
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('/_next/')) {
          console.log(`Chunk loaded: ${entry.name}, duration: ${entry.duration}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return null;
}
```

---

## Optimization Opportunities

### Quick Wins (15 minutes, ~50MB saved)

**Priority 1: Conditional loading for dev tools**

```typescript
// next.config.ts
const isDev = process.env.NODE_ENV === 'development';

const config: NextConfig = {
  // ... other config
};

// Only wrap with Sentry in production
export default isDev ? config : withSentryConfig(config, sentryOptions);
```

**Priority 2: Move dev-only packages to devDependencies**

```bash
npm install -D react-email @react-email/components @playwright/test
```

**Priority 3: Clean up duplicates**

```bash
npm dedupe
npm prune
```

### Medium Effort (2-3 hours, ~100MB saved)

**Priority 1: Replace Monaco Editor with Prism** (RECOMMENDED)

See [Option B above](#1-monaco-editor-critical---76mb) for implementation.

**Priority 2: Lazy load all modals and dialogs**

```typescript
// components/modals/index.ts
import dynamic from 'next/dynamic';

export const BuyCreditsModal = dynamic(() => import('./buy-credits-modal'), { ssr: false });
export const DeleteProjectDialog = dynamic(() => import('./delete-project-dialog'), { ssr: false });
export const SettingsModal = dynamic(() => import('./settings-modal'), { ssr: false });
```

**Priority 3: Optimize icon imports**

```bash
# Check for bad imports
grep -r "import.*\*.*lucide-react" frontend/

# Fix by using named imports
# Bad:  import * as Icons from 'lucide-react'
# Good: import { Settings, User, Home } from 'lucide-react'
```

### Long-term (1 week, architectural changes)

**Priority 1: Route-based code splitting**

Ensure each route has its own chunk in Next.js App Router (should work by default).

**Priority 2: Implement progressive web app (PWA)**

Cache static assets and route chunks for offline support.

**Priority 3: Image optimization**

Use Next.js Image component with proper sizing and formats.

---

## Anti-Patterns

### Don't: Lazy Load Everything

```typescript
// BAD: Lazy loading small, frequently used components
const Button = dynamic(() => import('@/components/ui/button'), { ssr: false });
const Card = dynamic(() => import('@/components/ui/card'), { ssr: false });

// These are small (<5KB) and used everywhere.
// Lazy loading them adds unnecessary runtime cost.
```

### Don't: Lazy Load Above-the-Fold Content

```typescript
// BAD: Lazy loading the hero section (visible immediately)
const Hero = dynamic(() => import('@/components/landing/hero'), {
  loading: () => <Shimmer height="600px" />,
});

// This delays LCP and makes the page feel slow.
// Load critical content synchronously.
```

### Don't: Forget Loading States

```typescript
// BAD: No loading state
const Modal = dynamic(() => import('./modal'));

// User sees nothing while modal loads (confusing UX)

// GOOD: Always provide a loading state
const Modal = dynamic(() => import('./modal'), {
  loading: () => <div>Loading...</div>,
});
```

### Don't: Lazy Load on Every Render

```typescript
// BAD: Dynamic import inside component body
function Page() {
  const Modal = dynamic(() => import('./modal')); // Re-creates on every render!
  return <Modal />;
}

// GOOD: Dynamic import at module level
const Modal = dynamic(() => import('./modal'));

function Page() {
  return <Modal />;
}
```

### Don't: Lazy Load Dependencies of Critical Components

```typescript
// BAD: Lazy loading a utility function used in critical path
const formatDate = dynamic(() => import('@/lib/format-date'));

// Utilities should be tree-shaken by the bundler, not lazy loaded.
// Only lazy load UI components and heavy libraries.
```

---

## Additional Resources

- [Next.js Dynamic Imports Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [Web.dev: Code Splitting Guide](https://web.dev/code-splitting-suspense/)
- [Bundle Analyzer Tool](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Bundlephobia: Check Package Size](https://bundlephobia.com/)

---

## Summary

### Key Takeaways

1. **Lazy load heavy third-party libraries** (Monaco Editor: 76MB)
2. **Lazy load route-specific components** (settings, modals, admin panels)
3. **Lazy load below-the-fold content** (footers, tabs, accordions)
4. **Always provide loading states** (use `Shimmer` component)
5. **Measure before and after** (use `ANALYZE=true npm run build`)
6. **Conditional loading for dev tools** (PostHog, Sentry in production only)

### Implementation Checklist

- [ ] Replace Monaco Editor with Prism or lazy load it
- [ ] Lazy load all modal and dialog components
- [ ] Add conditional loading for PostHog and Sentry
- [ ] Optimize Lucide icon imports (named imports only)
- [ ] Move dev-only packages to devDependencies
- [ ] Run `npm dedupe` and `npm prune`
- [ ] Run bundle analysis: `ANALYZE=true npm run build`
- [ ] Measure performance improvements with Lighthouse
- [ ] Add performance monitoring in production

### Expected Results

- **Bundle size reduction**: ~100-150MB (node_modules)
- **Initial load time improvement**: 10-20%
- **Time to Interactive improvement**: 15-25%
- **Memory usage reduction**: 20-30%

---

**Last updated**: 2026-02-08
**Next review**: After implementing Monaco Editor optimization (T054)
