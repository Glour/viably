/**
 * Converts an array of Artifact objects into a WCFileSystemTree compatible
 * with @webcontainer/api, merged on top of a pre-built template base tree.
 *
 * Feature: 002-production-preview
 */

import type { Artifact } from '@/features/generation/types/conversation'
import type { ArtifactsToFsOptions, WCDirectoryNode, WCFileNode, WCFileSystemTree } from './types'

// ============================================================================
// Constants
// ============================================================================

/**
 * File basenames that belong to the template and must never be overridden
 * by user artifacts.
 */
const SKIP_TITLES = new Set<string>([
  'main.tsx',
  'index.html',
  'vite.config.ts',
  'vite.config.js',
  'tailwind.config.ts',
  'tailwind.config.js',
  'tailwind.config.cjs',
  'postcss.config.js',
  'postcss.config.cjs',
  'postcss.config.ts',
  'package.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'tsconfig.app.json',
  '.env',
  '.env.local',
  '.eslintrc.js',
  '.eslintrc.cjs',
])

/**
 * Artifact types that are relevant for a React/Vite preview. All others
 * (html, json, yaml, toml, ini, markdown, text, python …) are excluded.
 */
const PREVIEW_TYPES = new Set<string>(['react', 'typescript', 'javascript', 'css'])

/**
 * Exact set of shadcn/ui component filenames that ship with the template.
 * Only these specific files are protected — any other file placed by the AI
 * under src/components/ui/ (e.g. hero-background.tsx) is written normally.
 */
const TEMPLATE_UI_COMPONENTS = new Set([
  'button.tsx',
  'card.tsx',
  'input.tsx',
  'badge.tsx',
  'separator.tsx',
  'tabs.tsx',
  'dialog.tsx',
  'select.tsx',
  'avatar.tsx',
  'tooltip.tsx',
  'dropdown-menu.tsx',
])

// ============================================================================
// Path normalisation
// ============================================================================

/**
 * Strips a leading `// filename:` (or `# filename:`) comment that the AI
 * sometimes prepends to artifact content or titles, e.g.:
 *   "// filename: src/App.tsx\nexport default …"
 * When the comment appears in the title field itself we strip it there too.
 */
function stripFilenameComment(raw: string): string {
  return raw.replace(/^(?:\/\/|#)\s*filename\s*:\s*/i, '').trim()
}

/**
 * Strips a leading filename/title metadata comment from file **content**.
 * This is the last line of defense — backend should already strip it,
 * but if it slips through, Vite/Babel will choke on `# filename: ...`
 * as invalid syntax in .tsx/.ts/.jsx/.js/.css files.
 */
export function stripContentFilenameComment(content: string): string {
  return content.replace(
    /^(?:\/\/|#|<!--)\s*(?:filename|title)\s*:\s*.+?(?:-->)?\s*\n/i,
    '',
  )
}

/**
 * Normalise an artifact `title` (which is used as the file path) into a
 * canonical `src/`-rooted path, or return `null` to signal that the artifact
 * should be skipped.
 *
 * Rules:
 * 1. null / empty                          → null  (skip)
 * 2. Strip leading `//` filename comment
 * 3. Strip leading `./` or `/`
 * 4. Bare filename, no directory           → prefix with `src/`
 * 5. Already has `src/` prefix             → keep as-is
 * 6. Has a directory but no `src/` prefix  → prefix with `src/`
 * 7. Basename is in SKIP_TITLES            → null  (skip)
 * 8. Path starts with `src/components/ui/` → null  (skip, template-owned)
 */
export function normalizePath(title: string | null): string | null {
  if (title === null || title.trim() === '') {
    return null
  }

  // Strip leading filename comment (// filename: … or # filename: …)
  let path = stripFilenameComment(title.trim())

  // Strip leading ./ or /
  path = path.replace(/^\.\//, '').replace(/^\//, '')

  if (path === '') {
    return null
  }

  // Resolve to a src/-rooted path
  if (!path.includes('/')) {
    // Bare filename → src/<filename>
    path = `src/${path}`
  } else if (!path.startsWith('src/')) {
    // Has directories but no src/ prefix → prepend src/
    path = `src/${path}`
  }
  // else: already starts with src/ — keep as-is

  // Extract basename for SKIP_TITLES check
  const basename = path.split('/').pop() ?? ''
  if (SKIP_TITLES.has(basename)) {
    return null
  }

  // Protect template-owned shadcn/ui components (exact filenames only).
  // Custom components placed by AI under src/components/ui/ are allowed through.
  if (path.startsWith('src/components/ui/') && TEMPLATE_UI_COMPONENTS.has(basename)) {
    return null
  }

  return path
}

// ============================================================================
// Tree helpers
// ============================================================================

/**
 * Type-guard: returns true when a tree node is a directory node.
 */
function isDirectoryNode(node: WCFileNode | WCDirectoryNode): node is WCDirectoryNode {
  return 'directory' in node
}

/**
 * Deep-clone a WCFileSystemTree so mutations on the returned tree do not
 * affect the original template base.
 */
function cloneTree(tree: WCFileSystemTree): WCFileSystemTree {
  const result: WCFileSystemTree = {}
  for (const [key, node] of Object.entries(tree)) {
    if (isDirectoryNode(node)) {
      result[key] = { directory: cloneTree(node.directory) }
    } else {
      result[key] = { file: { contents: node.file.contents } }
    }
  }
  return result
}

/**
 * Recursively insert a file at the location described by `pathParts` into
 * `tree`, creating intermediate directory nodes as needed.
 *
 * @param tree      The (mutable) tree to write into.
 * @param pathParts Ordered path segments, e.g. `['src', 'components', 'Hero.tsx']`.
 * @param content   The file contents string.
 */
export function setNestedPath(
  tree: WCFileSystemTree,
  pathParts: string[],
  content: string,
): void {
  if (pathParts.length === 0) return

  const [head, ...rest] = pathParts

  if (rest.length === 0) {
    // Leaf — write the file node
    tree[head] = { file: { contents: content } }
    return
  }

  // Ensure an intermediate directory node exists
  const existing = tree[head]
  if (existing === undefined || !isDirectoryNode(existing)) {
    tree[head] = { directory: {} }
  }

  // Safe cast: we just ensured it is a directory node
  setNestedPath(
    (tree[head] as WCDirectoryNode).directory,
    rest,
    content,
  )
}

/**
 * Retrieve the file node at `pathParts` depth inside `tree`, or `null` if it
 * does not exist or is a directory.
 */
function getFileNode(tree: WCFileSystemTree, pathParts: string[]): WCFileNode | null {
  if (pathParts.length === 0) return null

  const [head, ...rest] = pathParts
  const node = tree[head]
  if (node === undefined) return null

  if (rest.length === 0) {
    return isDirectoryNode(node) ? null : node
  }

  if (!isDirectoryNode(node)) return null
  return getFileNode(node.directory, rest)
}

// ============================================================================
// Main export
// ============================================================================

/**
 * Merge user-generated `artifacts` onto a `baseTree` (the template file
 * system) and return the combined WCFileSystemTree ready for mounting inside
 * a WebContainer instance.
 *
 * @param artifacts  All artifacts from the current AI generation session.
 * @param baseTree   Pre-built template tree (from `buildTemplateFileTree()`).
 * @param options    Optional behaviour flags.
 */
export function artifactsToFileSystem(
  artifacts: Artifact[],
  baseTree: WCFileSystemTree,
  options?: ArtifactsToFsOptions,
): WCFileSystemTree {
  // Start from a deep clone so the caller's template is never mutated
  const tree = cloneTree(baseTree)

  // ------------------------------------------------------------------
  // 1. Filter to preview-relevant types only
  // ------------------------------------------------------------------
  const previewArtifacts = artifacts.filter((a) => PREVIEW_TYPES.has(a.type))

  // ------------------------------------------------------------------
  // 2. Deduplicate: for each normalised path keep the highest version
  // ------------------------------------------------------------------
  const byPath = new Map<string, Artifact>()

  for (const artifact of previewArtifacts) {
    const normalised = normalizePath(artifact.title)
    if (normalised === null) continue

    const existing = byPath.get(normalised)
    if (existing === undefined || artifact.version > existing.version) {
      byPath.set(normalised, artifact)
    }
  }

  // ------------------------------------------------------------------
  // 3. Insert each artifact into the tree
  // ------------------------------------------------------------------
  const mergeUserCss = options?.mergeUserCss !== false // default true

  for (const [normalised, artifact] of byPath) {
    const pathParts = normalised.split('/')

    // CSS merging: append to the existing src/index.css rather than
    // replacing it, so the template's Tailwind import and CSS variables
    // are preserved.
    if (
      mergeUserCss &&
      artifact.type === 'css' &&
      normalised !== 'src/index.css'
    ) {
      // Non-index CSS files are written as-is to their target path
      setNestedPath(tree, pathParts, stripContentFilenameComment(artifact.content))
      continue
    }

    if (
      mergeUserCss &&
      artifact.type === 'css' &&
      normalised === 'src/index.css'
    ) {
      // Append to existing index.css so Tailwind directives + CSS vars survive.
      // Template uses Tailwind v3 (@tailwind base/components/utilities).
      // Strip duplicate @tailwind directives from user artifact to avoid conflicts.
      const existing = getFileNode(tree, pathParts)
      const baseContents = existing?.file.contents ?? ''

      // Extract external @import url("https://...") statements from user CSS.
      // CSS spec requires @import to precede all other rules, but in the merged
      // file the template's :root{} block comes first. We hoist external imports
      // to before the @import "tailwindcss" line to keep the CSS valid.
      const externalImports: string[] = []
      const userCss = artifact.content
        // Hoist external @import url(...) — captured separately
        .replace(/@import\s+url\(['"]?https?:\/\/[^'")\s]+['"]?\)\s*;?/g, (m) => {
          externalImports.push(m.endsWith(';') ? m : m + ';')
          return ''
        })
        // Strip duplicate @tailwind directives — template already includes them
        .replace(/@tailwind\s+base\s*;?/g, '')
        .replace(/@tailwind\s+components\s*;?/g, '')
        .replace(/@tailwind\s+utilities\s*;?/g, '')
        .replace(/@import\s+["']tailwindcss["']\s*;?/g, '')
        // Strip CSS-invalid comments (// lines and # filename: metadata lines)
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/^\s*#\s+.*$/gm, '')
        // Fix known CSS issues: .card-pricing-featured must have overflow:visible for protruding badges
        .replace(/(\.card-pricing-featured\s*\{[^}]*?)overflow\s*:\s*hidden/g, '$1overflow: visible')
        // Strip Tailwind v4 @theme blocks (PostCSS v3 does not understand @theme)
        .replace(/@theme\s+(?:inline\s*)?\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs, '')
        // @apply is supported natively — Tailwind v3 template
        .trim()

      // Prepend external imports before first @tailwind directive in base CSS (v3 template).
      // Falls back to prepending at the very beginning if anchor not found.
      let mergedBase = baseContents
      if (externalImports.length > 0) {
        const hoisted = externalImports.join('\n') + '\n'
        if (mergedBase.includes('@tailwind base')) {
          mergedBase = mergedBase.replace('@tailwind base', hoisted + '@tailwind base')
        } else {
          mergedBase = hoisted + mergedBase
        }
      }

      const separator = mergedBase.endsWith('\n') ? '' : '\n'
      setNestedPath(tree, pathParts, `${mergedBase}${separator}${userCss}`)
      continue
    }

    setNestedPath(tree, pathParts, stripContentFilenameComment(artifact.content))
  }

  // ------------------------------------------------------------------
  // 4. Resolve "loose" artifacts: AI sometimes gives a bare filename
  //    (e.g. "file.tsx") instead of the proper path (e.g. "src/pages/Home.tsx").
  //    We detect this by parsing App.tsx imports and mapping unresolved ones
  //    to bare-named artifacts.
  // ------------------------------------------------------------------
  resolveLooseArtifacts(tree, byPath)

  return tree
}

/**
 * Post-processing step: if App.tsx imports a path that doesn't exist in the
 * tree, check whether any "loose" artifact (bare filename, no subdirectory)
 * can fill the gap. Writes the loose artifact to the missing path.
 */
function resolveLooseArtifacts(
  tree: WCFileSystemTree,
  byPath: Map<string, Artifact>,
): void {
  // Find artifacts with bare paths (src/<name>.tsx — no sub-directory)
  const looseEntries: Array<{ originalPath: string; artifact: Artifact }> = []
  for (const [normalised, artifact] of byPath) {
    const parts = normalised.split('/')
    // "src/<file>" has exactly 2 parts — that's a bare artifact
    if (parts.length === 2 && parts[0] === 'src') {
      looseEntries.push({ originalPath: normalised, artifact })
    }
  }
  if (looseEntries.length === 0) return

  // Read src/App.tsx from the built tree
  const appNode = getFileNode(tree, ['src', 'App.tsx'])
  if (!appNode) return

  const appContent =
    typeof appNode.file.contents === 'string'
      ? appNode.file.contents
      : new TextDecoder().decode(appNode.file.contents as Uint8Array)

  // Extract relative imports: import X from "./pages/Home" etc.
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g
  const extensions = ['.tsx', '.ts', '.jsx', '.js', '']

  let match: RegExpExecArray | null
  while ((match = importRegex.exec(appContent)) !== null) {
    const importPath = match[1] // e.g. "./pages/Home"
    const resolved = `src/${importPath.replace(/^\.\//, '')}` // e.g. "src/pages/Home"

    // Check if any extension resolves to an existing file in the tree
    const exists = extensions.some((ext) => {
      const pathParts = (resolved + ext).split('/')
      return getFileNode(tree, pathParts) !== null
    })

    if (!exists && looseEntries.length > 0) {
      // Map the first available loose artifact to this missing path
      const entry = looseEntries.shift()!
      const targetPath = resolved + '.tsx'
      const pathParts = targetPath.split('/')
      setNestedPath(tree, pathParts, stripContentFilenameComment(entry.artifact.content))
    }
  }
}
