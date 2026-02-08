# Data Model: Frontend Memory Optimization

**Feature**: 020-memory-optimization
**Date**: 2026-02-08
**Phase**: 1 - Design

## Overview

Эта фича не вводит новые бизнес-сущности в базе данных. Вместо этого определяются runtime сущности для мониторинга и управления памятью в клиентском приложении.

## Runtime Entities

### Memory Snapshot

**Purpose**: Снимок состояния памяти приложения в определенный момент времени для анализа и отслеживания утечек.

**Attributes**:
- `timestamp`: number - Unix timestamp момента снимка
- `heapSizeUsed`: number - Используемый размер heap в байтах
- `heapSizeLimit`: number - Максимальный размер heap в байтах
- `totalJSHeapSize`: number - Общий размер JS heap в байтах
- `usedJSHeapSize`: number - Используемый размер JS heap в байтах
- `jsHeapSizeLimit`: number - Лимит JS heap в байтах
- `componentCount`: number - Количество активных React компонентов (опционально)
- `eventListenerCount`: number - Количество активных event listeners (опционально)

**Source**: `performance.memory` API (Chrome/Edge) или custom tracking

**Lifecycle**:
- Создается при вызове `captureMemorySnapshot()`
- Хранится в массиве snapshots для сравнения
- Очищается при превышении лимита (хранить max 100 последних)

**Validation Rules**:
- `heapSizeUsed` не должен превышать `heapSizeLimit`
- `timestamp` должен быть валидным Unix timestamp
- Все размеры должны быть неотрицательными числами

**Relationships**:
- Массив snapshots используется для построения графика потребления памяти
- Сравнение snapshots выявляет memory leaks (постоянный рост)

---

### Component Lifecycle Tracker

**Purpose**: Отслеживание жизненного цикла React-компонентов и связанных ресурсов для обеспечения корректной очистки.

**Attributes**:
- `componentId`: string - Уникальный идентификатор компонента (display name + instance ID)
- `mountedAt`: number - Timestamp монтирования компонента
- `unmountedAt`: number | null - Timestamp размонтирования (null если активен)
- `subscriptions`: Subscription[] - Массив активных подписок
- `timers`: Timer[] - Массив активных таймеров/интервалов
- `eventListeners`: EventListener[] - Массив активных слушателей событий
- `externalResources`: ExternalResource[] - WebSocket, Monaco models, etc.

**Subscription Type**:
```typescript
{
  id: string;
  type: 'event' | 'timer' | 'interval' | 'websocket' | 'query' | 'custom';
  createdAt: number;
  cleaned: boolean;
  cleanupFn: () => void;
}
```

**Lifecycle**:
- Создается при монтировании компонента (dev mode only)
- Обновляется при добавлении/удалении subscriptions
- Финализируется при размонтировании компонента
- Проверяется при unmount: если subscriptions не очищены → warning в console

**Validation Rules**:
- Все subscriptions должны иметь `cleanupFn`
- При unmount все subscriptions должны иметь `cleaned: true`
- `unmountedAt` должен быть >= `mountedAt`

**Dev Mode Warning**:
```
⚠️ Component <ComponentName> unmounted with active subscriptions:
  - WebSocket connection (created 5000ms ago)
  - Interval timer (created 3000ms ago)
```

---

### Cache Policy

**Purpose**: Политика управления кэшем для React Query и Zustand store для предотвращения бесконечного роста памяти.

**Attributes**:
- `staleTime`: number - Время в миллисекундах, после которого данные считаются устаревшими (default: 5 минут)
- `gcTime`: number - Время в миллисекундах, после которого неиспользуемые данные удаляются из кэша (default: 10 минут)
- `maxQueries`: number - Максимальное количество queries в кэше одновременно (default: 50)
- `maxSize`: number - Максимальный размер кэша в байтах (опционально)
- `persistKeys`: string[] - Ключи, которые не должны удаляться при gcTime

**React Query Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: policy.staleTime,
      gcTime: policy.gcTime,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Zustand Store Policy**:
```typescript
interface StoreState {
  data: Record<string, unknown>;
  maxSize: number;
  reset: () => void;
  prune: () => void; // Remove old entries if size > maxSize
}
```

**Lifecycle**:
- Инициализируется при создании QueryClient
- Применяется глобально ко всем queries
- Может быть переопределена для конкретных queries

**Validation Rules**:
- `staleTime` < `gcTime` (данные должны стать stale до GC)
- `gcTime` > 0 (иначе кэш растет бесконечно)
- `maxQueries` >= 10 (минимальный кэш для нормальной работы)

**State Transitions**:
```
Fresh (< staleTime) → Stale (< gcTime) → Garbage Collected
```

---

### Lazy-Loaded Module

**Purpose**: Модуль или компонент, загружаемый по требованию, с отслеживанием момента загрузки и выгрузки из памяти.

**Attributes**:
- `moduleId`: string - Уникальный идентификатор модуля (путь к файлу)
- `loadedAt`: number | null - Timestamp загрузки (null если не загружен)
- `unloadedAt`: number | null - Timestamp выгрузки (null если в памяти)
- `size`: number - Размер модуля в байтах (из webpack stats)
- `loadTime`: number - Время загрузки в миллисекундах
- `usageCount`: number - Количество активных использований модуля
- `priority`: 'high' | 'medium' | 'low' - Приоритет загрузки

**Next.js Dynamic Import**:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false, // Если не нужен SSR
});
```

**Lifecycle**:
1. **Not Loaded**: Модуль еще не запрашивался
2. **Loading**: Запрос отправлен, ожидание ответа
3. **Loaded**: Модуль в памяти, готов к использованию
4. **Active**: Модуль используется (usageCount > 0)
5. **Idle**: Модуль загружен, но не используется (usageCount = 0)
6. **Unloaded**: Модуль выгружен из памяти (только теория, JS не выгружает модули явно)

**Validation Rules**:
- `loadedAt` <= `unloadedAt` (если оба не null)
- `usageCount` >= 0
- `loadTime` > 0 (если загружен)
- `size` > 0 (если известен)

**Monitoring**:
```typescript
// Track module loading
const modules = new Map<string, LazyLoadedModule>();

function trackModuleLoad(moduleId: string, size: number, loadTime: number) {
  modules.set(moduleId, {
    moduleId,
    loadedAt: Date.now(),
    unloadedAt: null,
    size,
    loadTime,
    usageCount: 1,
    priority: 'medium',
  });
}
```

---

## Entity Relationships

```
Component Lifecycle Tracker
  ├── manages → Subscriptions (event listeners, timers, etc.)
  ├── references → External Resources (WebSocket, Monaco models)
  └── contributes to → Memory Snapshot (component count)

Cache Policy
  ├── applies to → React Query cache
  ├── applies to → Zustand stores
  └── influences → Memory Snapshot (cache size)

Lazy-Loaded Module
  ├── tracked by → Component Lifecycle Tracker (if component)
  └── contributes to → Memory Snapshot (total heap size)

Memory Snapshot
  ├── aggregates → Component count
  ├── aggregates → Cache size
  ├── aggregates → Module size
  └── compared with → Previous snapshots (leak detection)
```

---

## Storage Strategy

### Development Mode
- Component Lifecycle Tracker: In-memory WeakMap (не влияет на production)
- Memory Snapshots: In-memory array (max 100 snapshots, rolling window)
- Module tracking: In-memory Map

### Production Mode
- Component Lifecycle Tracker: Disabled (только в dev)
- Memory Snapshots: Disabled (только при explicit debugging)
- Cache Policy: Active (React Query & Zustand)

### Persistence
- **None**: Все runtime данные теряются при перезагрузке страницы
- **Exception**: Cache Policy settings могут быть persisted в localStorage (опционально)

---

## Implementation Notes

1. **WeakMap для Component Tracking**: Использовать WeakMap для автоматической очистки при GC компонентов
2. **Performance API**: Использовать `performance.memory` (Chrome) и `performance.measureUserAgentSpecificMemory()` (экспериментальный)
3. **Dev-Only Overhead**: Component Lifecycle Tracker активен только в development mode
4. **Type Safety**: Все сущности полностью типизированы с Zod schemas для validation

---

## Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const memorySnapshotSchema = z.object({
  timestamp: z.number().int().positive(),
  heapSizeUsed: z.number().nonnegative(),
  heapSizeLimit: z.number().positive(),
  totalJSHeapSize: z.number().nonnegative(),
  usedJSHeapSize: z.number().nonnegative(),
  jsHeapSizeLimit: z.number().positive(),
  componentCount: z.number().int().nonnegative().optional(),
  eventListenerCount: z.number().int().nonnegative().optional(),
});

export type MemorySnapshot = z.infer<typeof memorySnapshotSchema>;

export const cachePolicySchema = z.object({
  staleTime: z.number().int().positive(),
  gcTime: z.number().int().positive(),
  maxQueries: z.number().int().min(10),
  maxSize: z.number().int().positive().optional(),
  persistKeys: z.array(z.string()).default([]),
}).refine(data => data.staleTime < data.gcTime, {
  message: "staleTime must be less than gcTime",
});

export type CachePolicy = z.infer<typeof cachePolicySchema>;
```

---

## Next Steps

✅ Data model defined
→ Create contracts for monitoring API (if needed)
→ Create quickstart.md with implementation guide
→ Update agent context with new technologies
