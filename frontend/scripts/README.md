# Frontend Analysis Scripts

Tooling for analyzing and optimizing the Viably frontend application.

---

## 📁 Scripts Overview

### 🔬 Memory & Performance Analysis

| Script | Purpose | Usage |
|--------|---------|-------|
| `heap-snapshot-guide.md` | Complete guide for capturing heap snapshots | Read before first use |
| `heap-snapshot-quickstart.md` | Quick reference for heap analysis | Quick lookup |
| `analyze-heap-snapshot.js` | Automated heap snapshot analyzer | `node analyze-heap-snapshot.js <file>` |

---

## 🚀 Quick Start

### Analyze Runtime Memory Usage

```bash
# 1. Start dev server
npm run dev

# 2. Launch Chrome with memory profiling
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard

# 3. Capture heap snapshot in Chrome DevTools
# F12 → Memory → Heap snapshot → Take snapshot → Save as heap-snapshot.heapsnapshot

# 4. Analyze snapshot
node frontend/scripts/analyze-heap-snapshot.js heap-snapshot.heapsnapshot
```

**Output**: Top 10 libraries by memory usage + JSON report

---

## 📚 Documentation

### For First-Time Users

1. **Read**: `heap-snapshot-guide.md` - Complete walkthrough
2. **Use**: `heap-snapshot-quickstart.md` - Quick reference
3. **Run**: `analyze-heap-snapshot.js` - Automated analysis

### For Regular Use

1. **Quick reference**: `heap-snapshot-quickstart.md`
2. **Analyze**: `node analyze-heap-snapshot.js <file>`
3. **Document**: Use `.tmp/current/heap-snapshot-analysis-template.md`

---

## 🎯 Common Workflows

### Workflow 1: Initial Memory Audit

**Goal**: Understand current memory baseline

```bash
# Capture snapshots on key pages
# 1. Dashboard
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard
# F12 → Memory → Snapshot → Save as heap-dashboard.heapsnapshot

# 2. Project Editor
google-chrome --enable-precise-memory-info http://localhost:3000/projects/test-id
# F12 → Memory → Snapshot → Save as heap-projects.heapsnapshot

# 3. Templates
google-chrome --enable-precise-memory-info http://localhost:3000/templates
# F12 → Memory → Snapshot → Save as heap-templates.heapsnapshot

# Analyze all
node frontend/scripts/analyze-heap-snapshot.js heap-dashboard.heapsnapshot
node frontend/scripts/analyze-heap-snapshot.js heap-projects.heapsnapshot
node frontend/scripts/analyze-heap-snapshot.js heap-templates.heapsnapshot

# Compare results to find worst offenders
```

---

### Workflow 2: Before/After Optimization

**Goal**: Measure impact of optimization changes

```bash
# BEFORE: Capture baseline
npm run dev
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard
# F12 → Memory → Snapshot → Save as heap-before.heapsnapshot

# Make optimization changes (e.g., replace Monaco with Prism)

# AFTER: Capture new snapshot
npm run dev
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard
# F12 → Memory → Snapshot → Save as heap-after.heapsnapshot

# Compare
node frontend/scripts/analyze-heap-snapshot.js heap-before.heapsnapshot > before.txt
node frontend/scripts/analyze-heap-snapshot.js heap-after.heapsnapshot > after.txt
diff before.txt after.txt
```

---

### Workflow 3: Memory Leak Detection

**Goal**: Find components that leak memory

```bash
# 1. Capture baseline
npm run dev
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard
# F12 → Memory → Snapshot → Save as heap-baseline.heapsnapshot

# 2. Interact with app (open modals, navigate, etc.)

# 3. Capture after interaction
# F12 → Memory → Snapshot → Save as heap-after-interaction.heapsnapshot

# 4. In Chrome DevTools: Select heap-after-interaction → View: Comparison → Compare with: heap-baseline
# Look for objects with # New > 0 and # Deleted = 0
```

---

## 🛠️ Script Details

### analyze-heap-snapshot.js

**Purpose**: Parse `.heapsnapshot` files and identify library memory usage

**Input**: Chrome DevTools heap snapshot file (`.heapsnapshot`)

**Output**:
- Console: Top 10 libraries by retained memory
- File: `heap-analysis-report.json` (detailed JSON)

**Libraries detected**:
- monaco-editor
- @sentry/browser
- posthog-js
- react-query / @tanstack/react-query
- zustand
- next
- react
- lucide-react
- @radix-ui
- framer-motion / motion
- zod
- react-hook-form
- ky
- sonner

**Customization**: Edit `libraryPatterns` array in script to add more libraries

**Example output**:
```
📊 TOP 10 LIBRARIES BY MEMORY USAGE
================================================================================

Total Heap Size: 145.23 MB
Total Objects: 42,567

--------------------------------------------------------------------------------
1. monaco-editor                  42.34 MB (29.15%)  1,245 objects
2. @sentry/browser                18.72 MB (12.89%)  892 objects
3. posthog-js                     12.45 MB (8.57%)   456 objects
...
```

---

## 📊 Interpreting Results

### Heap Size vs Bundle Size

| Metric | What It Measures | Typical Ratio |
|--------|------------------|---------------|
| **Bundle size** | Compressed JS file size (network) | 1x |
| **Heap size** | Decompressed runtime memory (RAM) | 2-3x bundle |

**Example**: If Monaco bundle is 76MB, expect ~150-230MB heap usage

### Priority Thresholds

| Priority | Heap Usage | % of Total | Action |
|----------|------------|------------|--------|
| 🔴 **HIGH** | >20MB | >15% | Optimize immediately |
| 🟡 **MED** | 10-20MB | 8-15% | Optimize if easy |
| 🟢 **LOW** | <10MB | <8% | Monitor only |

### Red Flags

- Single library >30% of heap (dominance)
- Dev-only libraries in production build (Sentry, PostHog)
- Heap/bundle ratio >4x (runtime bloat)
- Thousands of small objects (potential leak)

---

## 🔗 Related Resources

### Project Documentation
- Bundle analysis: Run `npm run analyze` in frontend/
- Memory optimization report: `.tmp/current/memory-optimization-report.md`
- Heap analysis template: `.tmp/current/heap-snapshot-analysis-template.md`

### External Resources
- [Chrome DevTools Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [JavaScript Memory Management (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing

---

## 🤝 Contributing

### Adding New Libraries to Analyzer

Edit `analyze-heap-snapshot.js` → `libraryPatterns` array:

```javascript
const libraryPatterns = [
  // ... existing patterns ...
  { name: 'my-library', pattern: /my-library|MyLibrary/i },
];
```

**Tips**:
- Use regex patterns to catch variations (CamelCase, kebab-case)
- Test pattern against actual snapshot data
- Add common global variables (e.g., `__SENTRY__` for Sentry)

### Improving Documentation

- Guides: `heap-snapshot-guide.md` (comprehensive) or `heap-snapshot-quickstart.md` (quick ref)
- Template: `.tmp/current/heap-snapshot-analysis-template.md`
- This README: `frontend/scripts/README.md`

---

## 📞 Troubleshooting

### "Cannot find module" error
```bash
# Ensure you're in the project root or use full path
node /home/alex/PycharmProjects/viably/frontend/scripts/analyze-heap-snapshot.js <file>
```

### "Invalid JSON" error
- Snapshot file may be corrupted
- Re-capture snapshot in Chrome DevTools
- Verify file size is >1MB (empty snapshots are invalid)

### Analyzer shows 0 bytes for all libraries
- Libraries may be minified in production build
- Check pattern matching (add `console.log(nodeName)` in script)
- Some libraries don't leave clear traces in heap

### Chrome crashes during snapshot
- Close other tabs/windows
- Increase Chrome memory limit: `--max-old-space-size=4096`
- Capture on simpler page first (e.g., /login)

---

## 📝 License

Part of the Viably project. Internal tooling.

---

_Last updated: 2026-02-08_
