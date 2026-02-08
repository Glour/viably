# Generation Flow Hooks

This directory contains hooks for managing AI code generation flow.

## Files

### `use-generation.ts` (LEGACY - Phase 5)

**Status**: Legacy mock implementation, will be replaced in T026

Mock-based generation hook using Zustand store and setTimeout simulation.

**Features**:
- Client-side simulation of generation steps
- Random delays and error simulation
- Form state management
- Template loading
- Deployment simulation (Phase 6 stub)

**Used by**: `/app/projects/[id]/generate/page.tsx` (current)

---

### `use-generation-wrapper.ts` (NEW - T026 Preparation)

**Status**: Bridge for WebSocket migration, ready for T026

Wrapper hook that combines new WebSocket-based generation with old API compatibility.

**Architecture**:
```
generate/page.tsx (expects old API)
    ↓
use-generation-wrapper.ts (this file - bridges APIs)
    ↓
/lib/hooks/use-generation.ts (WebSocket-based, real backend)
```

**Features**:
- Uses new WebSocket hook (`/lib/hooks/use-generation.ts`)
- Adds form state management (formValues, freeTextInput)
- Loads template via React Query
- Maps new API shape to old API shape for compatibility
- Converts `GeneratedFile[]` to `ProjectFile[]`
- Deployment stub (Phase 6)

**API Shape** (matches old hook):
```typescript
{
  generation: GenerationSession,      // Maps WS state to old session shape
  deployment: DeploymentSession,      // Stub for Phase 6
  formValues: ConfigFormValues,       // Client-side form state
  freeTextInput: string,              // Client-side input
  template: Template | null,          // Loaded via React Query
  setFormValues: (values) => void,
  setFreeTextInput: (text) => void,
  startGeneration: async () => void,  // Wraps WS hook with form params
  retryGeneration: () => void,
  resetGeneration: () => void,
  startDeployment: async (config) => void, // Stub
  downloadCode: async () => void,
  canGenerate: boolean,
  isGenerating: boolean,
}
```

**Migration Path** (T026):
1. Test wrapper hook thoroughly
2. Update `generate/page.tsx` to import from `use-generation-wrapper`
3. Verify all UI behaviors work correctly
4. Remove old `use-generation.ts` mock
5. (Optional) Refactor page to use WebSocket hook directly if form state is moved to page level

---

## Type Conversions

### GeneratedFile → ProjectFile

**Backend shape** (`GeneratedFile` from WebSocket):
```typescript
{
  path: "main.py",
  content: "import asyncio...",
  language: "python"
}
```

**Frontend shape** (`ProjectFile` for file tree):
```typescript
{
  path: "main.py",
  name: "main.py",
  type: "file",
  content: "import asyncio...",
}
```

**Conversion**: Flattens file structure (no nested folders in WebSocket response yet)

---

## Known Limitations

1. **Template Schema**: Backend `configSchema` not yet parsed to `ConfigField[]`
   - Wrapper uses empty array for now
   - Form fields will need to be dynamically rendered from schema in future

2. **Deployment**: Phase 6 feature, currently stubbed
   - `startDeployment` logs warning
   - `deployment` state returns config status

3. **Timestamps**: WebSocket hook doesn't track `startedAt`/`completedAt`
   - Returns null in wrapper

4. **Step Durations**: WebSocket hook doesn't track individual step durations
   - Returns null in wrapper

5. **File Tree Structure**: WebSocket returns flat list, not nested folders
   - Need to parse paths and build tree structure for complex projects

---

## Testing Checklist

Before enabling wrapper in production:

- [ ] WebSocket connection established on page load
- [ ] Generation starts correctly with form values
- [ ] Progress updates in real-time
- [ ] Steps update with correct statuses
- [ ] Code snippets accumulate for typewriter animation
- [ ] Generation completes and shows code
- [ ] Download code works
- [ ] Retry generation works
- [ ] Error handling works (insufficient credits, 404, etc.)
- [ ] React Query cache invalidates after completion
- [ ] Multi-tab sync works (WebSocket share: true)

---

## See Also

- `/lib/hooks/use-generation.ts` - WebSocket generation hook (new)
- `/types/websocket.ts` - WebSocket message types
- `/types/index.ts` - Frontend types (GenerationSession, ProjectFile, etc.)
- `specs/017-websocket-generation/` - Specification docs
