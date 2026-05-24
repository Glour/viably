# Integration Guide: MemoryMonitor

## Quick Integration

Add MemoryMonitor to your root layout for global memory monitoring:

### Step 1: Update `app/layout.tsx`

```tsx
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { AuthInitializer } from "@/components/auth/auth-initializer"
import { OfflineBannerWrapper } from "@/components/ui/offline-banner-wrapper"
import { MemoryMonitor } from "@/components/dev" // ADD THIS
import { Providers } from "./providers"
import { spaceGrotesk, inter, jetbrainsMono } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | Viably",
    default: "Viably — AI-Powered Telegram Bot Builder",
  },
  description: "Создавай Telegram-ботов за 60 секунд. Без кода. Без знаний. Просто опиши идею.",
  keywords: ["telegram bot", "no-code", "AI", "bot builder", "viably"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            storageKey="viably-theme"
            disableTransitionOnChange={false}
          >
            <OfflineBannerWrapper />
            <AuthInitializer />
            {children}
            <Toaster richColors position="top-right" />
            <MemoryMonitor /> {/* ADD THIS - Only renders in dev */}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### Step 2: Test

```bash
npm run dev
```

Open your browser and navigate to any page. You should see a memory monitor panel in the bottom-right corner.

**Note:** The panel only appears in development mode (`NODE_ENV=development`).

## Features Demonstrated

1. **Auto-start monitoring:** Component starts monitoring automatically when opened
2. **Real-time updates:** Memory stats update every 5 seconds
3. **Leak detection:** Red warning appears if growth rate >1 MB/min for 10+ snapshots
4. **Controls:**
   - **Start/Stop:** Toggle monitoring on/off
   - **Clear:** Reset all statistics

## Alternative: Page-Specific Monitoring

To monitor specific pages only:

```tsx
// app/projects/[id]/page.tsx
import { MemoryMonitor } from '@/components/dev';

export default function ProjectPage() {
  return (
    <>
      <ProjectContent />
      <MemoryMonitor />
    </>
  );
}
```

## Troubleshooting

### Panel not visible
- Check `NODE_ENV`: Run `console.log(process.env.NODE_ENV)` in browser
- Ensure you're using `npm run dev` (not `npm run build && npm start`)

### No memory stats displayed
- **Chrome/Edge:** Should work immediately
- **Firefox/Safari:** `performance.memory` API not available. Check console for warning.

### Memory stats show 0.00 MB
- Wait 5 seconds for first snapshot
- Click "Start" button manually if monitoring is stopped

## Production Build

MemoryMonitor is automatically excluded from production builds via tree-shaking:

```tsx
if (process.env.NODE_ENV !== 'development') {
  return null; // Dead code elimination in production
}
```

No manual removal needed!
