/**
 * Converts Artifact[] into a flat Record<string, SandpackFile> for Sandpack.
 * Feature: 002-production-preview
 *
 * Sandpack `react-ts` template entry point is /index.tsx → imports ./App.
 * We use FLAT structure (no /src/ prefix) to match the template's bundler:
 *   /App.tsx, /index.tsx, /styles.css, /components/Hero.tsx, etc.
 *
 * Our WebContainer artifacts use src/ prefix — this converter strips it.
 */

import type { Artifact } from '@/features/generation/types/conversation'
import { normalizePath, stripContentFilenameComment } from './artifacts-to-fs'
import { UI_COMPONENTS } from './ui-components'
import { TEMPLATE_INDEX_CSS } from './preview-template'

// ============================================================================
// Constants
// ============================================================================

/** Artifact types relevant for React preview */
const PREVIEW_TYPES = new Set<string>(['react', 'typescript', 'javascript', 'css'])

/**
 * index.tsx entry point for Sandpack react-ts template.
 * Flat structure — no /src/ prefix. This IS the entry point the template uses.
 */
const SANDPACK_INDEX_TSX = `import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

// Configure Tailwind CDN with shadcn/ui color tokens.
// Must run after cdn.tailwindcss.com loads (added via externalResources).
if (typeof window !== 'undefined' && (window as any).tailwind) {
  ;(window as any).tailwind.config = {
    theme: {
      extend: {
        colors: {
          border: 'hsl(var(--border) / <alpha-value>)',
          input: 'hsl(var(--input) / <alpha-value>)',
          ring: 'hsl(var(--ring) / <alpha-value>)',
          background: 'hsl(var(--background) / <alpha-value>)',
          foreground: 'hsl(var(--foreground) / <alpha-value>)',
          primary: { DEFAULT: 'hsl(var(--primary) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
          secondary: { DEFAULT: 'hsl(var(--secondary) / <alpha-value>)', foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)' },
          destructive: { DEFAULT: 'hsl(var(--destructive) / <alpha-value>)', foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)' },
          muted: { DEFAULT: 'hsl(var(--muted) / <alpha-value>)', foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
          accent: { DEFAULT: 'hsl(var(--accent) / <alpha-value>)', foreground: 'hsl(var(--accent-foreground) / <alpha-value>)' },
          popover: { DEFAULT: 'hsl(var(--popover) / <alpha-value>)', foreground: 'hsl(var(--popover-foreground) / <alpha-value>)' },
          card: { DEFAULT: 'hsl(var(--card) / <alpha-value>)', foreground: 'hsl(var(--card-foreground) / <alpha-value>)' },
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
      },
    },
  }
}

// Override Tailwind CDN Preflight border-color reset (#e5e7eb → hsl(var(--border))).
// Tailwind CDN Preflight loads AFTER our /styles.css, so we must inject our override
// AFTER Tailwind CDN processes the page. Using setTimeout(0) ensures our <style>
// is appended after Tailwind CDN's initial style generation.
setTimeout(() => {
  const fix = document.createElement('style')
  fix.textContent = '*, ::before, ::after { border-color: hsl(var(--border)); }'
  document.head.appendChild(fix)
}, 0)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`

/**
 * index.html for Sandpack vite-react-ts template.
 * Injects Tailwind CDN with theme colors matching our shadcn/ui CSS variables,
 * so utility classes like bg-primary, text-foreground, etc. work correctly.
 * Also includes Google Fonts (Inter) for consistent typography.
 */
const SANDPACK_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      /* Must run AFTER cdn.tailwindcss.com — Play CDN exposes tailwind.config setter post-load */
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              border: 'hsl(var(--border) / <alpha-value>)',
              input: 'hsl(var(--input) / <alpha-value>)',
              ring: 'hsl(var(--ring) / <alpha-value>)',
              background: 'hsl(var(--background) / <alpha-value>)',
              foreground: 'hsl(var(--foreground) / <alpha-value>)',
              primary: { DEFAULT: 'hsl(var(--primary) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
              secondary: { DEFAULT: 'hsl(var(--secondary) / <alpha-value>)', foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)' },
              destructive: { DEFAULT: 'hsl(var(--destructive) / <alpha-value>)', foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)' },
              muted: { DEFAULT: 'hsl(var(--muted) / <alpha-value>)', foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
              accent: { DEFAULT: 'hsl(var(--accent) / <alpha-value>)', foreground: 'hsl(var(--accent-foreground) / <alpha-value>)' },
              popover: { DEFAULT: 'hsl(var(--popover) / <alpha-value>)', foreground: 'hsl(var(--popover-foreground) / <alpha-value>)' },
              card: { DEFAULT: 'hsl(var(--card) / <alpha-value>)', foreground: 'hsl(var(--card-foreground) / <alpha-value>)' },
            },
            borderRadius: {
              lg: 'var(--radius)',
              md: 'calc(var(--radius) - 2px)',
              sm: 'calc(var(--radius) - 4px)',
            },
            borderColor: {
              DEFAULT: 'hsl(var(--border))',
            },
          },
        },
      }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <style type="text/tailwindcss">
      /* Override Tailwind Preflight border-color (#e5e7eb) with shadcn/ui token */
      @layer base {
        *, ::before, ::after { border-color: hsl(var(--border)); }
        body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

// ============================================================================
// Path conversion
// ============================================================================

/**
 * Convert a normalised WebContainer path (src/...) to a flat Sandpack react-ts path.
 *
 * react-ts template entry is /index.tsx → ./App. No /src/ prefix!
 * src/App.tsx             → /App.tsx
 * src/components/Hero.tsx → /components/Hero.tsx
 * src/lib/utils.ts        → /lib/utils.ts
 * src/index.css           → /styles.css  (renamed for Sandpack)
 */
function toSandpackPath(wcPath: string): string {
  // Strip leading src/ prefix
  const withoutSrc = wcPath.startsWith('src/') ? wcPath.slice(4) : wcPath
  // Rename index.css → styles.css
  const renamed = withoutSrc === 'index.css' ? 'styles.css' : withoutSrc
  // Add leading /
  return renamed.startsWith('/') ? renamed : `/${renamed}`
}

/**
 * Fix import paths inside file content.
 *
 * Sandpack react-ts has no @/ path alias — replace all @/ imports with
 * relative paths from the flat root. Works for files at root level (/App.tsx).
 * Files in subdirectories (/components/Hero.tsx) need '../' prefix — we use
 * the filePath param to compute the correct relative prefix.
 *
 * Also removes "use client" directives (not needed in Sandpack/Vite).
 */
function fixImports(content: string, sandpackPath: string): string {
  // Flat structure: /App.tsx → depth 0, /components/Hero.tsx → depth 1
  // sandpackPath format: /App.tsx → parts: ['', 'App.tsx'] → depth 0
  // /components/Hero.tsx → parts: ['', 'components', 'Hero.tsx'] → depth 1
  const parts = sandpackPath.split('/')
  const depth = parts.length - 2 // subtract '' and filename
  const prefix = depth > 0 ? '../'.repeat(depth) : './'

  return content
    // Remove "use client" / "use server" directives
    .replace(/^['"]use (?:client|server)['"]\s*\n?/gm, '')
    // @/components/ui/X → ./components/ui/X
    .replace(/from\s+['"]@\/components\/ui\/([^'"]+)['"]/g, `from '${prefix}components/ui/$1'`)
    // @/components/X → ./components/X
    .replace(/from\s+['"]@\/components\/([^'"]+)['"]/g, `from '${prefix}components/$1'`)
    // @/shared/lib/utils, @/lib/utils → ./lib/utils
    .replace(/from\s+['"]@\/(?:shared\/)?lib\/utils['"]/g, `from '${prefix}lib/utils'`)
    // @/lib/X → ./lib/X
    .replace(/from\s+['"]@\/(?:shared\/)?lib\/([^'"]+)['"]/g, `from '${prefix}lib/$1'`)
    // @/hooks/X → ./hooks/X
    .replace(/from\s+['"]@\/(?:shared\/)?hooks\/([^'"]+)['"]/g, `from '${prefix}hooks/$1'`)
    // Any remaining @/ → ./ (catch-all)
    .replace(/from\s+['"]@\/([^'"]+)['"]/g, `from '${prefix}$1'`)
}

// ============================================================================
// CSS processing helpers
// ============================================================================

/**
 * Map of common Tailwind @apply classes → plain CSS equivalents.
 * Tailwind CDN does NOT process @apply — we must convert to real CSS.
 */
const APPLY_MAP: Record<string, string> = {
  'border-border': 'border-color: hsl(var(--border))',
  'bg-background': 'background-color: hsl(var(--background))',
  'bg-foreground': 'background-color: hsl(var(--foreground))',
  'bg-card': 'background-color: hsl(var(--card))',
  'bg-popover': 'background-color: hsl(var(--popover))',
  'bg-primary': 'background-color: hsl(var(--primary))',
  'bg-secondary': 'background-color: hsl(var(--secondary))',
  'bg-muted': 'background-color: hsl(var(--muted))',
  'bg-accent': 'background-color: hsl(var(--accent))',
  'bg-destructive': 'background-color: hsl(var(--destructive))',
  'text-foreground': 'color: hsl(var(--foreground))',
  'text-background': 'color: hsl(var(--background))',
  'text-primary': 'color: hsl(var(--primary))',
  'text-primary-foreground': 'color: hsl(var(--primary-foreground))',
  'text-secondary-foreground': 'color: hsl(var(--secondary-foreground))',
  'text-muted-foreground': 'color: hsl(var(--muted-foreground))',
  'text-accent-foreground': 'color: hsl(var(--accent-foreground))',
  'text-destructive': 'color: hsl(var(--destructive))',
  'text-card-foreground': 'color: hsl(var(--card-foreground))',
  'text-popover-foreground': 'color: hsl(var(--popover-foreground))',
  'ring-ring': 'outline-color: hsl(var(--ring))',
  'antialiased': '-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale',
}

/**
 * Convert `@apply class1 class2 ...;` to plain CSS declarations.
 * Handles the common shadcn/ui patterns. Unrecognized classes are dropped
 * (they would fail silently in Tailwind CDN anyway).
 */
function convertApplyDirectives(css: string): string {
  return css.replace(/@apply\s+([^;}\n]+)\s*;?/g, (_match, classes: string) => {
    const classList = classes.trim().split(/\s+/)
    const declarations: string[] = []
    for (const cls of classList) {
      if (APPLY_MAP[cls]) {
        declarations.push(APPLY_MAP[cls])
      }
    }
    return declarations.length > 0 ? declarations.join('; ') + ';' : ''
  })
}

function processUserCss(userCssRaw: string): { externalImports: string[]; cleanedCss: string } {
  const externalImports: string[] = []
  const cleanedCss = userCssRaw
    .replace(/@import\s+url\(['"]?https?:\/\/[^'")\s]+['"]?\)\s*;?/g, (m) => {
      externalImports.push(m.endsWith(';') ? m : m + ';')
      return ''
    })
    .replace(/@tailwind\s+base\s*;?/g, '')
    .replace(/@tailwind\s+components\s*;?/g, '')
    .replace(/@tailwind\s+utilities\s*;?/g, '')
    .replace(/@import\s+["']tailwindcss["']\s*;?/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*#\s+.*$/gm, '')
    .replace(/(\.card-pricing-featured\s*\{[^}]*?)overflow\s*:\s*hidden/g, '$1overflow: visible')
    .replace(/@theme\s+(?:inline\s*)?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs, '')
    // Unwrap @layer base { ... } → extract contents (same as template CSS processing)
    .replace(/@layer\s+base\s*\{([\s\S]*?)\n\}/g, '$1')
    .trim()

  // Convert @apply directives to plain CSS (Tailwind CDN doesn't process @apply)
  const converted = convertApplyDirectives(cleanedCss)

  return { externalImports, cleanedCss: converted }
}

// ============================================================================
// Main export
// ============================================================================

/**
 * Convert Artifact[] into a flat Sandpack file map for the `react-ts` template.
 *
 * Uses FLAT paths (no /src/ prefix) to match the react-ts template entry point:
 *   { "/App.tsx": "...", "/components/Hero.tsx": "...", "/styles.css": "..." }
 *
 * react-ts bundles /index.tsx → ./App as the entry point.
 */
export function artifactsToSandpackFiles(artifacts: Artifact[]): Record<string, string> {
  const files: Record<string, string> = {}

  // ------------------------------------------------------------------
  // 1. Template entry points — override Sandpack defaults
  // ------------------------------------------------------------------
  // /index.tsx is the actual entry point of react-ts template
  files['/index.tsx'] = SANDPACK_INDEX_TSX
  // Override public/index.html to inject Tailwind CDN + Google Fonts.
  files['/public/index.html'] = SANDPACK_INDEX_HTML

  // ------------------------------------------------------------------
  // 2. shadcn/ui components — flat paths
  // ------------------------------------------------------------------
  for (const [relativePath, content] of Object.entries(UI_COMPONENTS)) {
    // UI_COMPONENTS keys: 'lib/utils.ts', 'components/ui/button.tsx', etc.
    files[`/${relativePath}`] = content
  }

  // ------------------------------------------------------------------
  // 3. Filter to preview-relevant artifact types
  // ------------------------------------------------------------------
  const previewArtifacts = artifacts.filter((a) => PREVIEW_TYPES.has(a.type))

  // ------------------------------------------------------------------
  // 4. Deduplicate by normalised WC path (highest version wins)
  // ------------------------------------------------------------------
  const byPath = new Map<string, Artifact>()

  for (const artifact of previewArtifacts) {
    const normalised = normalizePath(artifact.title) // e.g. "src/App.tsx"
    if (normalised === null) continue

    const existing = byPath.get(normalised)
    if (existing === undefined || artifact.version > existing.version) {
      byPath.set(normalised, artifact)
    }
  }

  // ------------------------------------------------------------------
  // 5. Process each artifact — convert path and write to files map
  // ------------------------------------------------------------------
  let userIndexCss: Artifact | null = null

  for (const [normalised, artifact] of byPath) {
    if (artifact.type === 'css' && (normalised === 'src/index.css' || normalised === 'src/styles.css')) {
      userIndexCss = artifact
      continue
    }

    const sandpackPath = toSandpackPath(normalised)
    let content = fixImports(stripContentFilenameComment(artifact.content), sandpackPath)
    // Strip @tailwind directives from ALL files (AI sometimes puts them in wrong files)
    if (content.includes("@tailwind")) {
      content = content
        .replace(/@tailwind\s+base\s*;?\n?/g, "")
        .replace(/@tailwind\s+components\s*;?\n?/g, "")
        .replace(/@tailwind\s+utilities\s*;?\n?/g, "")
        .replace(/@import\s+["']tailwindcss["']\s*;?\n?/g, "")
    }
    files[sandpackPath] = content
  }

  // ------------------------------------------------------------------
  // 6. styles.css = template base + user index.css (merged)
  // ------------------------------------------------------------------
  let baseCss = TEMPLATE_INDEX_CSS
    // Strip @tailwind directives — we use Tailwind CDN, not PostCSS
    .replace(/@tailwind\s+\w+\s*;?\n?/g, '')
    // Unwrap @layer base { ... } → extract its contents directly.
    // Tailwind CDN processes @layer, but some bundlers struggle with it.
    // The CSS custom properties inside are valid plain CSS and work without the @layer wrapper.
    .replace(/@layer\s+base\s*\{([\s\S]*?)\n\}/g, '$1')
    .trim()

  if (userIndexCss) {
    const { externalImports, cleanedCss } = processUserCss(userIndexCss.content)

    if (externalImports.length > 0) {
      baseCss = externalImports.join('\n') + '\n' + baseCss
    }

    const separator = baseCss.endsWith('\n') ? '' : '\n'
    baseCss = `${baseCss}${separator}${cleanedCss}`
  }

  // styles.css at flat root — imported by /index.tsx
  files['/styles.css'] = baseCss

  // ------------------------------------------------------------------
  // 7. Resolve loose artifacts
  // ------------------------------------------------------------------
  resolveLooseArtifacts(files, byPath)

  return files
}

// ============================================================================
// Loose artifact resolution
// ============================================================================

function resolveLooseArtifacts(
  files: Record<string, string>,
  byPath: Map<string, Artifact>,
): void {
  const looseEntries: Array<{ artifact: Artifact }> = []
  for (const [normalised, artifact] of byPath) {
    const parts = normalised.split('/')
    // "src/<file>" = bare artifact (2 parts)
    if (parts.length === 2 && parts[0] === 'src') {
      looseEntries.push({ artifact })
    }
  }
  if (looseEntries.length === 0) return

  // App.tsx in react-ts flat template is at /App.tsx
  const appContent = files['/App.tsx']
  if (!appContent) return

  const importRegex = /from\s+['"](\.[^'"]+)['"]/g
  const extensions = ['.tsx', '.ts', '.jsx', '.js', '']

  let match: RegExpExecArray | null
  while ((match = importRegex.exec(appContent)) !== null) {
    const importPath = match[1] // e.g. "./components/Hero"
    const resolved = importPath.replace(/^\.\//, '') // "components/Hero"

    const exists = extensions.some((ext) => files[`/${resolved}${ext}`] !== undefined)

    if (!exists && looseEntries.length > 0) {
      const entry = looseEntries.shift()!
      files[`/${resolved}.tsx`] = stripContentFilenameComment(entry.artifact.content)
    }
  }
}
