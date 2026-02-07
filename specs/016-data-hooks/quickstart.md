# Quickstart: Data Hooks (React Query Integration)

**Feature Branch**: `016-data-hooks`

---

## Prerequisites

- Node.js 18+
- Frontend dev server running (`cd frontend && npm run dev`)
- Backend API running (`cd backend && uvicorn app.main:app`)
- Branch: `016-data-hooks`

## Setup

```bash
# 1. Install dependencies
cd frontend
npm install @tanstack/react-query @tanstack/react-query-devtools

# 2. Verify installation
npm run type-check
```

## File Structure

```
frontend/
├── lib/
│   ├── api/
│   │   ├── client.ts          # Existing ky instance (no changes)
│   │   ├── mappers.ts         # NEW: snake_case → camelCase mappers
│   │   ├── users.ts           # UPDATE: real API calls
│   │   ├── credits.ts         # NEW: credits API functions
│   │   ├── templates.ts       # UPDATE: real API calls
│   │   ├── projects.ts        # UPDATE: real API calls
│   │   ├── query-client.ts    # NEW: QueryClient config
│   │   └── query-keys.ts      # NEW: query key conventions
│   └── hooks/
│       ├── use-user.ts        # NEW: useCurrentUser, useUpdateProfile
│       ├── use-credits.ts     # NEW: useCreditBalance, useClaimDailyBonus, useCreditTransactions
│       ├── use-templates.ts   # NEW: useTemplates, useTemplate
│       └── use-projects.ts    # NEW: useProjects, useProject, useCreateProject, useDeleteProject
├── app/
│   ├── providers.tsx          # NEW: QueryClientProvider wrapper
│   └── layout.tsx             # UPDATE: wrap with Providers
└── types/
    └── index.ts               # UPDATE: new API response types
```

## Key Patterns

### Using a Query Hook

```typescript
// In any component:
import { useCurrentUser } from '@/lib/hooks/use-user'

function Navbar() {
  const { data: user, isLoading, error } = useCurrentUser()

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState onRetry={() => {}} />

  return <span>{user?.fullName}</span>
}
```

### Using a Mutation Hook

```typescript
import { useDeleteProject } from '@/lib/hooks/use-projects'

function ProjectCard({ id }: { id: string }) {
  const deleteProject = useDeleteProject()

  const handleDelete = () => {
    deleteProject.mutate(id, {
      onSuccess: () => toast.success('Проект удалён'),
      onError: () => toast.error('Ошибка при удалении'),
    })
  }
}
```

### Optimistic Update Pattern

```typescript
// Inside useDeleteProject mutation config:
onMutate: async (id) => {
  await queryClient.cancelQueries({ queryKey: ['projects'] })
  const previous = queryClient.getQueryData(['projects'])
  queryClient.setQueryData(['projects'], /* remove item */)
  return { previous }
},
onError: (err, id, context) => {
  queryClient.setQueryData(['projects'], context?.previous)
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['projects'] })
},
```

## Validation

```bash
# Type check
npm run type-check

# Build
npm run build

# Run dev server and verify:
# 1. Dashboard loads real data
# 2. Templates gallery shows API data
# 3. Projects list works with filters
```
