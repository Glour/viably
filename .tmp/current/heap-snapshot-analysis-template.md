# Heap Snapshot Analysis Results

**Date**: [YYYY-MM-DD]  
**Page Analyzed**: [Dashboard / Projects / Templates / etc.]  
**URL**: [http://localhost:3000/...]  
**Browser**: Chrome [version]  
**Total Heap Size**: [XX.X MB]

---

## 📊 Top 10 Libraries by Runtime Memory Usage

| Rank | Library | Retained Size | Objects | % of Heap | Priority |
|------|---------|---------------|---------|-----------|----------|
| 1 | [library-name] | XX.X MB | X,XXX | XX% | 🔴 HIGH |
| 2 | [library-name] | XX.X MB | X,XXX | XX% | 🔴 HIGH |
| 3 | [library-name] | XX.X MB | X,XXX | XX% | 🟡 MED |
| 4 | [library-name] | XX.X MB | X,XXX | XX% | 🟡 MED |
| 5 | [library-name] | XX.X MB | X,XXX | XX% | 🟡 MED |
| 6 | [library-name] | XX.X MB | X,XXX | XX% | 🟢 LOW |
| 7 | [library-name] | XX.X MB | X,XXX | XX% | 🟢 LOW |
| 8 | [library-name] | XX.X MB | X,XXX | XX% | 🟢 LOW |
| 9 | [library-name] | XX.X MB | X,XXX | XX% | 🟢 LOW |
| 10 | [library-name] | XX.X MB | X,XXX | XX% | 🟢 LOW |

**Priority legend**:
- 🔴 HIGH: >20MB or >15% of heap
- 🟡 MED: 10-20MB or 8-15% of heap
- 🟢 LOW: <10MB or <8% of heap

---

## 🔍 Key Findings

### 1. [Finding Name] (e.g., "Monaco Editor Dominates Memory")

**Observation**: [Describe what you found]

**Impact**: [Memory usage, percentage of total]

**Root cause**: [Why this is happening]

**Recommendation**: [What to do about it]

---

### 2. [Finding Name]

**Observation**: [Describe what you found]

**Impact**: [Memory usage, percentage of total]

**Root cause**: [Why this is happening]

**Recommendation**: [What to do about it]

---

### 3. [Finding Name]

**Observation**: [Describe what you found]

**Impact**: [Memory usage, percentage of total]

**Root cause**: [Why this is happening]

**Recommendation**: [What to do about it]

---

## 📈 Comparison with Static Bundle Analysis

| Library | Bundle Size (Disk) | Heap Size (Runtime) | Ratio | Notes |
|---------|-------------------|---------------------|-------|-------|
| [library] | XX MB | XX MB | X.Xx | [Compressed/Uncompressed/Bloat] |
| [library] | XX MB | XX MB | X.Xx | [Compressed/Uncompressed/Bloat] |

**Expected ratio**: 2-3x (heap > bundle due to decompression + runtime structures)

**Anomalies**: [Libraries with unusually high or low ratios]

---

## 🎯 Optimization Opportunities

### Immediate Actions (Quick Wins)

1. **[Action]** (Expected savings: XX MB)
   - Why: [Reason]
   - How: [Implementation]
   - Effort: [Low/Medium/High]

2. **[Action]** (Expected savings: XX MB)
   - Why: [Reason]
   - How: [Implementation]
   - Effort: [Low/Medium/High]

### Medium-Term Actions

1. **[Action]** (Expected savings: XX MB)
   - Why: [Reason]
   - How: [Implementation]
   - Effort: [Low/Medium/High]

### Long-Term Considerations

1. **[Action]** (Expected savings: XX MB)
   - Why: [Reason]
   - How: [Implementation]
   - Effort: [Low/Medium/High]

---

## ⚠️ Unexpected Findings

### [Unexpected Finding 1]
- **What**: [Describe]
- **Why unexpected**: [Context]
- **Action needed**: [Next steps]

### [Unexpected Finding 2]
- **What**: [Describe]
- **Why unexpected**: [Context]
- **Action needed**: [Next steps]

---

## 📊 Memory Distribution by Category

Based on DevTools Statistics view:

| Category | Size | % of Heap | Notes |
|----------|------|-----------|-------|
| Code | XX MB | XX% | JavaScript libraries |
| Strings | XX MB | XX% | String allocations |
| JS Arrays | XX MB | XX% | Array objects |
| Typed Arrays | XX MB | XX% | Buffers (images, etc.) |
| System | XX MB | XX% | Browser internals |

**Analysis**: [What this distribution tells us]

---

## 🔬 Methodology Notes

**Snapshot capture**:
- [ ] Chrome launched with `--enable-precise-memory-info`
- [ ] Page fully loaded (no pending requests)
- [ ] Waited [X] seconds after page load
- [ ] Interacted with page: [Yes/No - describe interactions]

**Environment**:
- Node.js version: [X.X.X]
- Next.js version: [X.X.X]
- Build mode: [Development / Production]

**Limitations**:
- [Any caveats or limitations of this snapshot]
- [Factors that might affect results]

---

## 📝 Next Steps

1. [ ] Compare with other pages (Templates, Projects, Settings)
2. [ ] Repeat in production build (`npm run build && npm start`)
3. [ ] Implement top 3 optimization recommendations
4. [ ] Re-measure after optimizations
5. [ ] Document improvements in follow-up report

---

## 📎 Attachments

- Heap snapshot file: `[filename.heapsnapshot]`
- Automated analysis: `[heap-analysis-report.json]`
- Screenshots: [If any]

---

## 🔗 References

- Original bundle analysis: `.tmp/current/memory-optimization-report.md`
- Heap capture guide: `frontend/scripts/heap-snapshot-guide.md`
- Chrome DevTools docs: https://developer.chrome.com/docs/devtools/memory-problems/

---

_Generated using: `frontend/scripts/analyze-heap-snapshot.js`_
