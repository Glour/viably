# MDX Components

Reusable React components for MDX documentation in the Viably platform.

## Components

### Heading

Custom heading component with automatic anchor links for deep linking.

**Features:**
- Auto-generates slugs from heading text
- Supports h1, h2, h3, h4, h5, h6
- Hover-to-reveal link icon
- Smooth scroll behavior
- Accessible with ARIA labels

**Usage:**
```tsx
import { Heading } from '@/components/mdx'

// In MDX files, headings are automatically converted
## This is a heading

// Or use directly in React
<Heading as="h2">Custom Heading</Heading>
```

### CodeBlock

Syntax-highlighted code blocks with copy-to-clipboard functionality.

**Features:**
- Syntax highlighting via prism-react-renderer
- Supports multiple languages (tsx, python, bash, json, yaml, etc.)
- Copy-to-clipboard button
- Optional line numbers
- Dark theme compatible (Night Owl theme)
- Language label display

**Usage:**
```tsx
import { CodeBlock } from '@/components/mdx'

// In MDX files with language specified
```tsx
export default function Page() {
  return <div>Hello World</div>
}
```

// Or use directly in React
<CodeBlock className="language-python" showLineNumbers>
{`def hello():
    print("Hello World")`}
</CodeBlock>
```

### InlineCode

Inline code component for short code snippets within text.

**Usage:**
```tsx
import { InlineCode } from '@/components/mdx'

// In MDX files, backticks are automatically converted
This is an `inline code` example

// Or use directly in React
<InlineCode>npm install</InlineCode>
```

### Image

Optimized image component using Next.js Image with lazy loading.

**Features:**
- Next.js Image optimization
- Automatic sizing
- Lazy loading
- Optional caption support
- Loading skeleton
- External URL support

**Usage:**
```tsx
import { Image } from '@/components/mdx'

// In MDX files
![Alt text](/path/to/image.png)

// Or use directly with caption
<Image
  src="/docs/screenshot.png"
  alt="Dashboard screenshot"
  caption="The main dashboard interface"
  width={1200}
  height={630}
/>
```

### ImageGrid

Grid layout for displaying multiple images.

**Features:**
- Responsive grid (1, 2, 3, or 4 columns)
- Mobile-first design

**Usage:**
```tsx
import { Image, ImageGrid } from '@/components/mdx'

<ImageGrid columns={3}>
  <Image src="/image1.png" alt="Image 1" />
  <Image src="/image2.png" alt="Image 2" />
  <Image src="/image3.png" alt="Image 3" />
</ImageGrid>
```

## Setup

### 1. Create MDX Components Provider

Create `mdx-components.tsx` in your app root:

```tsx
import type { MDXComponents } from 'mdx/types'
import { getMDXComponents } from '@/components/mdx/mdx-components'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...getMDXComponents(),
    ...components,
  }
}
```

### 2. Use in MDX Pages

Create MDX files in your `content` or `app` directory:

```mdx
# My Documentation

This is a paragraph with `inline code`.

## Code Example

```tsx
export default function Component() {
  return <div>Hello</div>
}
```

## Images

<Image
  src="/docs/example.png"
  alt="Example screenshot"
  caption="This is a caption"
/>

## Image Grid

<ImageGrid columns={2}>
  <Image src="/image1.png" alt="Image 1" />
  <Image src="/image2.png" alt="Image 2" />
</ImageGrid>
```

## Styling

All components use:
- **Tailwind CSS v4** for styling
- **next-themes** for dark mode support
- **lucide-react** for icons
- Design tokens from `/app/globals.css`

## Accessibility

- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators
- Alt text required for images

## TypeScript

All components are fully typed with TypeScript for better DX and type safety.
