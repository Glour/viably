# Development Components

This directory contains components for development-time debugging and monitoring.

## Available Components

### MemoryMonitor

Real-time memory usage monitor for detecting memory leaks during development.

**Features:**
- Current/Peak/Average memory display in MB
- Memory growth rate (MB/minute)
- Automatic leak detection (>1 MB/min growth)
- Start/Stop/Clear controls
- Only renders in `development` mode

**Usage:**

```tsx
import { MemoryMonitor } from '@/components/dev';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <MemoryMonitor />
      </body>
    </html>
  );
}
```

**Position:** Fixed at bottom-right corner with z-index 50.

**Browser Support:**
- Chrome/Edge: Full support (uses `performance.memory` API)
- Firefox/Safari: Gracefully degrades (shows warning in console)

**Configuration:**

The component uses default settings from `useMemoryMonitor` hook:
- `interval: 5000ms` (5 seconds between snapshots)
- `maxSnapshots: 100` (history retention)

To customize, modify the component or use the hook directly.

## Notes

- All components in this directory automatically check `process.env.NODE_ENV`
- No manual removal needed for production builds (tree-shaking handles it)
- Components are styled with Tailwind CSS for consistency
