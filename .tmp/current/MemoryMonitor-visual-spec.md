# MemoryMonitor Visual Specification

## Component Preview (ASCII mockup)

```
┌──────────────────────────────────────┐
│ Memory Monitor            ● (pulse)   │
├──────────────────────────────────────┤
│ Current:            42.15 MB         │
│ Peak:               48.92 MB (yellow)│
│ Average:            45.03 MB         │
│ Growth:         +1.23 MB/min (red)   │
├──────────────────────────────────────┤
│ ⚠️ Potential memory leak detected!   │
├──────────────────────────────────────┤
│ [  Stop  ] [ Clear ]                 │
└──────────────────────────────────────┘
```

## Layout Breakdown

### Position
- **Fixed:** Bottom-right corner
- **Coordinates:** `bottom: 16px`, `right: 16px`
- **Z-index:** `50`

### Dimensions
- **Width:** `256px` (16rem / w-64)
- **Padding:** `16px` all sides
- **Border radius:** `8px`

### Color Scheme
- **Background:** `rgba(0, 0, 0, 0.8)` with backdrop blur
- **Text:** White (`text-white`)
- **Labels:** Gray-400 (`text-gray-400`)
- **Values:** White (default), Yellow (peak), Blue/Red (growth)

### Typography
- **Font size:** `14px` (text-sm)
- **Font family:** System default (inherits)
- **Monospace values:** `font-mono` for numbers

## States

### 1. Monitoring Active
```
Memory Monitor    ● (green, pulsing)
[  Stop  ] [ Clear ]
```

### 2. Monitoring Stopped
```
Memory Monitor    ● (gray, static)
[ Start  ] [ Clear ]
```

### 3. No Data
```
Memory Monitor    ● (gray)
Current:             0.00 MB
Peak:                0.00 MB
Average:             0.00 MB
[ Start  ] [ Clear (disabled) ]
```

### 4. Leak Detected
```
Memory Monitor    ● (green, pulsing)
Current:            55.23 MB
Peak:               58.10 MB
Average:            52.45 MB
Growth:         +1.87 MB/min (RED)
────────────────────────────────
⚠️ Potential memory leak detected! (red bg)
────────────────────────────────
[  Stop  ] [ Clear ]
```

## Interactive Elements

### Start/Stop Button
**Default (stopped):**
- Background: Blue-600 (`bg-blue-600`)
- Hover: Blue-700 (`hover:bg-blue-700`)
- Text: "Start"

**Active (monitoring):**
- Background: Red-600 (`bg-red-600`)
- Hover: Red-700 (`hover:bg-red-700`)
- Text: "Stop"

### Clear Button
**Enabled:**
- Background: Gray-700 (`bg-gray-700`)
- Hover: Gray-600 (`hover:bg-gray-600`)
- Text: "Clear"

**Disabled:**
- Background: Gray-700 (no hover)
- Opacity: 50%
- Cursor: Not allowed

## Responsive Behavior

### Desktop (1024px+)
- Full width: 256px
- Normal positioning

### Mobile (<1024px)
- Same design (no responsive changes)
- May overlap with content on small screens

**Recommendation:** Use only on desktop for development purposes.

## Accessibility

- **Semantic HTML:** Uses `<button>` for controls
- **Color contrast:** WCAG AA compliant (white on black/80%)
- **Focus states:** Default browser outline preserved
- **Screen readers:** Button labels are descriptive

## Animation

### Status Indicator (dot)
```css
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
```

### Transitions
- Button hover: `transition-colors` (150ms)
- All interactive elements use Tailwind's default transitions

## Dark Mode

Component is **always dark** regardless of theme:
- Background: `bg-black/80` (not affected by theme)
- Designed for minimal visual interference

## Browser Compatibility

### Supported Browsers
- Chrome 90+ (full functionality)
- Edge 90+ (full functionality)
- Firefox 90+ (UI only, no memory API)
- Safari 15+ (UI only, no memory API)

### Feature Detection
Component gracefully degrades:
- If `performance.memory` unavailable → console warning
- UI remains visible with 0 values
- Start button still functional (no errors)

## Code Example (Tailwind Classes)

```tsx
<div className="fixed bottom-4 right-4 z-50 w-64 rounded-lg bg-black/80 p-4 text-sm text-white shadow-lg backdrop-blur-sm">
  {/* Header */}
  <div className="mb-3 flex items-center justify-between border-b border-white/20 pb-2">
    <h3 className="font-semibold">Memory Monitor</h3>
    <div className={`h-2 w-2 rounded-full ${
      isMonitoring ? 'animate-pulse bg-green-500' : 'bg-gray-500'
    }`} />
  </div>

  {/* Stats */}
  <div className="space-y-2">
    <div className="flex justify-between">
      <span className="text-gray-400">Current:</span>
      <span className="font-mono font-medium">{stats.current.toFixed(2)} MB</span>
    </div>
    {/* ... more stats ... */}
  </div>

  {/* Leak Warning (conditional) */}
  {stats.leakDetected && (
    <div className="mt-3 rounded bg-red-500/20 p-2 text-xs text-red-400">
      ⚠️ Potential memory leak detected!
    </div>
  )}

  {/* Controls */}
  <div className="mt-4 flex gap-2">
    <button className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
      isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
    }`}>
      {isMonitoring ? 'Stop' : 'Start'}
    </button>
    <button className="rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 enabled:bg-gray-700 enabled:hover:bg-gray-600">
      Clear
    </button>
  </div>
</div>
```
