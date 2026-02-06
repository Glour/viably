# Frontend Module: Auth Screens

## Описание
Login, Register, Forgot Password страницы. Split layout: декоративная панель слева + форма справа.

## Зависимости
- 01-design-system (компоненты, layout, тема)

## Сложность: Средняя
## Приоритет: P0 (Must)
## Estimated: 1 день

---

## Задачи

### Task 1: Auth Layout
**Файл:** `app/(auth)/layout.tsx`
**Описание:** Двухколоночный layout для всех auth страниц

```
┌──────────────────────┬──────────────────────────────────┐
│  Декоративная панель │  Форма (55% width, centered)     │
│  (45% width)         │                                   │
│                      │  Logo + Form + Social buttons    │
│  Gradient bg с       │                                   │
│  glow orbs,          │                                   │
│  floating shapes     │                                   │
│  + цитата/stats      │                                   │
│                      │                                   │
│  Hidden on mobile    │  Full width on mobile             │
└──────────────────────┴──────────────────────────────────┘
```

**Декоративная панель:**
- Gradient background (primary → dark)
- 2-3 glow orbs (float animation)
- Текст: "Create anything. Ship instantly." (Space Grotesk, 48px, white)
- Stats: "1,200+ bots deployed" (small badge)

**Acceptance Criteria:**
- [ ] Split layout на desktop
- [ ] Левая панель скрывается на mobile (< 768px)
- [ ] Glow orbs анимируются
- [ ] Форма центрирована вертикально

### Task 2: Login Page
**Файл:** `app/(auth)/login/page.tsx`
**Описание:** Страница входа

**Элементы:**
- Logo (Viably icon + text)
- Heading: "Welcome back" (Space Grotesk, 28px)
- Subtitle: "Sign in to continue building amazing bots"
- Email input (с validation)
- Password input (с toggle visibility)
- "Forgot password?" link (text-primary, hover underline)
- "Sign In" button (gradient primary, full width)
- Divider: "── or ──"
- Social buttons: Google, GitHub (secondary style, icons)
- "Don't have an account? Sign up →" link

**Form Validation (React Hook Form + Zod):**
- Email: required, valid email format
- Password: required, min 8 chars
- Error messages: red text below input, shake animation on submit fail

**States:**
- Default
- Loading (button shimmer + disabled)
- Error (toast notification + field errors)
- Success → redirect to /dashboard

**Acceptance Criteria:**
- [ ] Form validation works (client-side)
- [ ] Password visibility toggle
- [ ] Loading state on submit
- [ ] Error handling with toast
- [ ] Social login buttons (visual only for MVP, no backend yet)
- [ ] Redirect to /dashboard on success
- [ ] "Forgot password" links to /forgot-password
- [ ] "Sign up" links to /register

### Task 3: Register Page
**Файл:** `app/(auth)/register/page.tsx`
**Описание:** Страница регистрации

**Элементы:**
- Logo
- Heading: "Create your account" (Space Grotesk, 28px)
- Subtitle: "Start building bots in 60 seconds"
- Name input
- Email input
- Password input (с strength indicator)
- Confirm Password input
- Terms checkbox: "I agree to Terms of Service and Privacy Policy"
- "Create Account" button (gradient, full width)
- Divider + Social buttons
- "Already have an account? Sign in →"

**Password Strength Indicator:**
- Bar below password input (4 segments)
- Weak (red, 1 segment), Fair (orange, 2), Good (yellow, 3), Strong (green, 4)
- Rules text: "8+ chars, uppercase, number, special char"

**Validation:**
- Name: required, 2-50 chars
- Email: required, valid format
- Password: required, min 8, uppercase, number, special char
- Confirm: must match password
- Terms: must be checked

**Acceptance Criteria:**
- [ ] All validation works
- [ ] Password strength indicator updates in real-time
- [ ] Confirm password match validation
- [ ] Terms checkbox required
- [ ] Loading/error/success states

### Task 4: Forgot Password Page
**Файл:** `app/(auth)/forgot-password/page.tsx`
**Описание:** Сброс пароля

**Элементы:**
- Logo
- Heading: "Reset your password"
- Subtitle: "Enter your email and we'll send you a reset link"
- Email input
- "Send Reset Link" button (gradient)
- "← Back to Sign In" link

**States:**
- Default
- Loading
- Success: "Check your email! We sent a reset link to {email}"
- Error: "No account found with this email"

**Acceptance Criteria:**
- [ ] Email validation
- [ ] Success state shows email confirmation message
- [ ] Back link works
