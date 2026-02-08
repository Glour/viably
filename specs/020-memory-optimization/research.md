# Research: Frontend Memory Optimization

**Date**: 2026-02-08
**Feature**: 020-memory-optimization
**Phase**: 0 - Research & Technology Selection

## Research Questions

1. Какие библиотеки для виртуализации списков лучше подходят для React 19?
2. Существуют ли инструменты для автоматического обнаружения утечек памяти в React?
3. Какие best practices для оптимизации памяти рекомендует Next.js 16?
4. Как правильно управлять памятью Monaco Editor в React?
5. Как настроить React Query и Zustand для предотвращения бесконечного роста кэша?

## Research Findings

### 1. Virtualization Library Selection

**Decision**: TanStack Virtual v3

**Rationale**:
- Поддерживает React 19 (часть TanStack ecosystem)
- Легковесная (~3KB gzipped)
- Virtualizes only visible content at 60FPS
- TypeScript-first с отличной поддержкой типов
- Активная поддержка (часть TanStack, как React Query)
- 100% контроль над markup и styles

**Alternatives Considered**:
- **react-virtualized**: Deprecated, рекомендуют react-window
- **react-window**: Lightweight (2KB), но менее feature-rich
- **React Virtuoso**: Более тяжелая библиотека (~18KB), больше features но избыточна для наших задач
- **virtua**: Zero-config и легковесная (~3KB), но менее зрелая чем TanStack Virtual

**Library**: `@tanstack/react-virtual` version `^3.0.0`

**Sources**:
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [NPM Compare - React Virtualization Libraries](https://npm-compare.com/rc-virtual-list,react-infinite-scroll-component,react-virtualized,react-window)
- [React Virtuoso](https://virtuoso.dev/)

---

### 2. Memory Leak Detection Tools

**Decision**: Комбинация Chrome DevTools + MemLab для E2E тестов + Custom useMemoryMonitor hook

**Rationale**:
- **Chrome DevTools Memory Profiler**: Встроенный инструмент, не требует зависимостей, подходит для development
- **MemLab**: Open-source от Meta, E2E browser memory leak detection с Playwright API, автоматическое сравнение heap snapshots
- **Custom Hook**: Легковесный runtime мониторинг для development режима без overhead в production

**Alternatives Considered**:
- **leakage**: Node.js only, не подходит для браузерного React
- **nleak**: Требует отдельный viewer, избыточная сложность

**Library**: `memlab` version `^1.3.0` (dev dependency)

**Implementation Strategy**:
- Development: Chrome DevTools для manual profiling
- CI/CD: MemLab Playwright тесты для автоматического обнаружения утечек
- Production: Performance API для мониторинга (без библиотек)

**Sources**:
- [MemLab - Meta Engineering](https://engineering.fb.com/2022/09/12/open-source/memlab/)
- [memlab npm package](https://www.npmjs.com/package/memlab)
- [Understanding Memory Leaks in React - Medium](https://medium.com/@ignatovich.dm/understanding-memory-leaks-in-react-how-to-find-and-fix-them-fc782cf182be)

---

### 3. Next.js 16 Memory Optimization Best Practices

**Key Findings**:

**React 19 Compiler (Stable in Next.js 16)**:
- Автоматическая мемоизация компонентов
- Eliminates manual useMemo/useCallback
- Reduces unnecessary re-renders
- Zero manual code changes required

**Next.js 16 Configuration**:
```typescript
// next.config.ts
experimental: {
  webpackMemoryOptimizations: true, // Reduces max memory usage during build
  reactCompiler: true, // Enable React Compiler for auto-memoization
}
```

**Memory Debugging**:
```bash
next build --experimental-debug-memory-usage
```
Prints heap usage and GC statistics during build.

**Layout Deduplication**:
- Shared layouts downloaded once instead of per-Link
- Dramatically reduces network transfer size (50 product links = 1 layout download, not 50)

**Bundle Analysis**:
- Use `@next/bundle-analyzer` to identify large dependencies
- Remove unnecessary dependencies to improve memory footprint

**Best Practices**:
1. Enable React Compiler for automatic memoization
2. Use TanStack Virtual для списков >100 элементов
3. Lazy load routes and components with `next/dynamic`
4. Monitor bundle size with analyzer
5. Use layout deduplication for shared UI

**Sources**:
- [React & Next.js Best Practices 2026 - FAB Web Studio](https://fabwebstudio.com/blog/react-nextjs-best-practices-2026-performance-scale)
- [Next.js Memory Usage Guide](https://nextjs.org/docs/app/guides/memory-usage)
- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React & Next.js 2025 Best Practices - Strapi](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices)

---

### 4. Monaco Editor Memory Management

**Critical Issues Identified**:

**Memory Leaks**:
- Monaco stores text models in memory until explicitly disposed
- Diff editor creates new models on every update without disposing old ones
- Workers not cleaned up properly
- Issue started in v0.44.0

**Required Cleanup Pattern**:
```typescript
// MUST dispose models and editor instances
useEffect(() => {
  const model = monaco.editor.createModel(code, language);
  const editor = monaco.editor.create(element, { model });

  return () => {
    model.dispose(); // Free up URI and memory
    editor.dispose(); // Cleanup editor instance
  };
}, []);
```

**Best Practices**:
1. Always call `.dispose()` on models and editors when unmounting
2. Check for existing models before creation: `monaco.editor.getModel(uri)`
3. Reuse models when possible instead of creating new ones
4. Dispose completion providers and other resources
5. For diff editors, ensure both original and modified models are disposed

**Implementation Decision**:
- Wrapper hook `useMonacoEditor` для гарантированной очистки
- Проверка существующих моделей перед созданием новых
- Dispose в useEffect cleanup

**Sources**:
- [Monaco Editor Memory Leaks Issue #1693](https://github.com/microsoft/monaco-editor/issues/1693)
- [Memory leaks on diff editor Issue #110](https://github.com/react-monaco-editor/react-monaco-editor/issues/110)
- [Diff Editor Memory Leak Bug #4659](https://github.com/microsoft/monaco-editor/issues/4659)
- [Memory Management Strategies for Monaco - StudyRaid](https://app.studyraid.com/en/read/15534/540350/memory-management-strategies-for-monaco)

---

### 5. React Query & Zustand Cache Configuration

**React Query Configuration**:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Key Settings**:
- `staleTime`: How long data remains fresh (prevents refetches)
- `gcTime`: How long unused data stays in cache before garbage collection
- Limit concurrent queries to prevent memory spikes
- Use `removeQueries()` для manual cleanup при logout

**Zustand Best Practices**:

```typescript
// Reset store on logout
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  logout: () => {
    set({ user: null });
    // Clear all other stores
    useProjectsStore.getState().reset();
    useTemplatesStore.getState().reset();
  },
}));

// Add reset method to each store
interface ProjectsState {
  projects: Project[];
  reset: () => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  reset: () => set({ projects: [] }),
}));
```

**Best Practices**:
1. Set reasonable `gcTime` (не Infinity)
2. Use `staleTime` для предотвращения избыточных refetches
3. Clear caches on logout/unmount
4. Implement reset() methods in Zustand stores
5. Avoid storing large objects in global state (use React Query cache instead)

**Sources**:
- [TanStack Query Caching Documentation](https://tanstack.com/query/latest)
- Project's existing React Query configuration в `lib/api/client.ts`

---

## Technology Stack Summary

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Virtualization | @tanstack/react-virtual | ^3.0.0 | List/grid virtualization для >100 элементов |
| Memory Testing | memlab | ^1.3.0 | E2E memory leak detection в Playwright |
| Memory Profiling | Chrome DevTools | Built-in | Manual heap snapshot analysis |
| Auto-Memoization | React Compiler | Built-in (Next.js 16) | Automatic component memoization |
| Editor Cleanup | Custom Hook | N/A | Wrapper для Monaco Editor disposal |
| Cache Management | React Query Config | Existing | staleTime & gcTime limits |
| Store Reset | Zustand Pattern | Existing | Manual reset() methods |

---

## Implementation Priorities

**P1 - Critical (Memory Leaks)**:
1. Monaco Editor disposal pattern (useMonacoEditor hook)
2. Component cleanup audit (useEffect cleanup в всех компонентах)
3. WebSocket cleanup (react-use-websocket disconnect)

**P2 - High (Resource Management)**:
1. React Query gcTime/staleTime configuration
2. Zustand store reset methods
3. TanStack Virtual для Templates Gallery (500+ items)

**P3 - Medium (Optimization)**:
1. React Compiler enable (Next.js 16 config)
2. Bundle analysis и removal ненужных зависимостей
3. Lazy loading для редко используемых компонентов

**P4 - Low (Monitoring)**:
1. MemLab E2E тесты
2. Custom useMemoryMonitor hook (dev only)
3. Performance API metrics

---

## Research Completed

✅ All NEEDS CLARIFICATION resolved
✅ Library selections documented with rationale
✅ Best practices from official sources identified
✅ Implementation priorities established
✅ No complex research requiring deepresearch tool

**Ready for Phase 1: Design & Contracts**
