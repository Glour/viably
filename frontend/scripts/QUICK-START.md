# Memory Testing Quick Start

## One-Liner Tests

```bash
# Fast test (10 seconds, no server)
npm run test:memory:stores

# Full test (needs running server)
npm run dev & sleep 10 && npm run test:memory

# Validate setup
npx tsx scripts/validate-memory-setup.ts
```

## Results Location

- `.tmp/current/store-memory-test-results.json`
- `.tmp/current/memory-test-results.json`
- `.tmp/current/memory-test-results.md`

## What's Tested

✅ Zustand store memory usage
✅ Store isolation (no leakage)
✅ Memory leaks detection
✅ Large dataset handling
✅ Per-project memory breakdown

## Target

**<500MB for 10 concurrent projects**

## Current Results

- Store overhead: **37 KB** for 10 projects ✅
- No memory leaks detected ✅
- Store isolation working ✅

## Full Docs

See `README-MEMORY-TESTS.md` for complete guide.
