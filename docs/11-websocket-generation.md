# Integration Module: WebSocket & Generation Flow

## Описание
Реальное подключение WebSocket для generation progress. Замена setTimeout mock на живое соединение с бэкендом. Интеграция deploy flow.

## Зависимости
- 09-api-client-auth (auth tokens для WS)
- 10-data-hooks (useProject, useCreateProject)
- Frontend 06-generation-flow (UI готов)
- Backend AI + Deploy modules (готовы)

## Сложность: ВЫСОКАЯ
## Приоритет: P0 (Must — ядро продукта)
## Estimated: 2-3 дня

---

## Задачи

### Task 1: WebSocket Client
**Файл:** `lib/ws/websocket-client.ts`
**Описание:** Переиспользуемый WebSocket клиент с reconnect

```typescript
interface WSClientOptions {
  url: string;
  token: string;           // JWT для авторизации
  onMessage: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;     // default: true
  reconnectInterval?: number; // default: 3000ms
  maxReconnects?: number;   // default: 5
}

class WebSocketClient {
  connect(): void
  disconnect(): void
  send(data: any): void
  isConnected: boolean
}

// URL: ws://localhost:8000/ws/{user_id}?token={jwt}
// Backend отправляет сообщения через Redis pub/sub → WS
```

**Reconnect Logic:**
- При обрыве: ждёт reconnectInterval → пробует снова
- Экспоненциальный backoff: 3s → 6s → 12s → 24s → 48s
- После maxReconnects: onError, прекращает попытки
- При переключении на другую вкладку и обратно: reconnect

**Message Format от Backend:**
```json
{
  "type": "generation_progress",
  "project_id": "uuid",
  "data": {
    "step": 3,
    "step_name": "Writing code",
    "step_status": "running",
    "progress": 45,
    "log": "Generating handlers/shop.py...",
    "code_snippet": "async def handle_catalog(message):\n    ..."
  }
}
```

**Типы сообщений:**
- `generation_progress` — прогресс генерации
- `generation_complete` — генерация завершена
- `generation_error` — ошибка генерации
- `deploy_progress` — прогресс деплоя
- `deploy_complete` — деплой завершён
- `deploy_error` — ошибка деплоя
- `credits_updated` — баланс кредитов изменился

**Acceptance Criteria:**
- [ ] WS подключается с JWT авторизацией
- [ ] Reconnect с exponential backoff
- [ ] Парсит JSON сообщения
- [ ] Обрабатывает все типы сообщений
- [ ] Graceful disconnect при unmount

### Task 2: useGeneration Hook (реальный)
**Файл:** `lib/hooks/use-generation.ts` (замена mock версии)
**Описание:** Полноценный hook управления генерацией

```typescript
interface UseGenerationReturn {
  // State
  status: 'idle' | 'generating' | 'complete' | 'error';
  currentStep: number;
  steps: GenerationStep[];
  progress: number;           // 0-100
  codeSnippets: string[];     // появляющиеся куски кода
  generatedCode: GeneratedFile[] | null;
  error: string | null;
  
  // Actions
  startGeneration: (config: ProjectConfig) => Promise<void>;
  retryGeneration: () => Promise<void>;
  cancelGeneration: () => Promise<void>;
}

function useGeneration(projectId: string): UseGenerationReturn {
  // 1. startGeneration:
  //    POST /api/projects/{id}/generate { config }
  //    → Backend возвращает 202 Accepted
  //    → Открываем WebSocket
  //    → Слушаем generation_progress messages
  
  // 2. WebSocket messages обновляют:
  //    - steps[] (status каждого шага)
  //    - progress (0-100)
  //    - codeSnippets (для анимации кода)
  //    - currentStep
  
  // 3. generation_complete:
  //    - generatedCode = массив файлов
  //    - status = 'complete'
  //    - invalidate project query (обновить status)
  
  // 4. generation_error:
  //    - error = сообщение
  //    - status = 'error'
  //    - credits НЕ списаны (backend сам refund)
  
  // 5. cancelGeneration:
  //    POST /api/projects/{id}/cancel-generation
  //    → disconnect WS
}
```

**Steps Definition:**
```typescript
const GENERATION_STEPS: GenerationStep[] = [
  { name: 'Analyzing template', status: 'pending' },
  { name: 'Generating architecture', status: 'pending' },
  { name: 'Writing code', status: 'pending' },
  { name: 'Code review', status: 'pending' },
  { name: 'Testing', status: 'pending' },
  { name: 'Finalizing', status: 'pending' },
];
```

**Acceptance Criteria:**
- [ ] startGeneration отправляет POST и открывает WS
- [ ] Steps обновляются в реальном времени
- [ ] Progress bar двигается
- [ ] Code snippets появляются (typewriter)
- [ ] Complete → загружает код файлы
- [ ] Error → показывает ошибку + возможность retry
- [ ] Cancel → отменяет генерацию
- [ ] При уходе со страницы → WS закрывается

### Task 3: useDeploy Hook
**Файл:** `lib/hooks/use-deploy.ts`
**Описание:** Hook управления процессом деплоя

```typescript
interface UseDeployReturn {
  status: 'idle' | 'deploying' | 'success' | 'error';
  currentStep: number;
  steps: DeployStep[];
  progress: number;
  deploymentInfo: DeploymentInfo | null;
  error: string | null;
  
  startDeploy: (envVars: Record<string, string>) => Promise<void>;
  retryDeploy: () => Promise<void>;
}

// Deploy Steps:
const DEPLOY_STEPS = [
  { name: 'Creating GitHub repo' },
  { name: 'Pushing code' },
  { name: 'Connecting to Railway' },
  { name: 'Building container' },
  { name: 'Starting bot' },
  { name: 'Health check' },
];

// startDeploy:
// POST /api/projects/{id}/deploy { platform: 'railway', env_variables }
// → 202 Accepted
// → Listen WS for deploy_progress messages
// → deploy_complete → deploymentInfo with URL, bot username
```

**DeploymentInfo:**
```typescript
interface DeploymentInfo {
  platform: string;
  url: string;             // Railway URL
  botUsername: string;      // @my_shop_bot
  botUrl: string;          // https://t.me/my_shop_bot
  status: 'running';
  deployedAt: string;
}
```

**Acceptance Criteria:**
- [ ] startDeploy отправляет env vars и слушает WS
- [ ] Steps обновляются (building container — самый долгий)
- [ ] Success → показывает bot info + Telegram link
- [ ] Error → retry возможность
- [ ] Download ZIP всегда доступен как альтернатива

### Task 4: Подключение Generation UI к реальным hooks
**Файлы:** Обновление `components/generation/*.tsx`
**Описание:** Замена mock useGeneration на реальный

**Chat Panel:**
- Config form отправляет данные через `startGeneration(config)`
- Free text input тоже через `startGeneration({ freeText: '...' })`
- Generate button: disabled во время generating

**Preview Panel:**
- IDLE → placeholder (без изменений)
- GENERATING → реальные steps из WS, реальные code snippets
- COMPLETE → загрузка кода через `useProjectCode(id)`, Monaco editor
- ERROR → реальное сообщение ошибки

**Deploy Modal:**
- Подключить `useDeploy(projectId)`
- Phase 1 (config) → собирает env vars
- Phase 2 (progress) → реальные deploy steps из WS
- Phase 3 (success) → реальная deploymentInfo (bot URL)

**Acceptance Criteria:**
- [ ] Generation flow работает end-to-end с реальным API
- [ ] Progress обновляется через WebSocket
- [ ] Code отображается после генерации
- [ ] Deploy работает end-to-end
- [ ] Confetti на deploy success
- [ ] Error handling на всех этапах

### Task 5: Credits Integration в Generation Flow
**Файл:** Обновления в generation components
**Описание:** Проверка и списание кредитов

**Перед генерацией:**
- `useCreditBalance()` → проверить хватает ли
- Если credits < template.creditCost:
  - Кнопка "Генерировать" disabled
  - Текст: "Недостаточно кредитов ({have}/{need})"
  - Ссылка: "Пополнить →" → /settings/billing
- Показать стоимость: "🚀 Генерировать (5 кредитов)"

**После генерации:**
- WS отправляет `credits_updated` → invalidate credits.balance
- Navbar badge обновляется автоматически (React Query)
- Если ошибка → credits refunded → баланс не изменился

**Acceptance Criteria:**
- [ ] Credit check перед генерацией
- [ ] Disabled button если нехватка
- [ ] Баланс обновляется в navbar после списания
- [ ] Refund при ошибке (баланс возвращается)

### Task 6: Error Handling & Offline States
**Файл:** `lib/api/error-handler.ts`, `components/ui/error-boundary.tsx`
**Описание:** Глобальная обработка ошибок

**API Error Handler:**
```typescript
function handleApiError(error: AxiosError): AppError {
  // 400 → validation error (показать поля)
  // 401 → unauthorized (refresh token flow)
  // 403 → forbidden (показать сообщение)
  // 404 → not found (redirect или сообщение)
  // 409 → conflict (e.g. email exists)
  // 422 → validation (показать поля)
  // 429 → rate limit (показать "Подождите...")
  // 500 → server error (generic сообщение)
  // Network error → "Нет подключения к серверу"
}
```

**Toast Notifications:**
- Success: green, 3s auto-dismiss
- Error: red, 5s, с деталями
- Info: blue, 3s
- Warning: amber, 5s

**Error Boundary:**
- Обёртка для critical sections
- При crash → fallback UI "Что-то пошло не так" + Retry button
- Логирование (console + optional Sentry)

**Offline Detection:**
- `navigator.onLine` + event listeners
- Banner: "Нет подключения к интернету" (top, fixed, amber)
- Disable mutations когда offline
- Auto-retry queries когда online

**Acceptance Criteria:**
- [ ] Все API ошибки обрабатываются с toast
- [ ] Error boundary для critical components
- [ ] Offline banner
- [ ] Rate limit handling (429 → "Подождите")
