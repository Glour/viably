# Memory Testing Suite - T057

Comprehensive memory testing for the Viably frontend to ensure optimal performance with multiple concurrent projects.

## Target

**<500MB total memory usage with 10 concurrent projects open**

## Test Scripts

### 1. Full Browser Memory Test (Recommended)

Tests memory usage in a real browser environment with actual component rendering.

```bash
# Start the dev server first
npm run dev

# In another terminal, run the test
npx tsx scripts/test-memory-concurrent.ts
```

**What it tests:**
- ✅ Real browser heap size with 10 projects open
- ✅ Memory leak detection (open/close cycles)
- ✅ Zustand store sizes
- ✅ React Query cache impact
- ✅ Component memory usage

**Requirements:**
- Running Next.js dev server (`npm run dev`)
- Chrome/Chromium browser
- Node.js with `tsx` installed

### 2. Store Isolation Test (Fast)

Tests Zustand stores in isolation without requiring a browser.

```bash
# Run with garbage collection enabled
node --expose-gc -r tsx/register scripts/test-memory-stores.ts

# Or using tsx directly
npx tsx scripts/test-memory-stores.ts
```

**What it tests:**
- ✅ Individual store memory usage
- ✅ Store isolation (no state leakage)
- ✅ Large dataset handling
- ✅ Memory cleanup after store destruction

**Advantages:**
- Fast execution (~10 seconds)
- No browser required
- No running server needed
- Precise Node.js heap measurements

## Test Results

Results are saved to `.tmp/current/`:

- `memory-test-results.json` - Full browser test (JSON)
- `memory-test-results.md` - Full browser test (Markdown report)
- `store-memory-test-results.json` - Store isolation test

## Interpreting Results

### Success Criteria

✅ **PASSED** when:
- Total memory < 500MB (10 projects)
- Average per project < 50MB
- No memory leaks detected
- Stores properly isolated

⚠️ **WARNING** when:
- Memory 400-500MB (approaching limit)
- Individual project >60MB
- Small memory growth after cleanup (<10MB)

❌ **FAILED** when:
- Total memory > 500MB
- Memory leaks detected (>50MB growth)
- Store isolation broken

### Memory Breakdown

**Expected per project:**
- Component tree: ~10-15MB
- Zustand stores: ~500KB - 2MB
- React Query cache: ~5-10MB
- Monaco Editor (if loaded): ~20-30MB
- Other libraries: ~5-10MB

**Total expected: ~40-50MB per project**

## Optimization Strategies

If tests fail, consider:

### 1. Component Level
```tsx
// Memoize expensive components
export const ProjectCard = React.memo(({ project }) => {
  // ...
})

// Use useMemo for expensive calculations
const filteredProjects = useMemo(
  () => projects.filter(p => p.status === 'active'),
  [projects]
)
```

### 2. Store Level
```tsx
// Keep stores lean - don't cache large objects
const useProjectStore = create((set) => ({
  projectIds: [], // Just IDs, not full objects
  selectedId: null,
  // ...
}))
```

### 3. React Query Level
```tsx
// Configure shorter cache times
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
      staleTime: 30 * 1000,   // 30 seconds
    },
  },
})
```

### 4. Code Splitting
```tsx
// Lazy load heavy components
const MonacoEditor = lazy(() => import('@monaco-editor/react'))

// Use in component
<Suspense fallback={<Skeleton />}>
  <MonacoEditor />
</Suspense>
```

### 5. Virtualization
```tsx
// Use virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: projects.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
})
```

## Known Memory Consumers

Based on the memory optimization report:

| Package | Memory Impact | Optimization |
|---------|---------------|--------------|
| Monaco Editor | ~76MB | Replace with Prism (500KB) or lazy load |
| Sentry | ~52MB | Load only in production |
| PostHog | ~32MB | Load only in production |
| Lucide Icons | ~45MB | Use tree-shaking, named imports only |

## CI/CD Integration

Add to your pipeline:

```yaml
# .github/workflows/memory-test.yml
name: Memory Test

on: [push, pull_request]

jobs:
  memory-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm start & # Start production server
      - run: npx wait-on http://localhost:3000
      - run: npx tsx scripts/test-memory-concurrent.ts
      - name: Upload memory report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: memory-report
          path: .tmp/current/memory-test-results.md
```

## Debugging Memory Issues

### Chrome DevTools Method

1. Start dev server: `npm run dev`
2. Open Chrome DevTools (F12)
3. Go to Memory tab
4. Take heap snapshot
5. Open 10 projects
6. Take another snapshot
7. Compare snapshots

### Node.js Method

```bash
# Run with heap profiling
node --inspect --expose-gc -r tsx/register scripts/test-memory-stores.ts

# Open chrome://inspect in Chrome
# Click "inspect" on the Node process
# Use Memory Profiler
```

### Performance API Method

```typescript
// In browser console
performance.memory
// Returns:
// {
//   jsHeapSizeLimit: 2197815296,    // Max heap
//   totalJSHeapSize: 67108864,      // Current allocated
//   usedJSHeapSize: 45678901        // Actually used
// }
```

## Troubleshooting

### "performance.memory is undefined"

Run Chrome with:
```bash
google-chrome --enable-precise-memory-info
```

Or use the script which launches Chrome with this flag automatically.

### "gc is not a function"

Run Node with:
```bash
node --expose-gc script.js
```

### Test timeout

Increase timeout in script:
```typescript
// In test-memory-concurrent.ts
await page.waitForTimeout(5000) // Increase from 1000
```

### Server not running

Make sure Next.js dev server is running:
```bash
# Terminal 1
npm run dev

# Terminal 2 (wait for "ready" message)
npx tsx scripts/test-memory-concurrent.ts
```

## Manual Testing Checklist

- [ ] Open 10 projects in separate tabs
- [ ] Check browser task manager (Shift+Esc in Chrome)
- [ ] Verify each tab uses <50MB
- [ ] Close tabs and verify memory is released
- [ ] Check for console errors
- [ ] Verify stores are isolated (different data per project)
- [ ] Test with production build (`npm run build && npm start`)

## References

- [Chrome Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [React Performance Optimization](https://react.dev/reference/react/useMemo)
- [Zustand Best Practices](https://github.com/pmndrs/zustand#best-practices)
- [React Query Memory Management](https://tanstack.com/query/latest/docs/react/guides/important-defaults)

## Questions?

If tests fail or you need help optimizing:

1. Check the generated markdown report in `.tmp/current/memory-test-results.md`
2. Review per-project breakdown to find high-memory projects
3. Use Chrome DevTools Memory Profiler for detailed analysis
4. Consider the optimization strategies above

---

**Last updated**: 2026-02-08
**Task**: T057 - Test concurrent projects (10 open) and verify memory <500MB
