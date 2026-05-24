import type { MDXComponents } from 'mdx/types'
import { Heading } from './Heading'
import { CodeBlock, InlineCode } from './CodeBlock'
import { Image, ImageGrid } from './Image'
import { LiteYouTube } from '@/shared/components/video/lite-youtube'

/**
 * MDX components provider
 * Maps HTML elements to custom React components for MDX rendering
 *
 * Usage in mdx-components.tsx at root:
 * ```tsx
 * import { getMDXComponents } from '@/components/mdx/mdx-components'
 *
 * export function useMDXComponents(components: MDXComponents): MDXComponents {
 *   return {
 *     ...getMDXComponents(),
 *     ...components,
 *   }
 * }
 * ```
 */
export function getMDXComponents(): MDXComponents {
  return {
    // Headings with anchor links
    h1: (props) => <Heading as="h1" {...props} />,
    h2: (props) => <Heading as="h2" {...props} />,
    h3: (props) => <Heading as="h3" {...props} />,
    h4: (props) => <Heading as="h4" {...props} />,
    h5: (props) => <Heading as="h5" {...props} />,
    h6: (props) => <Heading as="h6" {...props} />,

    // Code blocks with syntax highlighting
    pre: ({ children, ...props }) => {
      // Extract code from pre > code structure
      if (typeof children === 'object' && children !== null && 'props' in children) {
        const codeProps = children.props as { children?: string; className?: string }
        return (
          <CodeBlock
            className={codeProps.className}
            {...props}
          >
            {codeProps.children || ''}
          </CodeBlock>
        )
      }
      return <pre {...props}>{children}</pre>
    },

    // Inline code
    code: (props) => <InlineCode {...props} />,

    // Images with optimization
    img: ({ src, alt, ...props }) => (
      <Image src={src || ''} alt={alt || ''} {...props} />
    ),

    // Custom components available in MDX
    Image,
    ImageGrid,
    CodeBlock,
    InlineCode,
    Heading,
    LiteYouTube,
  }
}
