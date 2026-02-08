# Heap Snapshot - Quick Reference Card

**Print this for quick lookup during analysis**

---

## 🚀 1-Minute Quick Start

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Launch Chrome + analyze
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard
# F12 → Memory → Heap snapshot → Take snapshot → Save as heap.heapsnapshot
node frontend/scripts/analyze-heap-snapshot.js heap.heapsnapshot
```

---

## 🔍 Chrome DevTools Views

| View | Purpose | Key Column |
|------|---------|-----------|
| **Summary** | Memory by constructor | Retained Size |
| **Containment** | Object hierarchy | Distance |
| **Comparison** | Find leaks | # New - # Deleted |
| **Statistics** | Category pie chart | Code % |

---

## 📊 Priority Thresholds

| Priority | Size | % of Heap | Action |
|----------|------|-----------|--------|
| 🔴 HIGH | >20MB | >15% | Fix now |
| 🟡 MED | 10-20MB | 8-15% | Fix if easy |
| 🟢 LOW | <10MB | <8% | Monitor |

---

## 🎯 Libraries to Check

```javascript
// Search in DevTools Summary view (Ctrl+F)
monaco        // Monaco Editor
sentry        // Sentry SDK
posthog       // PostHog Analytics
react-query   // React Query
zustand       // Zustand stores
```

---

## 🚨 Red Flags

- ⚠️ Single library >30% of heap
- ⚠️ Dev-only libs in production (Sentry, PostHog)
- ⚠️ Heap/bundle ratio >4x
- ⚠️ Thousands of small objects (leak?)

---

## 📈 Expected Ratios

| Metric | Normal | Problematic |
|--------|--------|-------------|
| Heap/Bundle | 2-3x | >4x |
| Total heap | <200MB | >500MB |
| Code % | 40-60% | >70% |

---

## 🔧 Console Commands

```javascript
// Check current heap size
console.log('Heap:', (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2), 'MB');

// Check heap limit
console.log('Limit:', (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2), 'MB');
```

---

## 📝 Documentation Files

| File | Purpose |
|------|---------|
| `heap-snapshot-guide.md` | Full guide |
| `heap-snapshot-quickstart.md` | Quick start |
| `analyze-heap-snapshot.js` | Analyzer |
| `heap-snapshot-analysis-template.md` | Results template |
| `EXAMPLE-OUTPUT.md` | Example output |

---

## 🎯 Pages Priority

1. 🔴 **Dashboard** - Most libs loaded
2. 🟡 **Projects** - Heavy editor
3. 🟢 **Templates** - Rendering
4. 🟢 **Login** - Baseline

---

## ⏱️ Time Budget

- Capture: 3 min
- Analysis: 5 min
- Document: 5 min
- **Total**: ~15 min/page

---

## 🔗 Quick Links

- Bundle: `npm run analyze`
- Memory report: `.tmp/current/memory-optimization-report.md`
- Chrome docs: https://developer.chrome.com/docs/devtools/memory-problems/

---

_Keep this card handy during heap analysis sessions_
