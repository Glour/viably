import type { PreviewTemplateConfig, WCFileSystemTree } from './types'
import { UI_COMPONENTS } from './ui-components'

// ============================================================================
// Template file contents
// ============================================================================

export const TEMPLATE_PACKAGE_JSON = JSON.stringify({
  name: 'viably-preview',
  private: true,
  version: '0.0.0',
  type: 'module',
  scripts: {
    dev: 'vite --host 0.0.0.0',
    build: 'tsc -b && vite build',
  },
  dependencies: {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    'react-router-dom': '^7.2.0',
    'class-variance-authority': '^0.7.1',
    clsx: '^2.1.1',
    'tailwind-merge': '^2.6.0',
    'lucide-react': '^0.469.0',
    '@tanstack/react-query': '^5.67.2',
    'react-hook-form': '^7.54.2',
    zod: '^3.24.2',
    'date-fns': '^4.1.0',
    '@radix-ui/react-dialog': '^1.1.5',
    '@radix-ui/react-dropdown-menu': '^2.1.7',
    '@radix-ui/react-select': '^2.1.7',
    '@radix-ui/react-tabs': '^1.1.3',
    '@radix-ui/react-tooltip': '^1.1.7',
    '@radix-ui/react-slot': '^1.1.2',
    '@radix-ui/react-separator': '^1.1.2',
    '@radix-ui/react-avatar': '^1.1.3',
    '@radix-ui/react-checkbox': '^1.1.5',
    '@radix-ui/react-label': '^2.1.2',
    '@radix-ui/react-scroll-area': '^1.2.2',
    '@radix-ui/react-switch': '^1.1.3',
    '@radix-ui/react-accordion': '^1.2.3',
    '@radix-ui/react-popover': '^1.1.5',
    '@radix-ui/react-progress': '^1.1.2',
    '@hookform/resolvers': '^4.1.3',
  },
  devDependencies: {
    vite: '^6.0.11',
    '@vitejs/plugin-react': '^4.3.4',
    tailwindcss: '^3.4.17',
    autoprefixer: '^10.4.20',
    typescript: '^5.7.3',
    '@types/react': '^19.0.7',
    '@types/react-dom': '^19.0.3',
    '@types/node': '^22.10.7',
  },
}, null, 2)

export const TEMPLATE_VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: '0.0.0.0',
    hmr: { clientPort: 443 },
  },
})
`

export const TEMPLATE_INDEX_HTML = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`

export const TEMPLATE_TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    isolatedModules: true,
    moduleDetection: 'force',
    noEmit: true,
    jsx: 'react-jsx',
    strict: false,
    baseUrl: '.',
    paths: { '@/*': ['./src/*'] },
  },
  include: ['src'],
}, null, 2)

export const TEMPLATE_MAIN_TSX = `import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`

export const TEMPLATE_INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;


@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 220 14% 20%;
    --primary-foreground: 0 0% 100%;
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
    --ring: 220 14% 20%;
    --radius: 0.5rem;
  }
}

* { margin: 0; padding: 0; box-sizing: border-box; border-color: hsl(var(--border)); }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.btn-gradient {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
  box-shadow: 0 4px 20px hsl(var(--primary) / 0.35), 0 1px 3px hsl(var(--primary) / 0.2);
}
.btn-gradient:hover {
  box-shadow: 0 6px 28px hsl(var(--primary) / 0.45), 0 2px 6px hsl(var(--primary) / 0.25);
  transform: translateY(-1px);
}
`

// ============================================================================
// Template builder
// ============================================================================


export const TEMPLATE_POSTCSS_CONFIG = `module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

export const TEMPLATE_TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
`

export function buildPreviewTemplate(): PreviewTemplateConfig {
  return {
    packageJson: TEMPLATE_PACKAGE_JSON,
    viteConfig: TEMPLATE_VITE_CONFIG,
    indexHtml: TEMPLATE_INDEX_HTML,
    tsconfigJson: TEMPLATE_TSCONFIG,
    mainTsx: TEMPLATE_MAIN_TSX,
    indexCss: TEMPLATE_INDEX_CSS,
    postcssConfig: TEMPLATE_POSTCSS_CONFIG,
    tailwindConfig: TEMPLATE_TAILWIND_CONFIG,
    uiComponents: UI_COMPONENTS,
  }
}

// ============================================================================
// Build WCFileSystemTree from template + user files
// ============================================================================

export function buildTemplateFileTree(template: PreviewTemplateConfig): WCFileSystemTree {
  const uiDir: WCFileSystemTree = {}
  for (const [filePath, content] of Object.entries(template.uiComponents)) {
    // filePath like 'components/ui/button.tsx' → place under src/
    const parts = filePath.split('/')
    let node: WCFileSystemTree = uiDir
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!node[part]) {
        node[part] = { directory: {} }
      }
      node = (node[part] as { directory: WCFileSystemTree }).directory
    }
    node[parts[parts.length - 1]] = { file: { contents: content } }
  }

  return {
    'package.json': { file: { contents: template.packageJson } },
    'vite.config.ts': { file: { contents: template.viteConfig } },
    'index.html': { file: { contents: template.indexHtml } },
    'tsconfig.json': { file: { contents: template.tsconfigJson } },
    'postcss.config.cjs': { file: { contents: template.postcssConfig } },
    'tailwind.config.js': { file: { contents: template.tailwindConfig } },
    src: {
      directory: {
        'main.tsx': { file: { contents: template.mainTsx } },
        'index.css': { file: { contents: template.indexCss } },
        ...uiDir,
      },
    },
  }
}
