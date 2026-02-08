# Memory Optimization Guide

**Last Updated**: 2026-02-08
**Target Audience**: Frontend developers, DevOps engineers, QA testers
**Estimated Reading Time**: 15 minutes

---

## Quick Start for Developers

**Want to enable memory monitoring right now?**

1. Add `<MemoryMonitor />` to `frontend/app/layout.tsx` (inside `<body>`, after `<Toaster />`)
2. Run `npm run dev` in the `frontend` directory
3. Look for a memory panel in the bottom-right corner of your browser
4. Click "Start" to begin tracking memory usage

**That's it!** See [Development Setup](#development-setup-quick-start) for detailed instructions.

---

## Table of Contents

1. [Overview](#overview)
2. [Memory Monitoring Tools](#memory-monitoring-tools)
   - [Development Setup (Quick Start)](#development-setup-quick-start)
   - [MemoryMonitor Component](#memorymonitor-component)
   - [Browser DevTools](#browser-devtools)
3. [Best Practices](#best-practices)
4. [Common Memory Leaks](#common-memory-leaks)
5. [Optimization Strategies](#optimization-strategies)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Performance Tips](#performance-tips)
8. [Technical Reference](#technical-reference)

---

## Overview

### What is Memory Optimization?

Memory optimization ensures your application uses RAM efficiently by:

- **Preventing memory leaks** - Resources that are allocated but never released
- **Reducing bundle size** - Smaller JavaScript files mean less memory usage
- **Cleaning up properly** - Disposing of components and resources when no longer needed
- **Monitoring usage** - Tracking memory consumption to identify issues early

### Why Does It Matter?

Poor memory management leads to:

- Slow, unresponsive UI after prolonged use
- Browser crashes on low-end devices
- Poor user experience and frustrated users
- Wasted server resources (in SSR scenarios)

### Current Status

The Viably frontend has been optimized to minimize memory usage:

- **Development**: ~1.1GB node_modules, 344MB .next cache
- **Production**: Aggressive tree-shaking and code splitting
- **Runtime**: Automatic cleanup of subscriptions and resources
- **Monitoring**: Built-in MemoryMonitor component for development

---

## Memory Monitoring Tools

### Development Setup (Quick Start)

To enable memory monitoring in your local development environment:

#### Step 1: Add MemoryMonitor to Root Layout

Edit `frontend/app/layout.tsx`:

```tsx
import { MemoryMonitor } from '@/components/dev/MemoryMonitor';

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider>
            {children}
            <Toaster />
            {/* Add MemoryMonitor at the end */}
            <MemoryMonitor />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
```

**Important Notes:**
- Place `<MemoryMonitor />` as the last child in `<body>` for proper z-index layering
- Component is automatically hidden in production builds (only shows in `NODE_ENV=development`)
- No additional configuration needed - it works out of the box

#### Step 2: Start Development Server

```bash
cd frontend
npm run dev
```

You should see a memory monitor panel in the bottom-right corner of your browser.

#### Step 3: Enable Chrome DevTools Memory Profiling (Optional)

For more detailed memory analysis:

```bash
# macOS/Linux
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:3000

# Windows
chrome.exe --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:3000
```

This enables:
- Precise memory measurements (without rounding)
- Manual garbage collection via DevTools Console

#### Development Mode Warnings

The memory cleanup system emits warnings in development mode when resources aren't properly cleaned up:

**Example warning:**
```
⚠️ Memory Leak Warning: Uncleaned Event Listener in ProjectEditor
  Event listener was not cleaned up before unmount
  Details: {
    eventType: "resize",
    target: "window",
    registeredAt: "2026-02-08T12:34:56.789Z"
  }
```

**What to do:**
1. Identify the component mentioned in the warning
2. Add cleanup using `useComponentCleanup` hook (see [Best Practices](#best-practices))
3. Verify the warning is gone after implementing the fix

**These warnings are intentionally verbose** - treat them as errors and fix immediately to prevent production memory leaks.

### MemoryMonitor Component

The `MemoryMonitor` component provides real-time memory visualization during development.

#### Features

- **Real-time stats**: Current, peak, and average memory usage (MB)
- **Growth tracking**: Memory growth rate (MB/minute)
- **Leak detection**: Automatic warning when growth exceeds 1 MB/min
- **Visual indicators**: Animated status dot and color-coded warnings
- **Zero production impact**: Automatically removed from production builds

#### Installation Options

**Global monitoring** (recommended - add to root layout):

```tsx
// app/layout.tsx
import { MemoryMonitor } from '@/components/dev/MemoryMonitor';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <MemoryMonitor />
      </body>
    </html>
  );
}
```

**Page-specific monitoring** (for testing specific pages):

```tsx
// app/projects/[id]/page.tsx
import { MemoryMonitor } from '@/components/dev/MemoryMonitor';

export default function ProjectPage() {
  return (
    <>
      <ProjectContent />
      <MemoryMonitor />
    </>
  );
}
```

#### Using the Monitor

1. **Start monitoring**: Click the "Start" button (turns red when active)
2. **Watch stats**: Monitor current, peak, and average memory usage
3. **Check growth rate**: Blue text indicates normal growth, red indicates potential leak
4. **Investigate warnings**: Red banner appears when leak detected (>1 MB/min growth)
5. **Clear history**: Click "Clear" to reset statistics
6. **Stop monitoring**: Click "Stop" to pause tracking

#### Understanding the Metrics

| Metric | Description | Good Range | Warning Range |
|--------|-------------|------------|---------------|
| **Current** | Memory currently in use | <80 MB | >120 MB |
| **Peak** | Highest memory usage since start | <100 MB | >150 MB |
| **Average** | Mean memory usage | <70 MB | >100 MB |
| **Growth** | MB/minute increase rate | <0.5 MB/min | >1 MB/min |

**Growth Rate Colors:**
- **Blue**: Normal growth (<1 MB/min) - acceptable
- **Red**: High growth (>1 MB/min) - potential memory leak

#### Browser Compatibility

- **Chrome/Edge**: Full support via `performance.memory` API
- **Firefox/Safari**: Graceful degradation with console warning (feature not available)

### Browser DevTools

For deeper memory profiling:

#### Chrome DevTools Memory Tab

1. **Heap Snapshots**:
   - Open DevTools > Memory tab
   - Select "Heap snapshot" > Take snapshot
   - Repeat after using app for a while
   - Compare snapshots to find retained objects

2. **Allocation Timeline**:
   - Select "Allocation instrumentation on timeline"
   - Click "Start" and use the app
   - Blue bars show allocations - look for growing bars

3. **Allocation Sampling**:
   - Select "Allocation sampling"
   - Lightweight profiling for production-like scenarios

#### Firefox Memory Tools

1. Open DevTools > Memory tab
2. Take snapshots before/after navigation
3. Compare snapshots to identify leaks

#### Recommended Workflow

```bash
# 1. Enable memory profiling flags (Chrome)
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:3000

# 2. Take baseline snapshot
# - Open DevTools > Memory > Take snapshot

# 3. Use the app normally for 10-15 minutes
# - Navigate between pages
# - Open/close modals
# - Use all major features

# 4. Force garbage collection
# - DevTools > Memory > Click GC button (trash icon)
# - Wait 2-3 seconds

# 5. Take final snapshot
# - Compare with baseline
# - Look for growing objects (monaco, editor, websocket, etc.)

# 6. Acceptable results:
# - <20% memory growth after GC
# - No detached DOM nodes
# - No retained listeners/timers
```

---

## Best Practices

### 1. Always Clean Up Subscriptions

Use the `useComponentCleanup` hook for all subscriptions:

```tsx
import { useComponentCleanup } from '@/hooks/useComponentCleanup';

function MyComponent() {
  const { registerSubscription } = useComponentCleanup('MyComponent');

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized');
    };

    // Register cleanup BEFORE adding listener
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
      metadata: { event: 'resize', target: 'window' },
    });

    // Add listener
    window.addEventListener('resize', handleResize);
  }, [registerSubscription]);

  return <div>My Component</div>;
}
```

**Key points**:
- Register cleanup BEFORE adding subscription
- Use same function reference for add and remove
- Add descriptive metadata for debugging

### 2. Dispose External Resources

Always dispose libraries like Monaco Editor, Chart.js, etc:

```tsx
import { useComponentCleanup } from '@/hooks/useComponentCleanup';
import { loader } from '@monaco-editor/react';

function CodeEditor() {
  const { registerResource } = useComponentCleanup('CodeEditor');
  const editorRef = useRef(null);

  useEffect(() => {
    loader.init().then((monaco) => {
      const editor = monaco.editor.create(containerRef.current, {
        value: 'console.log("Hello")',
        language: 'typescript',
      });

      editorRef.current = editor;

      // Register disposal
      registerResource({
        type: 'monaco-editor',
        createdAt: Date.now(),
        disposeFn: () => editor?.dispose(),
        metadata: { language: 'typescript' },
      });
    });
  }, [registerResource]);

  return <div ref={containerRef} />;
}
```

### 3. Monitor Development Warnings

The cleanup hook emits warnings when resources aren't cleaned up:

```
⚠️ Memory Leak Warning: Uncleaned Event Listener in MyComponent
  Event listener was not cleaned up before unmount
  Details: {
    eventType: "resize",
    target: "window",
    registeredAt: "2026-02-08T12:34:56.789Z"
  }
```

**Action**: Treat these warnings as errors. Investigate and fix immediately.

### 4. Use Lazy Loading

Defer heavy components until needed:

```tsx
// Instead of direct import:
// import HeavyEditor from './HeavyEditor';

// Use dynamic import:
const HeavyEditor = dynamic(() => import('./HeavyEditor'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 5. Optimize Dependencies

Before installing a new package:

```bash
# Check package size
npx bundle-phobia <package-name>

# Prefer smaller alternatives:
# - lucide-react (45MB) → @lucide/react (smaller tree-shaking)
# - moment (66KB) → date-fns (14KB with tree-shaking)
# - lodash (71KB) → lodash-es (individual imports)
```

---

## Common Memory Leaks

### 1. Uncleaned Event Listeners

**Problem**: Event listeners on `window` or `document` persist after unmount.

**Example leak**:
```tsx
// ❌ BAD: Listener never removed
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  // Missing cleanup!
}, []);
```

**Fix**:
```tsx
// ✅ GOOD: Proper cleanup
const { registerSubscription } = useComponentCleanup('MyComponent');

useEffect(() => {
  const handleScroll = () => { /* ... */ };

  registerSubscription({
    type: 'event',
    createdAt: Date.now(),
    cleanupFn: () => window.removeEventListener('scroll', handleScroll),
  });

  window.addEventListener('scroll', handleScroll);
}, [registerSubscription]);
```

### 2. Undisposed Timers

**Problem**: Timers continue running after component unmounts.

**Example leak**:
```tsx
// ❌ BAD: Timer never cleared
useEffect(() => {
  setInterval(() => {
    console.log('Still running!');
  }, 1000);
  // Missing cleanup!
}, []);
```

**Fix**:
```tsx
// ✅ GOOD: Proper cleanup
const { registerSubscription } = useComponentCleanup('MyComponent');

useEffect(() => {
  const intervalId = setInterval(() => {
    console.log('Running...');
  }, 1000);

  registerSubscription({
    type: 'interval',
    createdAt: Date.now(),
    cleanupFn: () => clearInterval(intervalId),
  });
}, [registerSubscription]);
```

### 3. Open WebSocket Connections

**Problem**: WebSocket connections not closed on unmount.

**Example leak**:
```tsx
// ❌ BAD: WebSocket never closed
useEffect(() => {
  const ws = new WebSocket('ws://example.com');
  // Missing cleanup!
}, []);
```

**Fix**:
```tsx
// ✅ GOOD: Proper cleanup
const { registerResource } = useComponentCleanup('MyComponent');

useEffect(() => {
  const ws = new WebSocket('ws://example.com');

  registerResource({
    type: 'websocket',
    createdAt: Date.now(),
    disposeFn: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    },
  });
}, [registerResource]);
```

### 4. Monaco Editor Instances

**Problem**: Monaco Editor instances consume ~5-10MB each and must be disposed.

**Example leak**:
```tsx
// ❌ BAD: Editor never disposed
useEffect(() => {
  const editor = monaco.editor.create(container, {...});
  // Missing cleanup!
}, []);
```

**Fix**:
```tsx
// ✅ GOOD: Proper disposal
const { registerResource } = useComponentCleanup('CodeEditor');

useEffect(() => {
  loader.init().then((monaco) => {
    const model = monaco.editor.createModel(code, 'typescript');
    const editor = monaco.editor.create(container, { model });

    // Dispose model
    registerResource({
      type: 'monaco-model',
      createdAt: Date.now(),
      disposeFn: () => model?.dispose(),
    });

    // Dispose editor
    registerResource({
      type: 'monaco-editor',
      createdAt: Date.now(),
      disposeFn: () => editor?.dispose(),
    });
  });
}, [registerResource]);
```

---

## Optimization Strategies

### Bundle Size Optimization

#### 1. Replace Heavy Dependencies

| Heavy Package | Size | Lightweight Alternative | Size | Savings |
|---------------|------|-------------------------|------|---------|
| `monaco-editor` | 76MB | `prism-react-renderer` | ~500KB | ~75MB |
| `moment` | 66KB | `date-fns` | 14KB | ~52KB |
| `lodash` | 71KB | `lodash-es` (individual) | ~5-10KB | ~60KB |
| `axios` | 14KB | `ky` or native `fetch` | 5KB / 0KB | ~14KB |

**Action**: Review your dependencies and replace heavy ones.

```bash
# Quick check for heavy packages
npm ls --depth=0 | grep -E "(moment|lodash|axios)"

# Replace with lighter alternatives
npm remove moment
npm install date-fns

npm remove lodash
npm install lodash-es
```

#### 2. Enable Tree-Shaking

**Good import** (tree-shakeable):
```tsx
// ✅ Named imports
import { Button, Input } from '@/components/ui';
import { formatDate, parseDate } from 'date-fns';
```

**Bad import** (includes everything):
```tsx
// ❌ Namespace imports
import * as UI from '@/components/ui';
import * as dateFns from 'date-fns';
```

#### 3. Analyze Bundle

```bash
# Build with bundle analyzer
ANALYZE=true npm run build

# Opens interactive bundle visualization
# Look for:
# - Unexpectedly large chunks
# - Duplicate dependencies
# - Unused code
```

### Runtime Optimization

#### 1. Use React.memo for Heavy Components

```tsx
// Prevent re-renders when props haven't changed
const HeavyList = memo(function HeavyList({ items }: Props) {
  return (
    <ul>
      {items.map(item => <HeavyItem key={item.id} item={item} />)}
    </ul>
  );
});
```

#### 2. Implement Virtual Scrolling

For long lists (>100 items):

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: Props) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // estimated row height
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Debounce Heavy Operations

```tsx
import { useDebouncedCallback } from 'use-debounce';

function SearchComponent() {
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      // Heavy search operation
      performSearch(value);
    },
    500 // 500ms delay
  );

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

---

## Troubleshooting Guide

### Issue: Memory Grows Over Time

**Symptoms**:
- MemoryMonitor shows increasing memory usage
- App becomes slow after 30+ minutes
- Browser tab crashes eventually

**Diagnosis**:

1. Check MemoryMonitor for leak warning (red banner)
2. Open browser console for cleanup warnings
3. Take heap snapshots and compare

**Common Causes**:

- Uncleaned event listeners (see console warnings)
- Undisposed Monaco Editor instances
- WebSocket connections not closed
- Timers/intervals still running

**Solution**:

1. Fix all cleanup warnings in console
2. Add `useComponentCleanup` to affected components
3. Verify with MemoryMonitor (growth rate should be <0.5 MB/min)

### Issue: High Initial Memory Usage

**Symptoms**:
- Page takes long to load
- MemoryMonitor shows high "Current" value immediately
- DevTools shows large bundle size

**Diagnosis**:

```bash
# Build and analyze
ANALYZE=true npm run build

# Check bundle size
npm run build
# Look for large chunk files in .next/static/chunks/
```

**Common Causes**:

- Heavy dependencies not code-split
- Large data loaded upfront
- All components rendered at once

**Solution**:

1. Use dynamic imports for heavy components
2. Implement pagination for large datasets
3. Replace heavy dependencies (see [Bundle Size Optimization](#bundle-size-optimization))

### Issue: Development Mode Warnings

**Symptoms**:

Console shows:
```
⚠️ Component MyComponent unmounted with active subscription: event
```

**Solution**:

1. Find the component mentioned in warning
2. Locate the subscription (event, timer, websocket, etc.)
3. Add cleanup registration:

```tsx
const { registerSubscription } = useComponentCleanup('MyComponent');

registerSubscription({
  type: 'event', // or 'timer', 'websocket', etc.
  createdAt: Date.now(),
  cleanupFn: () => { /* cleanup code */ },
});
```

4. Navigate away from component again
5. Verify warning is gone

### Issue: Monaco Editor Memory Leak

**Symptoms**:
- Memory grows when opening/closing code editor
- DevTools shows retained `IStandaloneCodeEditor` instances

**Verification**:

```bash
# Run Monaco-specific test
cd frontend/scripts
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" \
  file://$(pwd)/test-monaco-memory.html

# Follow test instructions in browser
# Expected: >90% memory released after GC
```

**Solution**:

Use the `useMonacoEditor` hook (includes automatic disposal):

```tsx
import { useMonacoEditor } from '@/hooks/useMonacoEditor';

function CodeEditor() {
  const { editor, monaco } = useMonacoEditor({
    value: 'console.log("Hello")',
    language: 'typescript',
  });

  // No manual cleanup needed - hook handles it
  return <div ref={containerRef} />;
}
```

---

## Performance Tips

### Development Environment

```bash
# 1. Clean caches regularly
rm -rf .next/cache
npm cache clean --force

# 2. Deduplicate dependencies
npm dedupe
npm prune

# 3. Disable source maps (if not debugging)
echo "GENERATE_SOURCEMAP=false" >> .env.local

# 4. Move dev-only packages to devDependencies
npm install -D @playwright/test react-email @react-email/components
```

### Production Build

```bash
# 1. Enable all optimizations
npm run build

# 2. Analyze bundle
ANALYZE=true npm run build

# 3. Test production build locally
npm run start

# 4. Verify in DevTools:
# - No source maps (unless explicitly enabled)
# - Console.log statements removed
# - Bundle size reduced
```

### Monitoring in Production

```typescript
// next.config.ts - conditional Sentry loading
const isDev = process.env.NODE_ENV === 'development';

export default isDev
  ? config // No Sentry in dev
  : withSentryConfig(config, { /* ... */ });
```

```typescript
// lib/posthog.ts - lazy PostHog initialization
export async function initPostHog() {
  if (process.env.NODE_ENV === 'production') {
    const { default: posthog } = await import('posthog-js');
    posthog.init(/* ... */);
  }
}
```

### Memory Budget Guidelines

| Context | Target | Acceptable | Warning |
|---------|--------|------------|---------|
| Initial Load | <50MB | 50-100MB | >100MB |
| After 30min | <80MB | 80-120MB | >120MB |
| After 4 hours | <100MB | 100-150MB | >150MB |
| Growth Rate | <0.5 MB/min | 0.5-1 MB/min | >1 MB/min |

---

## Technical Reference

### Hook: useComponentCleanup

Full documentation: [`frontend/lib/memory/README.md`](/home/alex/PycharmProjects/viably/frontend/lib/memory/README.md)

**Quick reference**:

```tsx
const {
  registerSubscription,    // Register event/timer/interval cleanup
  registerResource,        // Register external resource disposal
  cleanupSubscription,     // Manually cleanup by ID
  disposeResource,         // Manually dispose by ID
  getActiveSubscriptions,  // Get active subscriptions
  getUndisposedResources,  // Get undisposed resources
} = useComponentCleanup('ComponentName');
```

### Component: MemoryMonitor

Full documentation: [`frontend/components/dev/README.md`](/home/alex/PycharmProjects/viably/frontend/components/dev/README.md)

**Props**: None (auto-configured)

**Features**:
- Real-time memory tracking
- Leak detection (>1 MB/min)
- Start/Stop/Clear controls
- Development-only (stripped from production)

### Memory Snapshot API

```tsx
import { captureMemorySnapshot } from '@/lib/memory/snapshot';

// Capture current memory state
const snapshot = captureMemorySnapshot();

console.log(snapshot.usedJSHeapSize); // Bytes
console.log(snapshot.totalJSHeapSize); // Bytes
console.log(snapshot.jsHeapSizeLimit); // Bytes
```

### Lifecycle Tracking (Advanced)

```tsx
import { withLifecycleTracking } from '@/lib/memory/withLifecycleTracking';

// Wrap component for detailed lifecycle logging
const TrackedComponent = withLifecycleTracking(MyComponent, {
  componentName: 'MyComponent',
  logLevel: 'debug',
});
```

---

## Additional Resources

### Internal Documentation

- **Technical Spec**: `specs/020-memory-optimization/spec.md`
- **Quickstart Guide**: `specs/020-memory-optimization/quickstart.md`
- **Memory Cleanup API**: `frontend/lib/memory/README.md`
- **Baseline Report**: `docs/memory-baseline-2026-02-08.md`
- **Optimization Report**: `.tmp/current/memory-optimization-report.md`

### External Resources

- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [React Memory Leaks Guide](https://react.dev/learn/escape-hatches#cleanup-functions)
- [Bundle Phobia](https://bundlephobia.com/) - Package size checker
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

### Tools

- **MemoryMonitor Component**: `frontend/components/dev/MemoryMonitor.tsx`
- **Cleanup Hook**: `frontend/hooks/useComponentCleanup.ts`
- **Memory Hook**: `frontend/hooks/useMemoryMonitor.ts`
- **Monaco Test**: `frontend/scripts/test-monaco-memory.html`

---

## Support

### Getting Help

1. **Development warnings**: Check browser console for specific guidance
2. **Memory issues**: Use MemoryMonitor component to identify leaks
3. **Performance problems**: Run `ANALYZE=true npm run build` to analyze bundle
4. **Questions**: Contact the frontend team or file an issue

### Contributing

Found a memory leak? Help us fix it:

1. Reproduce the issue with MemoryMonitor
2. Take heap snapshots before/after
3. File an issue with:
   - Component name
   - Steps to reproduce
   - Memory growth rate
   - Heap snapshot comparison
4. Propose a fix using `useComponentCleanup` hook

---

**Version**: 1.0.0
**Feature**: 020-memory-optimization
**Maintained By**: Frontend Team
