# Generation Hook API Comparison

## Overview

Comparison between old mock hook and new wrapper hook for T026 migration.

---

## API Surface Comparison

### Old Hook: `use-generation.ts`

```typescript
const {
  generation,           // GenerationSession (from Zustand store)
  deployment,           // DeploymentSession (from Zustand store)
  formValues,           // ConfigFormValues (from Zustand store)
  freeTextInput,        // string (from Zustand store)
  template,             // Template | null (from Zustand store)
  setFormValues,        // Updates Zustand store
  setFreeTextInput,     // Updates Zustand store
  startGeneration,      // async () => starts setTimeout simulation
  retryGeneration,      // Resets store, restarts simulation
  resetGeneration,      // Resets store to idle
  startDeployment,      // async (config) => setTimeout simulation
  downloadCode,         // async () => downloads from store.generation.code
  canGenerate,          // boolean (computed from form/template)
  isGenerating,         // boolean (computed from store.generation.status)
  isComplete,           // boolean (computed)
  isError,              // boolean (computed)
} = useGeneration(projectId)
```

**State Management**: Zustand store (`useGenerationStore`)
**Backend**: Mock (setTimeout-based simulation)
**Template Loading**: Mock API call on mount
**Form State**: Global Zustand store

---

### New Hook: `use-generation-wrapper.ts`

```typescript
const {
  generation,           // GenerationSession (mapped from WebSocket state)
  deployment,           // DeploymentSession (stub)
  formValues,           // ConfigFormValues (local useState)
  freeTextInput,        // string (local useState)
  template,             // Template | null (React Query)
  setFormValues,        // Updates local state
  setFreeTextInput,     // Updates local state
  startGeneration,      // async () => calls WebSocket API
  retryGeneration,      // Calls WebSocket hook retry
  resetGeneration,      // Calls WebSocket hook retry
  startDeployment,      // async (config) => stub (Phase 6)
  downloadCode,         // async () => downloads from WebSocket state
  canGenerate,          // boolean (computed from WebSocket status)
  isGenerating,         // boolean (computed from WebSocket status)
} = useGenerationWrapper(projectId)
```

**State Management**:
- Local `useState` for form state
- React Query for template
- WebSocket hook for generation state

**Backend**: Real WebSocket + REST API
**Template Loading**: React Query (`useTemplate`)
**Form State**: Local component state (no global store)

---

## Key Differences

### 1. State Management

| Feature | Old Hook | New Hook |
|---------|----------|----------|
| Generation state | Zustand global store | WebSocket hook (local state) |
| Form state | Zustand global store | Local `useState` |
| Template loading | Mock API + store | React Query |
| Multi-tab sync | Manual (Zustand) | Automatic (WebSocket share: true) |

### 2. Data Flow

**Old Hook**:
```
User action → Zustand action → setTimeout simulation → Zustand update → UI
```

**New Hook**:
```
User action → WebSocket API call → Backend → WS message → Hook state update → UI
```

### 3. Type Conversions

**Old Hook**: No conversion needed (mock data already in ProjectFile format)

**New Hook**: Converts backend types to frontend types:
- `GeneratedFile[]` → `ProjectFile[]`
- `StepStatus` ("pending" | "running" | "complete" | "error") → `GenerationStepStatus` ("pending" | "running" | "done" | "error")
- Backend step index (1-based) → Frontend step index (0-based)

### 4. Missing Features in New Hook

| Feature | Old Hook | New Hook | Notes |
|---------|----------|----------|-------|
| `startedAt` | Tracked | null | WebSocket hook doesn't track |
| `completedAt` | Tracked | null | WebSocket hook doesn't track |
| `step.duration` | Tracked | null | WebSocket hook doesn't track |
| `isComplete` | Exposed | Not exposed | Can compute: `status === 'complete'` |
| `isError` | Exposed | Not exposed | Can compute: `status === 'error'` |

---

## Migration Steps (T026)

### Step 1: Update Import

**Before**:
```typescript
import { useGeneration } from "@/lib/generation/use-generation"
```

**After**:
```typescript
import { useGeneration } from "@/lib/generation/use-generation-wrapper"
```

### Step 2: Remove Computed Flags (if used)

**Before**:
```typescript
const { isComplete, isError } = useGeneration(id)
```

**After**:
```typescript
const { generation } = useGeneration(id)
const isComplete = generation.status === "complete"
const isError = generation.status === "error"
```

### Step 3: Test All Flows

- [ ] Generation start
- [ ] Real-time progress updates
- [ ] Generation completion
- [ ] Code download
- [ ] Retry after error
- [ ] Multi-tab sync
- [ ] WebSocket reconnection

### Step 4: Update Tests

Update any tests that mock `useGenerationStore` to mock the WebSocket hook instead.

---

## Performance Comparison

| Metric | Old Hook | New Hook |
|--------|----------|----------|
| Initial render | Fast (local state) | Fast (local state + WS connection) |
| State updates | Fast (Zustand) | Fast (WS message → local state) |
| Multi-tab sync | Manual | Automatic (no overhead) |
| Memory | Medium (global store) | Low (local state + shared WS) |
| Network | None (mock) | WebSocket (persistent connection) |

---

## Rollback Plan

If issues arise after migration:

1. Revert import to old hook:
   ```typescript
   import { useGeneration } from "@/lib/generation/use-generation"
   ```

2. No other changes needed (API shape identical)

3. Keep wrapper for future use

---

## Future Improvements

### Phase 6: Direct WebSocket Hook Usage

Once deployment is implemented, consider refactoring to use WebSocket hook directly:

```typescript
// In generate/page.tsx
const wsGeneration = useGeneration(projectId)
const [formValues, setFormValues] = useState({})
const { data: template } = useTemplate(templateId)

// No wrapper needed
```

**Benefits**:
- Simpler architecture
- Less type conversion overhead
- Direct access to WebSocket features

**Trade-offs**:
- More code in page component
- Need to manage form state at page level

---

## Questions to Answer Before Migration

1. **Form State**: Should form state be local or global?
   - Local: Simpler, component-scoped
   - Global: Persist across navigation, shareable

2. **Template Loading**: Load in hook or page?
   - Hook: Cleaner page code
   - Page: More explicit, easier to debug

3. **Error Handling**: Where to show errors?
   - Current: PreviewPanel shows generation.error
   - Future: Toast notifications? Error boundary?

4. **Timestamps**: Do we need startedAt/completedAt?
   - If yes: Track in wrapper hook using Date.now()
   - If no: Remove from GenerationSession type

---

## Checklist for T026

- [x] Wrapper hook created
- [x] Type-check passes
- [x] Build passes
- [ ] Update generate page to use wrapper
- [ ] Test generation flow end-to-end
- [ ] Test error cases (insufficient credits, 404, network errors)
- [ ] Test multi-tab behavior
- [ ] Test WebSocket reconnection
- [ ] Update tests
- [ ] Remove old mock hook
- [ ] Update documentation
