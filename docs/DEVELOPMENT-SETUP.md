# Development Setup Guide

**Last Updated**: 2026-02-08
**Target Audience**: Frontend developers joining the Viably project
**Estimated Time**: 20 minutes

---

## Prerequisites

Before starting, ensure you have:

- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **IDE**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Glour/viably.git
cd viably/frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages (~1.1GB, takes 2-3 minutes).

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags (Development)
NEXT_PUBLIC_ENABLE_MEMORY_MONITOR=true
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true

# Optional: Disable analytics in dev mode
NEXT_PUBLIC_ENABLE_POSTHOG=false
NEXT_PUBLIC_ENABLE_SENTRY=false
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Memory Monitoring Setup

Viably includes a built-in memory monitoring system to help you identify and fix memory leaks during development.

### Enable MemoryMonitor Component

The `MemoryMonitor` component is already included in the root layout, but you can enable/disable it based on your needs.

#### Current Setup (Already Configured)

The component should already be added to `app/layout.tsx`. Verify it's present:

```tsx
// frontend/app/layout.tsx
import { MemoryMonitor } from '@/components/dev/MemoryMonitor';

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />

            {/* Memory Monitor - automatically hidden in production */}
            <MemoryMonitor />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
```

#### If Not Present, Add It

If `<MemoryMonitor />` is missing from your layout:

1. Open `frontend/app/layout.tsx`
2. Import the component: `import { MemoryMonitor } from '@/components/dev/MemoryMonitor';`
3. Add `<MemoryMonitor />` as the last child inside `<body>` (after `<Toaster />`)

### Using the Memory Monitor

Once your development server is running:

1. Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge
2. Look for a **dark panel in the bottom-right corner**
3. Click the **"Start"** button to begin monitoring
4. Navigate through the app and watch memory metrics

**Key Metrics:**
- **Current**: Memory currently in use (should be <80 MB)
- **Peak**: Highest memory usage since monitoring started
- **Average**: Mean memory usage over time
- **Growth**: Rate of memory increase (MB/minute)
  - **Blue text** (<1 MB/min): Normal, acceptable
  - **Red text** (>1 MB/min): **Potential memory leak!**

**Leak Detection:**
If you see a red warning banner ("⚠️ Potential memory leak detected!"), this means:
- Memory is growing consistently at >1 MB/min
- Components may not be cleaning up properly
- Check browser console for cleanup warnings

### Enable Advanced Memory Profiling (Chrome)

For more detailed memory analysis, start Chrome with memory profiling flags:

```bash
# macOS/Linux
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:3000

# Windows
chrome.exe --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:3000
```

This enables:
- **Precise memory measurements** (no rounding to nearest 100KB)
- **Manual garbage collection** via DevTools Console (`window.gc()`)

### Development Mode Warnings

The Viably frontend includes automatic memory leak detection. When a component unmounts without cleaning up resources, you'll see console warnings like:

```
⚠️ Memory Leak Warning: Uncleaned Event Listener in ProjectEditor
  Event listener was not cleaned up before unmount
  Details: {
    eventType: "resize",
    target: "window",
    registeredAt: "2026-02-08T12:34:56.789Z"
  }
```

**These warnings are intentional and should be treated as errors.**

**How to fix:**
1. Find the component mentioned in the warning
2. Add the `useComponentCleanup` hook
3. Register cleanup for the subscription/resource
4. Verify the warning is gone

Example fix:

```tsx
import { useComponentCleanup } from '@/hooks/useComponentCleanup';

function MyComponent() {
  const { registerSubscription } = useComponentCleanup('MyComponent');

  useEffect(() => {
    const handleResize = () => console.log('Resize');

    // Register cleanup BEFORE adding listener
    registerSubscription({
      type: 'event',
      createdAt: Date.now(),
      cleanupFn: () => window.removeEventListener('resize', handleResize),
    });

    window.addEventListener('resize', handleResize);
  }, [registerSubscription]);

  return <div>Content</div>;
}
```

See the [Memory Optimization Guide](./guides/memory-optimization.md) for detailed examples.

---

## Development Workflow

### Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout (add MemoryMonitor here)
│   ├── page.tsx           # Homepage
│   └── (authenticated)/   # Protected routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dev/              # Development-only components (MemoryMonitor)
│   └── ...
├── hooks/                 # Custom React hooks
│   ├── useMemoryMonitor.ts     # Memory monitoring hook
│   └── useComponentCleanup.ts  # Memory cleanup hook
├── lib/                   # Utilities and libraries
│   └── memory/           # Memory management utilities
└── public/               # Static assets
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run dev:clean        # Clean cache and start dev server

# Building
npm run build            # Production build
npm run start            # Start production server

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests (Playwright)

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier

# Analysis
ANALYZE=true npm run build    # Build with bundle analyzer
```

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add memory monitoring to dashboard"

# Push to remote
git push origin feature/my-feature

# Create a pull request on GitHub
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (runs on save in VS Code)
- **Linting**: ESLint with Next.js rules
- **Imports**: Absolute imports with `@/` prefix

Example:

```tsx
// ✅ GOOD: Absolute import
import { Button } from '@/components/ui/button';

// ❌ BAD: Relative import
import { Button } from '../../../components/ui/button';
```

---

## Troubleshooting

### Issue: Memory Monitor Not Showing

**Possible Causes:**
- Not in development mode (`NODE_ENV !== 'development'`)
- Component not added to layout
- Browser doesn't support `performance.memory` API (Firefox/Safari)

**Solution:**
1. Verify `npm run dev` is running (not `npm run start`)
2. Check `app/layout.tsx` includes `<MemoryMonitor />`
3. Use Chrome or Edge (Firefox/Safari show console warning)

### Issue: "Module not found: Can't resolve '@/components/dev/MemoryMonitor'"

**Cause:** Component file missing or incorrect import path.

**Solution:**
```bash
# Verify the file exists
ls -la frontend/components/dev/MemoryMonitor.tsx

# If missing, component may not be committed yet
git pull origin main
```

### Issue: Memory Warnings on Every Page

**Cause:** Legitimate memory leaks in components.

**Solution:**
1. **Don't ignore warnings** - they indicate real memory leaks
2. Follow the component name in the warning
3. Add `useComponentCleanup` hook to fix
4. See [Memory Optimization Guide](./guides/memory-optimization.md) for examples

### Issue: High Initial Memory Usage (>200 MB)

**Cause:** Too many dependencies or large bundles.

**Solution:**
```bash
# Analyze bundle size
ANALYZE=true npm run build

# Open the interactive bundle analyzer
# Look for unexpectedly large chunks
```

See [Bundle Size Optimization](./guides/memory-optimization.md#bundle-size-optimization) for details.

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Find and kill process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

---

## Additional Resources

### Documentation

- **Memory Optimization Guide**: [`docs/guides/memory-optimization.md`](./guides/memory-optimization.md)
- **API Contracts**: [`docs/api-contracts.md`](./api-contracts.md)
- **Architecture Overview**: [`docs/master-spec.md`](./master-spec.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)

### Getting Help

- **Questions**: File an issue on GitHub with the "question" label
- **Bugs**: File an issue with the "bug" label and reproduction steps
- **Memory Issues**: Include memory monitor screenshot and browser console warnings

---

## Next Steps

Now that your development environment is set up:

1. **Read the Architecture**: [`docs/master-spec.md`](./master-spec.md)
2. **Explore Components**: Browse `frontend/components/` directory
3. **Run Tests**: `npm run test` to verify everything works
4. **Make Your First Change**: Pick a "good first issue" from GitHub Issues
5. **Watch for Memory Warnings**: Keep browser console open while developing

**Happy coding!**

---

**Version**: 1.0.0
**Feature**: 020-memory-optimization
**Maintained By**: Frontend Team
