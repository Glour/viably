# RT-008: TanStack Query v5 Best Practices for Next.js 16

**Date**: 2026-02-07
**Researcher**: research-specialist
**Status**: Complete

## Executive Summary

TanStack Query v5 (latest version: 5.90.20) is fully compatible with React 19 and Next.js 16 App Router. With 2+ million weekly downloads, it's the industry standard for server state management. This document provides production-ready patterns for integrating TanStack Query v5 with Next.js 16, ky HTTP client, and React 19.

Key findings:
- **React 19 compatibility**: Fully supported (React 18+ required)
- **Next.js App Router**: Requires special setup for SSR/streaming hydration
- **Query keys**: Use factory pattern for consistent, type-safe keys
- **Optimistic updates**: Follow cache-based pattern with proper rollback
- **Infinite queries**: Use cursor-based pagination with `getNextPageParam`
- **ky integration**: Works seamlessly via queryFn (native Promise rejection on HTTP errors)
- **DevTools**: Must be dev dependency for Next.js 13+ App Router

---

## 1. TanStack Query v5 + Next.js 16 Integration

### Installation

```bash
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```

**Important**: In Next.js 13+ App Router, `@tanstack/react-query-devtools` **must** be a dev dependency to work correctly.

### Basic Setup (Non-Streaming)

Create a providers component for the App Router:

**File**: `src/providers/query-provider.tsx`

```tsx
'use client'

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as React from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**File**: `src/app/layout.tsx`

```tsx
import { QueryProvider } from '@/providers/query-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
```

### Advanced Setup (Streaming SSR)

For streaming SSR with React Server Components (requires `@tanstack/react-query-next-experimental`):

**File**: `src/lib/get-query-client.ts`

```tsx
import {
  isServer,
  QueryClient,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
        shouldRedactErrors: (error) => {
          // We should not catch Next.js server errors
          // as that's how Next.js detects dynamic pages
          // so we cannot redact them.
          // Next.js also automatically redacts errors for us
          // with better digests.
          return false
        },
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}
```

**File**: `src/providers/query-provider.tsx` (streaming version)

```tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import * as React from 'react'
import { getQueryClient } from '@/lib/get-query-client'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {children}
      </ReactQueryStreamedHydration>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Server-Side Prefetching

**Non-Streaming (await prefetch)**:

```tsx
// app/posts/page.tsx
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { Posts } from './posts'

export default async function PostsPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
```

**Streaming (no await)**:

```tsx
// app/posts/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/get-query-client'
import { Posts } from './posts'

// the function doesn't need to be `async` because we don't `await` anything
export default function PostsPage() {
  const queryClient = getQueryClient()

  // look ma, no await
  queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
```

### SSR Considerations

1. **Always set `staleTime` > 0** to avoid immediate refetching on the client
2. **Server vs Browser QueryClient**:
   - Server: Create new client per request (SSR isolation)
   - Browser: Use singleton to avoid React suspense issues
3. **Avoid `useState` for QueryClient** if no suspense boundary exists
4. **Streaming**: Include pending queries in dehydration via `shouldDehydrateQuery`
5. **Error handling**: Don't redact Next.js server errors (Next.js handles this)

---

## 2. Query Key Conventions

### Best Practice: Query Key Factories

Query keys should be treated as **dependency arrays** for your query functions. Every variable used in `queryFn` **must** be included in the query key.

**Benefits**:
- Type-safe query keys
- Consistent key structure
- Easy invalidation patterns
- Prevents stale data

### Implementation Pattern

**File**: `src/lib/query-keys.ts`

```typescript
// Query key factory pattern
export const queryKeys = {
  // Top-level domain
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.posts.lists(), { filters }] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },

  todos: {
    all: ['todos'] as const,
    lists: () => [...queryKeys.todos.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.todos.lists(), { filters }] as const,
    details: () => [...queryKeys.todos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.todos.details(), id] as const,
  },
} as const
```

### Usage Examples

**Query with dependencies**:

```tsx
function TodoItem({ todoId }: { todoId: string }) {
  const result = useQuery({
    queryKey: queryKeys.todos.detail(todoId), // ['todos', 'detail', todoId]
    queryFn: () => fetchTodoById(todoId),
  })

  // ...
}
```

**Invalidation patterns**:

```tsx
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

function TodoActions() {
  const queryClient = useQueryClient()

  const invalidateAllTodos = () => {
    // Invalidates ['todos'] and all nested keys
    queryClient.invalidateQueries({ queryKey: queryKeys.todos.all })
  }

  const invalidateTodoLists = () => {
    // Invalidates ['todos', 'list'] and all list queries
    queryClient.invalidateQueries({ queryKey: queryKeys.todos.lists() })
  }

  const invalidateSpecificTodo = (id: string) => {
    // Invalidates only ['todos', 'detail', id]
    queryClient.invalidateQueries({ queryKey: queryKeys.todos.detail(id) })
  }

  // ...
}
```

### Query Key Rules

1. **Include all dependencies**: Every variable in `queryFn` must be in `queryKey`
2. **Use const assertions**: Prevents type widening (`as const`)
3. **Hierarchical structure**: Enables partial invalidation
4. **Consistent naming**: Use consistent patterns across domains
5. **Type-safe**: Export factory functions for type inference

### ESLint Rule

Enable the exhaustive-deps rule to enforce query key dependencies:

```json
{
  "plugins": ["@tanstack/query"],
  "rules": {
    "@tanstack/query/exhaustive-deps": "error"
  }
}
```

---

## 3. Optimistic Updates

### Best Practice: Cache-Based Pattern

Optimistic updates via the cache provide instant UI feedback while the mutation is in-flight, with automatic rollback on error.

### Implementation Pattern

**Single Item Update**:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

type Todo = { id: string; text: string; completed: boolean }

function useTodoUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (todo: Todo) => {
      const response = await api.updateTodo(todo)
      return response
    },

    // When mutate is called:
    onMutate: async (newTodo, context) => {
      // 1. Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await context.client.cancelQueries({
        queryKey: queryKeys.todos.detail(newTodo.id)
      })

      // 2. Snapshot the previous value
      const previousTodo = context.client.getQueryData(
        queryKeys.todos.detail(newTodo.id)
      )

      // 3. Optimistically update to the new value
      context.client.setQueryData(
        queryKeys.todos.detail(newTodo.id),
        newTodo
      )

      // 4. Return a result object with the snapshotted value
      return { previousTodo, newTodo }
    },

    // If the mutation fails, use the result we returned above
    onError: (err, variables, onMutateResult, context) => {
      // Roll back to previous value
      context.client.setQueryData(
        queryKeys.todos.detail(onMutateResult.newTodo.id),
        onMutateResult.previousTodo
      )
    },

    // Always refetch after error or success:
    onSettled: (data, error, variables, onMutateResult, context) => {
      context.client.invalidateQueries({
        queryKey: queryKeys.todos.detail(variables.id)
      })
    },
  })
}

// Usage
function TodoItem({ todo }: { todo: Todo }) {
  const updateTodo = useTodoUpdate()

  const handleToggle = () => {
    updateTodo.mutate({ ...todo, completed: !todo.completed })
  }

  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={updateTodo.isPending}
      />
      {todo.text}
    </div>
  )
}
```

**List Update (Adding Item)**:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

type TodoList = { items: Todo[]; ts: number }

function useAddTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (text: string) => {
      const response = await api.createTodo({ text })
      return response
    },

    onMutate: async (newTodoText, context) => {
      // 1. Cancel any outgoing refetches
      await context.client.cancelQueries({
        queryKey: queryKeys.todos.all
      })

      // 2. Snapshot the previous value
      const previousTodos = context.client.getQueryData<TodoList>(
        queryKeys.todos.all
      )

      // 3. Optimistically update to the new value
      if (previousTodos) {
        context.client.setQueryData<TodoList>(
          queryKeys.todos.all,
          {
            ...previousTodos,
            items: [
              ...previousTodos.items,
              { id: Math.random().toString(), text: newTodoText, completed: false },
            ],
          }
        )
      }

      // 4. Return a result object with the snapshotted value
      return { previousTodos }
    },

    onError: (err, variables, onMutateResult, context) => {
      // Roll back to previous value
      if (onMutateResult?.previousTodos) {
        context.client.setQueryData(
          queryKeys.todos.all,
          onMutateResult.previousTodos
        )
      }
    },

    onSettled: (data, error, variables, onMutateResult, context) => {
      // Refetch to get server truth
      context.client.invalidateQueries({
        queryKey: queryKeys.todos.all
      })
    },
  })
}
```

### Optimistic Update Pattern

1. **onMutate**:
   - Cancel outgoing queries (prevent race conditions)
   - Snapshot current cache data
   - Optimistically update cache
   - Return snapshot for rollback

2. **onError**:
   - Roll back cache to snapshot
   - Display error to user

3. **onSettled**:
   - Invalidate queries to refetch server truth
   - Runs after success OR error

### Best Practices

- **Always cancel queries** in `onMutate` to prevent race conditions
- **Always snapshot** previous data for rollback
- **Always invalidate** in `onSettled` to sync with server
- **Type the snapshot** for better IDE support
- **Use context.client** instead of `useQueryClient()` for access in callbacks

---

## 4. Infinite Queries

### Best Practice: Cursor-Based Pagination

Use `useInfiniteQuery` for "load more" or infinite scroll patterns with cursor-based pagination.

### Implementation Pattern

**API Response Shape**:

```typescript
type Page<T> = {
  items: T[]
  nextCursor: string | null
  prevCursor: string | null
}

type PostsPage = Page<Post>
```

**Basic Infinite Query**:

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

function usePosts() {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.lists(),

    queryFn: async ({ pageParam }) => {
      const response = await api.get<PostsPage>('posts', {
        searchParams: { cursor: pageParam }
      })
      return response
    },

    // Required: Initial page parameter
    initialPageParam: 0,

    // Required: Determine next page parameter
    getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
      return lastPage.nextCursor ?? undefined
    },

    // Optional: Determine previous page parameter
    getPreviousPageParam: (firstPage, allPages, firstPageParam, allPageParams) => {
      return firstPage.prevCursor ?? undefined
    },

    // Optional: Limit cached pages
    maxPages: 10, // Removes oldest page when exceeded
  })
}

// Usage
function PostsList() {
  const {
    data,
    error,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
  } = usePosts()

  if (status === 'pending') return <div>Loading...</div>
  if (status === 'error') return <div>Error: {error.message}</div>

  return (
    <div>
      {/* Previous button */}
      <button
        onClick={() => fetchPreviousPage()}
        disabled={!hasPreviousPage || isFetchingPreviousPage}
      >
        {isFetchingPreviousPage
          ? 'Loading more...'
          : hasPreviousPage
          ? 'Load Older'
          : 'Nothing more to load'}
      </button>

      {/* Render all pages */}
      {data.pages.map((page, i) => (
        <div key={i}>
          {page.items.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}

      {/* Next button */}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>

      {/* Background refetch indicator */}
      {isFetching && !isFetchingNextPage && !isFetchingPreviousPage && (
        <div>Refreshing...</div>
      )}
    </div>
  )
}
```

### Infinite Query API

**Options**:
- `initialPageParam` (required): Starting page parameter
- `getNextPageParam` (required): Returns next page param or `undefined`/`null` if no more pages
- `getPreviousPageParam` (optional): Returns previous page param or `undefined`/`null`
- `maxPages` (optional): Limit cached pages (removes oldest when exceeded)

**Return Values**:
- `data.pages`: Array of all fetched pages
- `data.pageParams`: Array of all page params used
- `fetchNextPage()`: Fetch next page manually
- `fetchPreviousPage()`: Fetch previous page manually
- `hasNextPage`: Boolean (true if `getNextPageParam` returns non-null)
- `hasPreviousPage`: Boolean (true if `getPreviousPageParam` returns non-null)
- `isFetchingNextPage`: Boolean (true while fetching next page)
- `isFetchingPreviousPage`: Boolean (true while fetching previous page)
- `isRefetching`: Boolean (background refetch, excluding initial load and page fetches)

### Best Practices

1. **Use cursor-based pagination** (not offset-based) for consistent results
2. **Return `undefined`/`null`** from `getNextPageParam` when no more pages
3. **Set `maxPages`** to limit memory usage for long lists
4. **Distinguish loading states**: Use `isFetchingNextPage` vs `isFetching`
5. **Handle edge cases**: No more pages, errors during page fetch

---

## 5. ky + React Query Integration

### Why ky Works Well with React Query

The ky HTTP client is ideal for React Query because:

1. **Native Promise rejection on HTTP errors**: 4xx/5xx status codes automatically throw, so React Query can retry/handle errors
2. **Lightweight & modern**: Uses native `fetch` API
3. **TypeScript-first**: Excellent type inference
4. **Retry built-in**: Configurable retry logic (can be overridden by React Query)

### Basic Integration

**File**: `src/lib/api-client.ts`

```typescript
import ky from 'ky'

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // Add auth token
        const token = localStorage.getItem('auth_token')
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        // Handle token refresh
        if (response.status === 401) {
          // Refresh token logic
        }
        return response
      },
    ],
  },
})
```

### Usage with React Query

**Basic query**:

```tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'

type User = { id: string; name: string; email: string }

function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async ({ signal }) => {
      // ky automatically rejects on 4xx/5xx
      // Pass signal for cancellation support
      const user = await api.get(`users/${userId}`, { signal }).json<User>()
      return user
    },
  })
}
```

**Mutation**:

```tsx
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

type CreateUserDto = { name: string; email: string }

function useCreateUser() {
  return useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const user = await api.post('users', { json: data }).json<User>()
      return user
    },
  })
}
```

### queryFn Pattern

The `queryFn` receives a `QueryFunctionContext` with:
- `queryKey`: The query key array
- `signal`: AbortSignal for cancellation
- `meta`: Optional metadata
- `pageParam`: For infinite queries

**Always pass `signal` to ky**:

```tsx
queryFn: async ({ signal }) => {
  return await api.get('endpoint', { signal }).json<T>()
}
```

This enables React Query to cancel in-flight requests when:
- Component unmounts
- Query key changes
- Manual cancellation

### Error Handling

ky throws `HTTPError` on non-2xx responses. React Query catches these and:
- Triggers retry logic (if enabled)
- Sets query to error state
- Calls `onError` callbacks

**Custom error handling**:

```tsx
import { HTTPError } from 'ky'

useQuery({
  queryKey: ['users'],
  queryFn: async ({ signal }) => {
    try {
      return await api.get('users', { signal }).json<User[]>()
    } catch (error) {
      if (error instanceof HTTPError) {
        const errorData = await error.response.json()
        throw new Error(errorData.message)
      }
      throw error
    }
  },
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error instanceof HTTPError && error.response.status < 500) {
      return false
    }
    return failureCount < 3
  },
})
```

### Best Practices

1. **Always pass `signal`** to ky for request cancellation
2. **Use ky's `.json<T>()`** for type-safe responses
3. **Configure ky hooks** for auth, logging, error handling
4. **Let React Query handle retries** (disable ky's retry if needed)
5. **Type your responses** with generics: `.json<User>()`

---

## 6. DevTools Setup

### Installation

```bash
npm install -D @tanstack/react-query-devtools
```

**Important**: Must be a dev dependency for Next.js 13+ App Router to work correctly.

### Basic Setup

The DevTools are already included in the `QueryProvider` examples above:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Configuration Options

```tsx
<ReactQueryDevtools
  initialIsOpen={false}           // Start closed
  buttonPosition="bottom-left"    // Position of toggle button
  position="bottom"               // Position of devtools panel
  errorTypes={[                   // Custom error type filters
    { name: 'Error', initializer: (query) => new Error('...') }
  ]}
  styleNonce="your-nonce"         // CSP nonce for inline styles
  shadowDOMTarget={document.body} // Shadow DOM mounting target
/>
```

### Features

1. **Query Inspector**: View all queries, their status, data, and timestamps
2. **Mutation Inspector**: Track all mutations and their lifecycle
3. **Cache Explorer**: Browse the entire query cache
4. **Query Invalidation**: Manually invalidate queries
5. **Refetch Control**: Trigger refetches
6. **Time Travel**: View query state over time

### Production Considerations

By default, DevTools are **only included in development builds**:

```typescript
// Automatically excluded in production
if (process.env.NODE_ENV === 'development') {
  // DevTools code here
}
```

You don't need to manually exclude DevTools in production builds - React Query handles this automatically.

### Custom DevTools Loader

If you want more control over when DevTools load:

```tsx
'use client'

import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/get-query-client'

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  }))
)

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
```

This pattern:
- Lazy loads DevTools only when needed
- Explicitly checks environment
- Uses Suspense for loading state

---

## Implementation Checklist

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools` (dev dependency)
- [ ] Create `QueryProvider` with proper SSR setup (server/browser client separation)
- [ ] Add `QueryProvider` to `app/layout.tsx`
- [ ] Set up query key factory pattern in `src/lib/query-keys.ts`
- [ ] Configure ky API client with auth hooks
- [ ] Enable ESLint rule `@tanstack/query/exhaustive-deps`
- [ ] Implement optimistic updates pattern for mutations
- [ ] Add DevTools to QueryProvider
- [ ] Test SSR hydration with prefetching
- [ ] Verify React 19 compatibility

---

## Success Criteria

- [x] React 19 compatibility confirmed (fully supported)
- [x] Next.js 16 App Router setup documented (basic + streaming)
- [x] Query key factory pattern documented with TypeScript
- [x] Optimistic updates pattern with rollback documented
- [x] Infinite query pattern with cursor pagination documented
- [x] ky integration with queryFn documented
- [x] DevTools setup with Next.js considerations documented
- [x] Production-ready patterns provided

---

## Sources

### Package Information
- [TanStack Query NPM Package](https://www.npmjs.com/package/@tanstack/react-query)
- [TanStack Query Releases](https://github.com/tanstack/query/releases)
- [Installation Guide](https://tanstack.com/query/v5/docs/react/installation)
- [TanStack Query DevTools NPM](https://www.npmjs.com/package/@tanstack/react-query-devtools)

### React 19 Compatibility
- [Medusa Issue: React 19 Support](https://github.com/medusajs/medusa/issues/12785)
- [TanStack Query Discussion: React 19 Experimental](https://github.com/TanStack/query/discussions/7074)
- [Migrating to TanStack Query v5](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
- [Can React v19 Replace React Query?](https://dev.to/rakhee/can-react-v19-replace-react-querytanstack-5gmh)

### Next.js Integration
- [TanStack Query Next.js Example](https://tanstack.com/query/v5/docs/framework/react/examples/nextjs)
- [TanStack Query Discussion: App Router Support](https://github.com/TanStack/query/discussions/5725)
- [Complete Guide to TanStack Query in Next.js App Router](https://ihsaninh.com/blog/the-complete-guide-to-tanstack-query-next.js-app-router)
- [Building Modern Blog with Next.js App Router & TanStack Query](https://medium.com/@bikkydahal/building-a-modern-blog-app-with-next-js-app-router-tanstack-query-and-rest-api-b183d5b7f729)
- [Advanced Server Rendering Guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Integrate TanStack Query with Next.js App Router (2025 Guide)](https://www.storieasy.com/blog/integrate-tanstack-query-with-next-js-app-router-2025-ultimate-guide)
- [Building Fully Hydrated SSR App](https://sangwin.medium.com/building-a-fully-hydrated-ssr-app-with-next-js-app-router-and-tanstack-query-5970aaf822d2)
- [Next.js 14+ Integration Guide](https://faun.pub/from-setup-to-execution-the-most-accurate-tanstack-query-and-next-js-14-integration-guide-8e5aff6ee8ba)
- [Server Rendering & Hydration](https://tanstack.com/query/v5/docs/framework/react/guides/ssr)

### Query Keys
- [ESLint: Exhaustive Deps](https://tanstack.com/query/v5/docs/eslint/exhaustive-deps)
- [Query Keys Guide](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys)

### Optimistic Updates
- [Optimistic Updates Guide (Angular)](https://tanstack.com/query/v5/docs/framework/angular/guides/optimistic-updates)
- [Optimistic Updates Example](https://tanstack.com/query/v5/docs/framework/react/examples/optimistic-updates-cache)
- [Optimistic Updates Guide (React)](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates)

### Infinite Queries
- [useInfiniteQuery Reference](https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery)
- [Infinite Queries Guide](https://tanstack.com/query/v5/docs/framework/solid/guides/infinite-queries)
- [Infinite Query with Max Pages Example](https://tanstack.com/query/v5/docs/framework/react/examples/infinite-query-with-max-pages)

### ky Integration
- [QueryClient Reference](https://tanstack.com/query/latest/docs/reference/QueryClient)
- [Ky Code Examples](https://snyk.io/advisor/npm-package/ky/example)
- [React Query Overview](https://handsonreact.com/docs/react-query)
- [React Query FAQs](https://tkdodo.eu/blog/react-query-fa-qs)
- [React Query as State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)

### DevTools
- [Devtools Documentation](https://tanstack.com/query/v5/docs/react/devtools)
- [Quick Start Guide](https://tanstack.com/devtools/latest/docs/quick-start)
- [Setting up React Query in Next.js](https://brockherion.dev/blog/posts/setting-up-and-using-react-query-in-nextjs/)
- [TanStack Query 101 with Next.js](https://dev.to/thekbbohara/tanstack-query-101-with-nextjs-ale)

---

**Research completed successfully. All deliverables created. Ready for implementation in branch 015-api-client-auth.**
