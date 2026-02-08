# T052: Store Cleanup on Logout Implementation

## Summary
Implemented comprehensive cleanup sequence on logout by calling all store reset() methods from the auth store's logout function.

## Changes Made

### 1. Added reset() to settings store
**File**: `/home/alex/PycharmProjects/viably/frontend/stores/settings.ts`

- Added `reset()` method to `SettingsUIState` interface
- Created `initialState` constant for consistency
- Implemented reset method with proper documentation

```typescript
interface SettingsUIState {
  transactionFilter: TransactionFilter
  setTransactionFilter: (filter: TransactionFilter) => void
  reset: () => void // NEW
}

const initialState = {
  transactionFilter: "all" as TransactionFilter,
}

export const useSettingsStore = create<SettingsUIState>((set) => ({
  ...initialState,
  setTransactionFilter: (filter) => set({ transactionFilter: filter }),
  reset: () => set(initialState), // NEW
}))
```

### 2. Updated logout sequence in auth store
**File**: `/home/alex/PycharmProjects/viably/frontend/stores/auth.ts`

Added comprehensive cleanup sequence that calls all store reset methods:

```typescript
logout: async () => {
  try {
    // ... server logout call ...
  } finally {
    // Complete cleanup sequence on logout:

    // 1. Clear all React Query caches (server data)
    clearAllCaches()

    // 2. Reset all Zustand stores (client state)
    const { useProjectsStore } = await import("./projects")
    const { useTemplatesStore } = await import("./templates")
    const { useGenerationStore } = await import("./generation")
    const { useSettingsStore } = await import("./settings")

    useProjectsStore.getState().reset()
    useTemplatesStore.getState().reset()
    useGenerationStore.getState().reset()
    useSettingsStore.getState().reset()

    // 3. Clear authentication tokens from localStorage
    clearTokens()

    // 4. Reset auth store last (this store)
    set({ user: null, isAuthenticated: false })

    // 5. Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }
}
```

## Cleanup Sequence Order

The cleanup is executed in a specific order to ensure proper cleanup:

1. **React Query cache** - Clear all server-side data cached by React Query
2. **All Zustand stores** - Reset client-side UI state in all feature stores
   - Projects store (search, filters, view mode)
   - Templates store (search query, active tab)
   - Generation store (generation state, deployment state, form values)
   - Settings store (transaction filter)
3. **Authentication tokens** - Remove access and refresh tokens from localStorage
4. **Auth store** - Reset auth store state last
5. **Redirect** - Navigate to login page

## Design Decisions

### Dynamic Imports
Used dynamic imports (`await import()`) to avoid circular dependencies:
```typescript
const { useProjectsStore } = await import("./projects")
```

This ensures stores can be imported in the logout method without creating circular dependency issues.

### Direct State Access
Used `getState().reset()` pattern to access store methods:
```typescript
useProjectsStore.getState().reset()
```

This allows calling the reset method without needing to be inside a React component.

### Documentation
Added comprehensive inline comments documenting:
- The cleanup sequence order
- Why each step is performed
- The purpose of each cleanup operation

## Verification

All stores now have reset() methods:
- ✓ auth.ts
- ✓ projects.ts
- ✓ templates.ts
- ✓ generation.ts
- ✓ settings.ts

All cleanup methods called in logout:
- ✓ clearAllCaches()
- ✓ useProjectsStore.getState().reset()
- ✓ useTemplatesStore.getState().reset()
- ✓ useGenerationStore.getState().reset()
- ✓ useSettingsStore.getState().reset()
- ✓ clearTokens()

## Benefits

1. **Complete cleanup** - All application state is properly reset on logout
2. **Memory efficiency** - Prevents memory leaks by releasing all stored data
3. **Security** - Ensures no sensitive data persists after logout
4. **Consistent state** - Fresh state for next login, no stale data
5. **Maintainable** - Clear, documented sequence easy to understand and modify

## Testing Considerations

To test the logout cleanup:

1. **Login** - Authenticate with valid credentials
2. **Use features** - Navigate to different pages, create projects, view templates, etc.
3. **Verify state** - Open React DevTools and check Zustand stores have data
4. **Logout** - Click logout button
5. **Verify cleanup**:
   - All Zustand stores should be reset to initial state
   - localStorage should have no tokens
   - React Query cache should be empty
   - User should be redirected to login page

## Related Tasks

- T048: Added reset() to projects store
- T049: Added reset() to templates store
- T050: Added reset() to generation store
- T051: Added reset() to auth store
- **T052**: Call all resets on logout (this task)

## Files Modified

1. `/home/alex/PycharmProjects/viably/frontend/stores/settings.ts`
   - Added reset() method to SettingsUIState interface
   - Created initialState constant
   - Implemented reset method

2. `/home/alex/PycharmProjects/viably/frontend/stores/auth.ts`
   - Updated logout method to call all store reset methods
   - Added comprehensive cleanup sequence with documentation
   - Ensured proper order of operations
