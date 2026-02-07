# Integration Module: API Client & Auth Flow

## Описание
HTTP клиент (axios), interceptors для JWT, auth context/provider, protected routes, token refresh logic. Замена mock auth на реальный backend.

## Зависимости
- Frontend 01-design-system (готов)
- Frontend 02-auth-screens (готов)
- Backend Auth module (готов)

## Сложность: Средняя
## Приоритет: P0 (Must — первый модуль интеграции)
## Estimated: 1-2 дня

---

## Задачи

### Task 1: Axios Instance & Interceptors
**Файл:** `lib/api/client.ts`
**Описание:** Настроенный axios instance с auth interceptors

```typescript
// Конфигурация
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor: добавляет Authorization header
api.interceptors.request.use((config) => {
  const token = getAccessToken(); // из cookie или localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: 
// - 401 → попытка refresh token → retry original request
// - Если refresh тоже 401 → logout → redirect /login
// - Другие ошибки → стандартная обработка
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api(error.config);
      }
      logout();
      redirect('/login');
    }
    return Promise.reject(error);
  }
);
```

**Acceptance Criteria:**
- [ ] Axios instance создан с базовыми настройками
- [ ] Request interceptor добавляет Bearer token
- [ ] Response interceptor обрабатывает 401 → refresh → retry
- [ ] При невозможности refresh → logout + redirect
- [ ] Timeout 30s настроен

### Task 2: Token Management
**Файл:** `lib/api/tokens.ts`
**Описание:** Функции для работы с JWT токенами

```typescript
// Хранение: httpOnly cookie для access_token (secure, sameSite)
// Fallback: localStorage если cookies недоступны

function setTokens(accessToken: string, refreshToken: string): void
function getAccessToken(): string | null
function getRefreshToken(): string | null
function clearTokens(): void
function isTokenExpired(token: string): boolean // декодируем JWT, проверяем exp

async function refreshToken(): Promise<string | null>
// POST /api/auth/refresh { refresh_token }
// Если успех → setTokens с новыми → return new access_token
// Если ошибка → clearTokens → return null
```

**Acceptance Criteria:**
- [ ] Токены сохраняются/читаются/удаляются
- [ ] isTokenExpired корректно парсит JWT exp
- [ ] refreshToken вызывает API и обновляет пару токенов
- [ ] При ошибке refresh — токены чистятся

### Task 3: Auth API Functions
**Файл:** `lib/api/auth.ts`
**Описание:** API функции для auth endpoints

```typescript
interface LoginRequest { email: string; password: string }
interface RegisterRequest { email: string; password: string; full_name?: string }
interface AuthResponse { user: User; access_token: string; refresh_token: string }

async function login(data: LoginRequest): Promise<AuthResponse>
// POST /api/auth/login → setTokens → return response

async function register(data: RegisterRequest): Promise<AuthResponse>
// POST /api/auth/register → setTokens → return response

async function logout(): Promise<void>
// POST /api/auth/logout → clearTokens

async function forgotPassword(email: string): Promise<void>
// POST /api/auth/forgot-password

async function resetPassword(token: string, password: string): Promise<void>
// POST /api/auth/reset-password
```

**Acceptance Criteria:**
- [ ] Все 5 функций реализованы
- [ ] login/register сохраняют токены при успехе
- [ ] logout чистит токены
- [ ] Типизация полная (TypeScript interfaces)

### Task 4: Auth Context & Provider
**Файл:** `lib/auth/auth-context.tsx`, `lib/auth/auth-provider.tsx`
**Описание:** React Context для глобального auth state

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;      // первичная загрузка (проверка токена)
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

// AuthProvider:
// 1. При mount → проверяет есть ли access_token
// 2. Если есть → GET /api/users/me → сохранить user
// 3. Если нет или ошибка → user = null
// 4. isLoading = false после проверки
```

**Acceptance Criteria:**
- [ ] Context создан с правильными типами
- [ ] Provider проверяет auth при mount
- [ ] login/register обновляют user в context
- [ ] logout чистит user
- [ ] isLoading true пока проверяется токен

### Task 5: Protected Route Middleware
**Файл:** `middleware.ts` (Next.js middleware), `components/auth/protected-route.tsx`
**Описание:** Защита маршрутов от неавторизованных

**Next.js Middleware (`middleware.ts`):**
- Проверяет наличие access_token cookie
- Если нет → redirect /login для protected routes
- Protected: /dashboard, /projects, /templates, /settings
- Public: /, /login, /register, /forgot-password

**Client-side Guard (`protected-route.tsx`):**
- Обёртка для страниц
- Использует AuthContext
- Показывает loading skeleton пока isLoading
- Redirect /login если !isAuthenticated

**Acceptance Criteria:**
- [ ] Middleware перехватывает запросы к protected routes
- [ ] Redirect на /login если нет токена
- [ ] Client-side guard как fallback
- [ ] Loading state пока проверяется auth

### Task 6: Подключение Auth Screens к реальному API
**Файлы:** Обновление `app/(auth)/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
**Описание:** Заменить mock вызовы на реальные API через AuthContext

**Login Page:**
- Вызывает `authContext.login({ email, password })`
- Loading state на кнопке
- Error: toast с сообщением от API (e.g. "Invalid credentials")
- Success: redirect /dashboard

**Register Page:**
- Вызывает `authContext.register({ email, password, full_name })`
- Error: обработка 409 Conflict (email уже существует)
- Success: redirect /dashboard

**Forgot Password:**
- Вызывает API напрямую (`forgotPassword(email)`)
- Success state: "Check your email"

**Acceptance Criteria:**
- [ ] Login работает с реальным API
- [ ] Register работает с реальным API
- [ ] Ошибки отображаются корректно (toast)
- [ ] Redirect после успешной auth
- [ ] Loading states на кнопках
