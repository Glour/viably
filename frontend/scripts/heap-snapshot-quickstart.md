# Heap Snapshot Quick Start

**Goal**: Measure runtime memory usage of JavaScript libraries  
**Time**: 10-15 minutes

---

## 🚀 Quick Commands

```bash
# 1. Start dev server
npm run dev

# 2. Launch Chrome with memory tracking
google-chrome --enable-precise-memory-info http://localhost:3000/dashboard

# 3. Capture snapshot (in Chrome DevTools)
# F12 → Memory tab → Heap snapshot → Take snapshot → Save

# 4. Analyze snapshot
node frontend/scripts/analyze-heap-snapshot.js heap-snapshot-dashboard-2026-02-08.heapsnapshot
```

---

## 📋 Checklist

### Before Capture
- [ ] Dev server running (`npm run dev`)
- [ ] Chrome launched with `--enable-precise-memory-info` flag
- [ ] Navigated to target page (e.g., /dashboard)

### During Capture
- [ ] Opened DevTools (F12)
- [ ] Switched to Memory tab
- [ ] Selected "Heap snapshot"
- [ ] Clicked "Take snapshot"
- [ ] Waited for completion (5-10 seconds)

### After Capture
- [ ] Saved snapshot with descriptive name
- [ ] Ran analyzer script
- [ ] Reviewed top 10 libraries
- [ ] Documented findings

---

## 🎯 Pages to Analyze

| Page | URL | Priority | Why |
|------|-----|----------|-----|
| Dashboard | `/dashboard` | 🔴 HIGH | Most libraries loaded |
| Project Editor | `/projects/[id]` | 🟡 MED | Heavy editor (Monaco?) |
| Templates | `/templates` | 🟢 LOW | Template rendering |
| Login | `/login` | 🟢 LOW | Baseline (minimal) |

**Recommendation**: Start with Dashboard

---

## 🔍 What to Look For

### In DevTools (Manual)
1. **Summary view**: Sort by "Retained Size" (descending)
2. **Search** for library names: `monaco`, `sentry`, `posthog`
3. **Statistics view**: Check "Code" category size

### In Analyzer Output
1. **Top 3 libraries**: These are your biggest targets
2. **Percentage of heap**: Anything >15% is a concern
3. **Compare with bundle size**: Should be ~2-3x larger

---

## 🚨 Red Flags

- ⚠️ Single library >30% of heap
- ⚠️ Development-only libraries loaded (Sentry, PostHog)
- ⚠️ Heap ratio >4x bundle size (bloated runtime)
- ⚠️ Thousands of objects for simple library (potential leak)

---

## 📝 Document Results

Use template: `.tmp/current/heap-snapshot-analysis-template.md`

**Minimum to document**:
- Top 10 libraries (from analyzer output)
- Total heap size
- 2-3 key findings
- 2-3 optimization recommendations

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Snapshot too large" | Close other tabs, restart Chrome |
| "Out of memory" | Increase Node heap: `NODE_OPTIONS=--max-old-space-size=4096` |
| Analyzer crashes | Check snapshot file is valid JSON |
| No library names | Libraries may be minified (use prod build) |

---

## ⏱️ Time Budget

- Setup: 2 min
- Capture: 3 min
- Analysis: 5 min
- Documentation: 5 min

**Total**: ~15 minutes per page

---

## 🔗 Full Documentation

- Detailed guide: `frontend/scripts/heap-snapshot-guide.md`
- Analyzer script: `frontend/scripts/analyze-heap-snapshot.js`
- Results template: `.tmp/current/heap-snapshot-analysis-template.md`

---

_For detailed instructions, see: `frontend/scripts/heap-snapshot-guide.md`_
