# Example: Heap Snapshot Analyzer Output

This document shows example output from the heap snapshot analyzer.

---

## Command

```bash
node frontend/scripts/analyze-heap-snapshot.js heap-snapshot-dashboard-2026-02-08.heapsnapshot
```

---

## Console Output (Example)

```
================================================================================
🔬 CHROME HEAP SNAPSHOT ANALYZER
================================================================================

📁 Snapshot file: /home/user/heap-snapshot-dashboard-2026-02-08.heapsnapshot
📁 Output report: /home/user/heap-analysis-report.json

🔍 Parsing heap snapshot...
✅ Snapshot parsed successfully

📊 Analyzing memory usage...
✅ Analysis complete

📝 Generating report...

================================================================================
📊 TOP 10 LIBRARIES BY MEMORY USAGE
================================================================================

Total Heap Size: 145.23 MB
Total Objects: 42,567
Snapshot Nodes: 128,456

--------------------------------------------------------------------------------
1. monaco-editor                  42.34 MB (29.15%)  1,245 objects
2. next                            28.91 MB (19.91%)  3,892 objects
3. @sentry/browser                18.72 MB (12.89%)  892 objects
4. posthog-js                     12.45 MB (8.57%)   456 objects
5. react                          10.23 MB (7.04%)   2,134 objects
6. lucide-react                   8.67 MB (5.97%)    789 objects
7. react-query                    6.45 MB (4.44%)    523 objects
8. zustand                        3.21 MB (2.21%)    234 objects
9. @radix-ui                      2.89 MB (1.99%)    456 objects
10. zod                           2.34 MB (1.61%)    189 objects
--------------------------------------------------------------------------------

✅ Report saved to: /home/user/heap-analysis-report.json

✅ Analysis complete!

Next steps:
1. Review top 10 libraries above
2. Check heap-analysis-report.json for detailed data
3. Compare with bundle analysis (npm run analyze)
4. Document findings in .tmp/current/heap-snapshot-analysis.md
```

---

## JSON Report (Example)

**File**: `heap-analysis-report.json`

```json
{
  "timestamp": "2026-02-08T19:47:23.456Z",
  "metadata": {
    "snapshotTitle": "Heap snapshot 2026-02-08",
    "nodeCount": 128456,
    "edgeCount": 456789,
    "stringCount": 34567
  },
  "summary": {
    "totalSize": 152379392,
    "totalSizeFormatted": "145.23 MB",
    "totalObjects": 42567
  },
  "libraries": [
    {
      "name": "monaco-editor",
      "size": 44421120,
      "sizeFormatted": "42.34 MB",
      "objects": 1245,
      "percentage": "29.15"
    },
    {
      "name": "next",
      "size": 30327808,
      "sizeFormatted": "28.91 MB",
      "objects": 3892,
      "percentage": "19.91"
    },
    {
      "name": "@sentry/browser",
      "size": 19631104,
      "sizeFormatted": "18.72 MB",
      "objects": 892,
      "percentage": "12.89"
    },
    {
      "name": "posthog-js",
      "size": 13057024,
      "sizeFormatted": "12.45 MB",
      "objects": 456,
      "percentage": "8.57"
    },
    {
      "name": "react",
      "size": 10724352,
      "sizeFormatted": "10.23 MB",
      "objects": 2134,
      "percentage": "7.04"
    },
    {
      "name": "lucide-react",
      "size": 9087488,
      "sizeFormatted": "8.67 MB",
      "objects": 789,
      "percentage": "5.97"
    },
    {
      "name": "react-query",
      "size": 6758400,
      "sizeFormatted": "6.45 MB",
      "objects": 523,
      "percentage": "4.44"
    },
    {
      "name": "zustand",
      "size": 3367936,
      "sizeFormatted": "3.21 MB",
      "objects": 234,
      "percentage": "2.21"
    },
    {
      "name": "@radix-ui",
      "size": 3031040,
      "sizeFormatted": "2.89 MB",
      "objects": 456,
      "percentage": "1.99"
    },
    {
      "name": "zod",
      "size": 2453504,
      "sizeFormatted": "2.34 MB",
      "objects": 189,
      "percentage": "1.61"
    }
  ],
  "top10": [
    {
      "name": "monaco-editor",
      "size": 44421120,
      "sizeFormatted": "42.34 MB",
      "objects": 1245,
      "percentage": "29.15"
    }
    // ... (same as above)
  ]
}
```

---

## Interpretation

### Key Findings

1. **Monaco Editor dominates** (42.34 MB, 29.15%)
   - Nearly 1/3 of total heap
   - Priority: 🔴 HIGH - Replace with lightweight alternative

2. **Next.js framework** (28.91 MB, 19.91%)
   - Expected for Next.js app
   - Priority: ✅ KEEP - Core framework

3. **Sentry loaded in dev** (18.72 MB, 12.89%)
   - Should be production-only
   - Priority: 🟡 MED - Conditional loading

4. **PostHog loaded in dev** (12.45 MB, 8.57%)
   - Analytics not needed in dev
   - Priority: 🟡 MED - Conditional loading

5. **Lucide icons reasonable** (8.67 MB, 5.97%)
   - Tree-shaking appears effective
   - Priority: 🟢 LOW - Monitor

### Optimization Potential

| Action | Expected Savings | Effort |
|--------|------------------|--------|
| Replace Monaco with Prism | -40 MB | Medium (2-3 hours) |
| Disable Sentry in dev | -18 MB | Low (30 min) |
| Disable PostHog in dev | -12 MB | Low (30 min) |
| **TOTAL** | **-70 MB** | **3-4 hours** |

**Impact**: 145 MB → 75 MB (48% reduction)

---

## Color Legend (Terminal)

- 🔴 **Red** (Ranks 1-3): HIGH priority, >20MB or >15% of heap
- 🟡 **Yellow** (Ranks 4-6): MEDIUM priority, 10-20MB or 8-15% of heap
- 🟢 **Green** (Ranks 7-10): LOW priority, <10MB or <8% of heap

---

_This is an example output. Actual results will vary based on your application state._
