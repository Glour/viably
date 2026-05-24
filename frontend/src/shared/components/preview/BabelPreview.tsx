"use client"

/**
 * BabelPreview — cross-browser fallback preview component.
 * Feature: 002-production-preview
 *
 * Works in all browsers including Safari — no WebContainers, no SharedArrayBuffer.
 * Uses Babel standalone + React UMD + Tailwind CDN to render React/TS components
 * inside a sandboxed iframe via srcdoc.
 */

import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Artifact } from '@/features/generation/types/conversation'
import type { DeviceSize } from './types'

// ============================================================================
// Constants
// ============================================================================

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

/**
 * Files we skip from preview — these are bundler/config files not meant for browser runtime.
 */
const SKIP_PATTERNS = [
  'vite.config',
  'tailwind.config',
  'postcss.config',
  'tsconfig',
  '.env',
  'next.config',
]

// ============================================================================
// HTML builder
// ============================================================================

function buildBabelHTML(artifacts: Artifact[]): string {
  const componentFiles = artifacts.filter((a) => {
    if (!['react', 'typescript', 'javascript', 'css'].includes(a.type)) return false
    const title = a.title || ''
    if (SKIP_PATTERNS.some((p) => title.includes(p))) return false
    return true
  })

  const tsxFiles = componentFiles.filter((a) => a.type !== 'css')
  const cssFiles = componentFiles.filter((a) => a.type === 'css')

  // Build file map: normalized name → content
  const fileMap: Record<string, string> = {}
  for (const a of tsxFiles) {
    const name = (a.title || 'App.tsx')
      .replace(/^\.?\/?(src\/)?/, '')
      .trim()
    fileMap[name] = a.content
  }

  // Find main app entry (App.tsx / app.tsx, else first file)
  const mainName =
    Object.keys(fileMap).find((k) => /^(app|App)\.[jt]sx?$/.test(k)) ||
    Object.keys(fileMap).find((k) => /App\.[jt]sx?$/.test(k)) ||
    Object.keys(fileMap)[0] ||
    'App.tsx'

  const cssContent = cssFiles.map((a) => a.content).join('\n')
  const filesJson = JSON.stringify(fileMap)
  const mainNameJson = JSON.stringify(mainName)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></scr` + `ipt>
  <style>
    @layer base {
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 222.2 84% 4.9%;
        --primary: 262.1 83.3% 57.8%;
        --primary-foreground: 210 40% 98%;
        --secondary: 210 40% 96%;
        --secondary-foreground: 222.2 47.4% 11.2%;
        --muted: 210 40% 96%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 210 40% 96%;
        --accent-foreground: 222.2 47.4% 11.2%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 210 40% 98%;
        --border: 214.3 31.8% 91.4%;
        --input: 214.3 31.8% 91.4%;
        --ring: 262.1 83.3% 57.8%;
        --radius: 0.5rem;
      }
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: hsl(var(--background)); color: hsl(var(--foreground)); }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></scr` + `ipt>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></scr` + `ipt>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></scr` + `ipt>
  <script>
    var __files = ${filesJson};
    var __cache = {};

    function __require(id) {
      if (id === 'react' || id === 'React') return window.React;
      if (id === 'react-dom' || id === 'react-dom/client') return window.ReactDOM;
      if (id === 'react/jsx-runtime') {
        return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment };
      }
      // External packages (lucide-react, etc.) — return empty stubs so imports don't crash
      if (!id.startsWith('.')) {
        return window[id] || new Proxy({}, { get: function(_, k) { return function(){return null;}; } });
      }

      // Resolve relative import to a key in __files
      var bare = id.replace(/^\.\//, '').replace(/^\.\.\//, '');
      var exts = ['', '.tsx', '.ts', '.jsx', '.js'];
      var found = null;
      for (var i = 0; i < exts.length && !found; i++) {
        var candidate = bare + exts[i];
        if (__files[candidate]) { found = candidate; break; }
        // Try with src/ prefix stripped (in case title had it)
        var keys = Object.keys(__files);
        for (var j = 0; j < keys.length; j++) {
          var k = keys[j];
          if (k === candidate || k.endsWith('/' + candidate)) { found = k; break; }
        }
      }

      if (!found) return {};
      if (__cache[found]) return __cache[found].exports;

      var mod = { exports: {} };
      __cache[found] = mod;
      try {
        var compiled = Babel.transform(__files[found], {
          presets: [['react', { runtime: 'classic' }], 'typescript'],
          filename: found,
        }).code;
        new Function('require', 'module', 'exports', 'React', compiled)(
          __require, mod, mod.exports, window.React
        );
      } catch (e) {
        console.warn('[BabelPreview] Module error:', found, e.message);
      }
      return mod.exports;
    }

    window.addEventListener('DOMContentLoaded', function () {
      var rootEl = document.getElementById('root');
      try {
        var mainSrc = __files[${mainNameJson}];
        if (!mainSrc) throw new Error('Main file not found: ' + ${mainNameJson});

        var compiled = Babel.transform(mainSrc, {
          presets: [['react', { runtime: 'classic' }], 'typescript'],
          filename: ${mainNameJson},
        }).code;

        var mod = { exports: {} };
        __cache[${mainNameJson}] = mod;
        new Function('require', 'module', 'exports', 'React', compiled)(
          __require, mod, mod.exports, window.React
        );

        var App = mod.exports.default || Object.values(mod.exports).find(function(v) { return typeof v === 'function'; });
        if (!App) throw new Error('No default export found in ' + ${mainNameJson});

        var root = ReactDOM.createRoot(rootEl);
        root.render(React.createElement(App));
      } catch (e) {
        rootEl.innerHTML =
          '<div style="padding:20px;color:#c00;font-family:monospace;font-size:13px;white-space:pre-wrap">' +
          '<strong>Preview Error</strong>\\n\\n' + e.message + '</div>';
      }
    });
  </scr` + `ipt>
</body>
</html>`
}

// ============================================================================
// Component
// ============================================================================

export interface BabelPreviewProps {
  artifacts: Artifact[]
  deviceSize?: DeviceSize
  className?: string
}

export function BabelPreview({ artifacts, deviceSize = 'desktop', className }: BabelPreviewProps) {
  const html = useMemo(() => buildBabelHTML(artifacts), [artifacts])

  return (
    <div className={cn('flex flex-col h-full bg-muted/30', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">Превью</span>
        </div>
        <button
          onClick={() => {
            // Force re-render by triggering parent re-mount via key if needed
            const iframe = document.querySelector('iframe[title="Babel Preview"]') as HTMLIFrameElement | null
            if (iframe) {
              const src = iframe.srcdoc
              iframe.srcdoc = ''
              requestAnimationFrame(() => { iframe.srcdoc = src })
            }
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          type="button"
          aria-label="Обновить превью"
        >
          <RefreshCw className="w-3 h-3" />
          Обновить
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex justify-center bg-muted/20">
        <div
          style={{ width: DEVICE_WIDTHS[deviceSize], height: '100%', minHeight: '100%' }}
          className="relative"
        >
          <iframe
            srcDoc={html}
            className="w-full h-full border-0"
            title="Babel Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  )
}
