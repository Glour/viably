# Viably Frontend

Next.js 14 application for Viably platform.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies:**
```bash
npm install
# or
yarn install
```

2. **Environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local
```

3. **Run development server:**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Auth pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/       # Protected pages
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── templates/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   ├── dashboard/        # Dashboard components
│   ├── projects/         # Project components
│   └── templates/        # Template components
├── lib/
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth utilities
│   └── utils.ts          # Helpers
├── stores/
│   ├── auth.ts           # Auth state (Zustand)
│   ├── projects.ts       # Projects state
│   └── credits.ts        # Credits state
├── types/
│   └── index.ts          # TypeScript types
└── public/
    └── images/
```

---

## 🎨 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** Zustand 4.5
- **Data Fetching:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Code Editor:** Monaco Editor
- **Icons:** Lucide React

---

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
npm run format       # Format with Prettier
```

### Adding UI Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

---

## 📝 Environment Variables

Create `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Environment
NEXT_PUBLIC_ENVIRONMENT=development

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## 🎨 Styling

### Tailwind Configuration

Custom colors in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    50: '#f0fdf4',
    // ... green shades for "viable"
    600: '#10b981',
  },
  accent: {
    // ... yellow/orange for energy
  }
}
```

### CSS Variables

Global styles in `app/globals.css`:

```css
:root {
  --primary: 142.1 76.2% 36.3%;
  --accent: 38.4 92.1% 50.2%;
}
```

---

## 📦 State Management

### Zustand Stores

**Auth Store (`stores/auth.ts`):**
```typescript
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => { ... },
  logout: () => { ... },
}))
```

**Usage:**
```typescript
const { user, login } = useAuthStore()
```

---

## 🌐 API Integration

### API Client (`lib/api.ts`)

```typescript
import { create } from 'apisauce'

export const api = create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Auto-attach token
api.addRequestTransform((request) => {
  const token = useAuthStore.getState().token
  if (token) {
    request.headers.Authorization = `Bearer ${token}`
  }
})
```

### React Query

```typescript
import { useQuery } from '@tanstack/react-query'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects'),
  })
}
```

---

## 🧪 Testing

### Unit Tests (Jest + React Testing Library)

```bash
npm run test
npm run test:watch
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
npm run test:e2e:ui
```

---

## 🎨 Component Guidelines

### File Naming
- `PascalCase.tsx` for components
- `kebab-case.ts` for utilities
- `index.ts` for barrel exports

### Component Structure

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface MyComponentProps {
  title: string
  onSubmit: () => void
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [loading, setLoading] = useState(false)
  
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={onSubmit} loading={loading}>
        Submit
      </Button>
    </div>
  )
}
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables in Vercel

Add all `NEXT_PUBLIC_*` variables in:  
Project Settings → Environment Variables

---

## 📖 Screen Documentation

All screen specifications in `/docs/frontend/`:

- [Auth Screens](../docs/frontend/auth-screens.md)
- [Dashboard](../docs/frontend/dashboard.md)
- [Template Gallery](../docs/frontend/template-gallery.md)
- [Generation Flow](../docs/frontend/generation-flow.md)

---

## 🎯 Performance

### Optimization Tips

- Use `next/image` for images
- Lazy load heavy components
- Code splitting with dynamic imports
- Memoize expensive calculations
- Use React Server Components where possible

### Bundle Analysis

```bash
npm run build
npm run analyze
```

---

## 🔒 Security

- All API calls use HTTPS in production
- Tokens stored in httpOnly cookies
- XSS prevention (sanitized inputs)
- CSRF protection
- Content Security Policy

---

## 🤝 Contributing

1. Read screen specification in `/docs/frontend/`
2. Create feature branch
3. Build component
4. Write tests
5. Check types and lint
6. Create pull request

---

**Status:** In Development  
**Node Version:** 18+  
**Framework:** Next.js 14
