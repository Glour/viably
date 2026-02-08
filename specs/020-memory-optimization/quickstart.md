# Quickstart Guide: Frontend Memory Optimization

**Feature**: 020-memory-optimization
**Date**: 2026-02-08
**Phase**: 1 - Design

## Overview

Это руководство описывает пошаговый процесс реализации оптимизации памяти во фронтенд-приложении. Следуйте этапам в указанном порядке для минимизации рисков и максимизации эффективности.

---

## Prerequisites

### Required Tools
- Chrome DevTools (Memory Profiler)
- Node.js 18+
- pnpm (package manager)

### Required Knowledge
- React 19 hooks (useEffect, useMemo, useCallback)
- Next.js 16 App Router
- TypeScript strict mode
- Memory profiling basics

---

## Phase 1: Setup & Baseline (P1 - Critical)

### Step 1.1: Install Dependencies

```bash
cd frontend

# Install new dependencies
pnpm add @tanstack/react-virtual@^3.0.0

# Install dev dependencies
pnpm add -D memlab@^1.3.0
```

### Step 1.2: Enable React Compiler

Edit `frontend/next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true, // Enable React 19 Compiler for auto-memoization
    webpackMemoryOptimizations: true, // Reduce build memory usage
  },
  // ... rest of config
};

export default nextConfig;
```

### Step 1.3: Capture Baseline Metrics

**Manual Profiling**:
1. Open application in Chrome
2. Open DevTools → Memory tab
3. Take heap snapshot (Snapshot #1 - Baseline)
4. Use application for 30 minutes (typical workflow)
5. Take heap snapshot (Snapshot #2 - After Use)
6. Compare snapshots, identify objects retained in memory

**Document Findings**:
Create `docs/memory-baseline-2026-02-08.md` with:
- Initial heap size
- Heap size after 30 min
- Growth rate (MB/min)
- Top 10 objects by retained size
- Identified potential leaks

---

## Phase 2: Component Cleanup Patterns (P1 - Critical)

### Step 2.1: Create useComponentCleanup Hook

File: `frontend/hooks/useComponentCleanup.ts`

```typescript
import { useEffect, useRef } from 'react';
import type { Subscription, ExternalResource } from '@/specs/020-memory-optimization/contracts/memory-monitoring';

export function useComponentCleanup(componentName: string) {
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const resourcesRef = useRef<Map<string, ExternalResource>>(new Map());

  const registerSubscription = (sub: Omit<Subscription, 'id' | 'cleaned'>) => {
    const id = `${componentName}-${Date.now()}-${Math.random()}`;
    subscriptionsRef.current.set(id, { ...sub, id, cleaned: false });
    return id;
  };

  const registerResource = (res: Omit<ExternalResource, 'id' | 'disposed'>) => {
    const id = `${componentName}-${Date.now()}-${Math.random()}`;
    resourcesRef.current.set(id, { ...res, id, disposed: false });
    return id;
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach((sub) => {
        if (!sub.cleaned) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `⚠️ Component ${componentName} unmounted with active subscription: ${sub.type}`,
              sub.metadata
            );
          }
          sub.cleanupFn();
        }
      });

      // Dispose resources
      resourcesRef.current.forEach((res) => {
        if (!res.disposed) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `⚠️ Component ${componentName} unmounted with undisposed resource: ${res.type}`,
              res.metadata
            );
          }
          res.disposeFn();
        }
      });

      subscriptionsRef.current.clear();
      resourcesRef.current.clear();
    };
  }, [componentName]);

  return { registerSubscription, registerResource };
}
```

### Step 2.2: Audit Existing Components

**Run Component Audit**:
```bash
# Find components with useEffect
grep -r "useEffect" frontend/components frontend/app --include="*.tsx" --include="*.ts" > component-audit.txt

# Review each component for cleanup patterns
```

**Checklist for Each Component**:
- [ ] useEffect cleanup function exists
- [ ] Event listeners removed in cleanup
- [ ] Timers/intervals cleared in cleanup
- [ ] Subscriptions cancelled in cleanup
- [ ] WebSocket disconnected in cleanup
- [ ] External resources disposed in cleanup

---

## Phase 3: Monaco Editor Cleanup (P1 - Critical)

### Step 3.1: Create useMonacoEditor Hook

File: `frontend/hooks/useMonacoEditor.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';

export function useMonacoEditor(options: {
  value: string;
  language: string;
  theme?: string;
}) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create or reuse model
    const uri = monaco.Uri.parse(`inmemory://model-${Date.now()}.${options.language}`);
    let model = monaco.editor.getModel(uri);

    if (!model) {
      model = monaco.editor.createModel(options.value, options.language, uri);
    } else {
      model.setValue(options.value);
    }

    modelRef.current = model;

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      model,
      theme: options.theme || 'vs-dark',
      automaticLayout: true,
    });

    editorRef.current = editor;
    setIsReady(true);

    // Cleanup function - CRITICAL for memory
    return () => {
      setIsReady(false);
      editorRef.current?.dispose();
      modelRef.current?.dispose();
      editorRef.current = null;
      modelRef.current = null;
    };
  }, [options.language, options.theme]); // Don't include options.value to avoid recreating editor

  const getValue = () => editorRef.current?.getValue() || '';
  const setValue = (value: string) => editorRef.current?.setValue(value);

  return {
    editor: editorRef.current,
    model: modelRef.current,
    containerRef,
    isReady,
    getValue,
    setValue,
  };
}
```

### Step 3.2: Replace Monaco Editor Usage

**Before** (Memory Leak):
```typescript
// ❌ BAD: No cleanup
<Editor value={code} language="typescript" />
```

**After** (Proper Cleanup):
```typescript
// ✅ GOOD: Auto cleanup via hook
const { containerRef, getValue, setValue } = useMonacoEditor({
  value: code,
  language: 'typescript',
});

return <div ref={containerRef} style={{ height: '600px' }} />;
```

---

## Phase 4: React Query & Zustand Configuration (P2 - High)

### Step 4.1: Configure React Query

File: `frontend/lib/api/client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data remains fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - unused data cleared after
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
  },
});

// Clear cache on logout
export function clearAllCaches() {
  queryClient.clear();
}
```

### Step 4.2: Add Reset Methods to Zustand Stores

**Pattern**:
```typescript
// ✅ GOOD: Store with reset method
import { create } from 'zustand';

interface ProjectsState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  reset: () => void; // Add reset method
}

const initialState = {
  projects: [],
};

export const useProjectsStore = create<ProjectsState>((set) => ({
  ...initialState,
  setProjects: (projects) => set({ projects }),
  reset: () => set(initialState), // Reset to initial state
}));
```

**Apply to All Stores**:
- `lib/stores/auth.ts` → add reset()
- `lib/stores/projects.ts` → add reset()
- `lib/stores/templates.ts` → add reset()
- `lib/stores/generation.ts` → add reset()

### Step 4.3: Call Reset on Logout

File: `lib/stores/auth.ts`

```typescript
import { useProjectsStore } from './projects';
import { useTemplatesStore } from './templates';
import { useGenerationStore } from './generation';
import { clearAllCaches } from '@/lib/api/client';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  logout: () => {
    // Clear Zustand stores
    set({ user: null });
    useProjectsStore.getState().reset();
    useTemplatesStore.getState().reset();
    useGenerationStore.getState().reset();

    // Clear React Query cache
    clearAllCaches();

    // Clear localStorage
    localStorage.removeItem('auth-token');
  },
}));
```

---

## Phase 5: Virtualization (P2 - High)

### Step 5.1: Install TanStack Virtual

Already installed in Phase 1.

### Step 5.2: Virtualize Templates Gallery

File: `frontend/components/features/templates/TemplateGallery.tsx`

**Before** (Renders all 500 items):
```typescript
// ❌ BAD: No virtualization
{templates.map(template => (
  <TemplateCard key={template.id} template={template} />
))}
```

**After** (Virtualizes list):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function TemplateGallery({ templates }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: templates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350, // Estimated height of TemplateCard
    overscan: 5, // Render 5 extra items outside viewport
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TemplateCard template={templates[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 6: Memory Monitoring (P4 - Low)

### Step 6.1: Create useMemoryMonitor Hook

File: `frontend/hooks/useMemoryMonitor.ts`

```typescript
import { useState, useEffect, useRef } from 'react';
import type { MemorySnapshot, MemoryStats } from '@/specs/020-memory-optimization/contracts/memory-monitoring';

export function useMemoryMonitor(options = { interval: 5000, maxSnapshots: 100 }) {
  const [snapshots, setSnapshots] = useState<MemorySnapshot[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureSnapshot = (): MemorySnapshot | null => {
    if (!('memory' in performance)) {
      console.warn('performance.memory not available');
      return null;
    }

    const memory = (performance as any).memory;

    return {
      timestamp: Date.now(),
      heapSizeUsed: memory.usedJSHeapSize,
      heapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  };

  const start = () => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    intervalRef.current = setInterval(() => {
      const snapshot = captureSnapshot();
      if (snapshot) {
        setSnapshots((prev) => {
          const updated = [...prev, snapshot];
          // Keep only last maxSnapshots
          return updated.slice(-options.maxSnapshots);
        });
      }
    }, options.interval);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  };

  const clear = () => setSnapshots([]);

  const stats: MemoryStats = {
    current: snapshots.length > 0 ? snapshots[snapshots.length - 1].heapSizeUsed / 1024 / 1024 : 0,
    peak: Math.max(...snapshots.map((s) => s.heapSizeUsed)) / 1024 / 1024,
    average: snapshots.reduce((sum, s) => sum + s.heapSizeUsed, 0) / snapshots.length / 1024 / 1024 || 0,
    growthRate: 0, // Calculate based on first and last snapshot
    leakDetected: false, // Implement leak detection logic
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return {
    currentSnapshot: snapshots[snapshots.length - 1] || null,
    snapshots,
    stats,
    isMonitoring,
    start,
    stop,
    clear,
    captureSnapshot,
  };
}
```

### Step 6.2: Add Memory Monitor to Dev Tools

File: `frontend/components/dev/MemoryMonitor.tsx`

```typescript
'use client';

import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';

export function MemoryMonitor() {
  if (process.env.NODE_ENV !== 'development') return null;

  const { stats, isMonitoring, start, stop } = useMemoryMonitor();

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Memory Monitor</h3>
      <div>Current: {stats.current.toFixed(2)} MB</div>
      <div>Peak: {stats.peak.toFixed(2)} MB</div>
      <div>Average: {stats.average.toFixed(2)} MB</div>
      <button onClick={isMonitoring ? stop : start} className="mt-2 px-2 py-1 bg-blue-500 rounded">
        {isMonitoring ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
```

---

## Phase 7: Testing (P4 - Low)

### Step 7.1: Create Memory Leak Tests with MemLab

File: `frontend/e2e/memory/memory-leak.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { checkLeaks } from 'memlab';

test.describe('Memory Leak Detection', () => {
  test('should not leak memory on navigation', async ({ page }) => {
    await page.goto('/dashboard');

    // Perform navigation cycle 10 times
    for (let i = 0; i < 10; i++) {
      await page.goto('/templates');
      await page.goto('/projects');
      await page.goto('/dashboard');
    }

    // Run MemLab leak detection
    const leaks = await checkLeaks(async (page) => {
      await page.goto('/dashboard');
      await page.goto('/templates');
      await page.goto('/dashboard');
    });

    expect(leaks.length).toBe(0);
  });

  test('should not leak memory on modal open/close', async ({ page }) => {
    await page.goto('/templates');

    // Open and close modal 50 times
    for (let i = 0; i < 50; i++) {
      await page.click('[data-testid="template-card"]');
      await page.click('[data-testid="close-modal"]');
    }

    // Check memory growth
    const initialMemory = await page.evaluate(() => (performance as any).memory.usedJSHeapSize);
    await page.waitForTimeout(5000); // Wait for GC
    const finalMemory = await page.evaluate(() => (performance as any).memory.usedJSHeapSize);

    const growthPercent = ((finalMemory - initialMemory) / initialMemory) * 100;
    expect(growthPercent).toBeLessThan(10); // Less than 10% growth
  });
});
```

### Step 7.2: Run Tests

```bash
# Run memory leak tests
pnpm playwright test e2e/memory/

# Run with UI
pnpm playwright test e2e/memory/ --ui
```

---

## Validation Checklist

### Before Deployment
- [ ] All components have proper cleanup in useEffect
- [ ] Monaco Editor instances are disposed on unmount
- [ ] WebSocket connections are closed on unmount
- [ ] React Query gcTime and staleTime configured
- [ ] Zustand stores have reset() methods
- [ ] Templates gallery uses virtualization
- [ ] React Compiler enabled in next.config.ts
- [ ] Memory leak tests pass in CI/CD
- [ ] Baseline metrics documented
- [ ] Post-optimization metrics show improvement

### Success Criteria (from Spec)
- [ ] Memory consumption <300MB for 2-hour session
- [ ] Memory growth <20% after 4 hours continuous use
- [ ] Frame rate >30 FPS for lists with 500 items
- [ ] Zero production memory leaks

---

## Troubleshooting

### Memory Still Growing
1. Run Chrome DevTools Memory Profiler
2. Take heap snapshots before and after actions
3. Use "Comparison" view to find retained objects
4. Check for event listeners not removed
5. Check for timers not cleared

### Monaco Editor Errors
- Ensure dispose() is called in cleanup
- Check if multiple models created with same URI
- Use monaco.editor.getModel(uri) before creating new

### React Query Cache Too Large
- Reduce gcTime (default 10 min → 5 min)
- Reduce staleTime (default 5 min → 2 min)
- Call queryClient.clear() on logout

---

## Implementation Deviations & Notes

This section documents actual implementation differences from the original quickstart guide.

### ✅ What Was Implemented (Matches Spec)

1. **Phase 1 - Setup & Baseline**
   - ✅ React Compiler enabled in `next.config.ts` (line 13)
   - ✅ Webpack memory optimizations enabled (line 14)
   - ✅ @tanstack/react-virtual installed (3.13.18)
   - ✅ Baseline metrics documented in `docs/memory-baseline-2026-02-08.md`

2. **Phase 2 - Component Cleanup Patterns**
   - ✅ `useComponentCleanup` hook created at `frontend/hooks/useComponentCleanup.ts`
   - ✅ Enhanced with WebSocket-specific leak detection (lines 77-123)
   - ✅ Enhanced with detailed event listener warnings (lines 293-335)
   - ✅ Integrated with `useMonacoEditor` hook

3. **Phase 3 - Monaco Editor Cleanup**
   - ✅ `useMonacoEditor` hook created at `frontend/hooks/useMonacoEditor.ts`
   - ✅ Proper disposal of editor instances and models (lines 168-201)
   - ✅ Integrated with `useComponentCleanup` for resource tracking

4. **Phase 4 - React Query & Zustand Configuration**
   - ✅ React Query configured with proper staleTime (5min) and gcTime (10min) in `frontend/lib/api/query-client.ts`
   - ✅ Detailed documentation of cache policy (lines 4-28)
   - ✅ All Zustand stores have `reset()` methods:
     - `frontend/stores/auth.ts` (line 120) - also calls reset on all other stores during logout
     - `frontend/stores/projects.ts` (line 34)
     - `frontend/stores/templates.ts` (line 23)
     - `frontend/stores/generation.ts` (line 144)
     - `frontend/stores/settings.ts` (has reset method)
   - ✅ Comprehensive logout cleanup sequence in `auth.ts` (lines 52-88):
     - Clears React Query caches
     - Resets all Zustand stores
     - Clears localStorage tokens
     - Resets auth store
     - Redirects to login

5. **Phase 5 - Virtualization**
   - ✅ Templates Gallery virtualized in `frontend/components/templates/template-gallery.tsx`
   - ✅ Row-based virtualization for grid layout (not item-based)
   - ✅ Dynamic measurement with Firefox compatibility check (lines 39-42)
   - ✅ CSS containment for performance (line 53)

### 🔄 Implementation Differences

1. **Storage Location**
   - **Spec**: `frontend/lib/stores/`
   - **Actual**: `frontend/stores/`
   - **Reason**: Project convention, no functional impact

2. **React Query Client Pattern**
   - **Spec**: Simple singleton pattern
   - **Actual**: Server/Client split pattern with `getQueryClient()` factory
   - **Reason**: Next.js 16 best practices for SSR compatibility
   - **File**: `frontend/lib/api/query-client.ts` vs `frontend/lib/api/client.ts`

3. **Virtualization Approach**
   - **Spec**: Item-based virtualization (virtualizes individual cards)
   - **Actual**: Row-based virtualization (virtualizes grid rows)
   - **Reason**: Better performance for responsive grid layouts (1/2/3 columns)
   - **Trade-off**: Same memory benefits, simpler measurement logic

4. **Monaco Editor Loading**
   - **Spec**: Manual monaco import
   - **Actual**: Uses `@monaco-editor/react` loader API
   - **Reason**: Better TypeScript integration and automatic Monaco initialization
   - **File**: `frontend/hooks/useMonacoEditor.ts` (line 100)

### ⚠️ Not Yet Implemented (Phase 6-7)

1. **Phase 6 - Memory Monitoring**
   - ❌ `useMemoryMonitor` hook NOT created
   - ❌ `MemoryMonitor` dev component NOT created
   - **Status**: Low priority (P4), deferred to future optimization phase

2. **Phase 7 - Testing**
   - ❌ MemLab integration NOT added
   - ❌ Memory leak E2E tests NOT created
   - **Status**: Low priority (P4), deferred to comprehensive testing phase

### 📦 Package Differences

**Spec**: Install memlab as dev dependency
**Actual**: Not installed yet (deferred with Phase 7)

### 🎯 Additional Improvements (Beyond Spec)

1. **Enhanced Cleanup Warnings**
   - WebSocket-specific leak detection with `readyState` validation
   - Detailed fix recommendations in console output for event listeners
   - Structured console groups for better debugging

2. **Dynamic Store Imports**
   - Auth store uses dynamic imports to avoid circular dependencies during logout
   - Prevents bundler issues and improves code splitting

3. **Comprehensive Cleanup Documentation**
   - Extensive JSDoc comments in both hooks
   - Real-world usage examples
   - Performance optimization notes

### 🚀 Next Steps

✅ Phase 1-5 Complete (Critical and High Priority)
→ Phase 6-7 deferred to future sprints (Low Priority)
→ Monitor production memory metrics
→ Add MemLab tests if memory issues detected
