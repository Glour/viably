# Bundle Analyzer Guide

## Quick Start

```bash
# Run bundle analysis
npm run analyze

# View reports
open .next/analyze/client.html
open .next/analyze/nodejs.html
open .next/analyze/edge.html
```

## What Gets Generated

- **client.html** - Client-side JavaScript bundle (what users download)
- **nodejs.html** - Server-side Node.js bundle
- **edge.html** - Edge runtime bundle

## Reading the Reports

Each HTML file opens an interactive treemap showing:
- **Blue boxes** = JavaScript modules
- **Size** = How much space each module takes
- **Hover** = See exact sizes and percentages

## Key Metrics

- **Parsed Size**: Actual file size in bundle
- **Stat Size**: Original source size before minification
- **Gzipped Size**: Compressed size sent to users (most important)

## What to Look For

1. **Largest dependencies** - Focus on biggest boxes first
2. **Duplicate code** - Same library appearing multiple times
3. **Unused exports** - Large libraries not fully tree-shaken
4. **Heavy pages** - Routes with unexpectedly large bundles

## Top Optimization Targets (Current)

1. **Monaco Editor** (76 MB) - Use dynamic import
2. **Lucide React** (45 MB) - Fix tree-shaking
3. **Sentry** (52 MB) - Conditional loading
4. **PostHog** (32 MB) - Dynamic import

See `.tmp/current/bundle-analysis-report.md` for full details.

## Integration with CI/CD

Add to pull request checks to monitor bundle size changes.

## Troubleshooting

### Error: "Not compatible with Turbopack"
**Solution:** Add `--webpack` flag:
```bash
ANALYZE=true npm run build -- --webpack
```

### Error: "Lock file exists"
**Solution:** Remove lock file:
```bash
rm -rf .next/lock .next/cache
npm run analyze
```

### Reports are empty
**Solution:** Build must complete successfully. Check for TypeScript errors first.

## Resources

- [Full Analysis Report](.tmp/current/bundle-analysis-report.md)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Bundlephobia](https://bundlephobia.com/) - Check package sizes

---

**Location of Reports:** `/home/alex/PycharmProjects/viably/frontend/.next/analyze/`
