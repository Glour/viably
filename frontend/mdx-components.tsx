import type { MDXComponents } from 'mdx/types'
import { getMDXComponents } from '@/components/mdx/mdx-components'

/**
 * This file is required by @next/mdx to provide custom components
 * for MDX rendering throughout the application
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...getMDXComponents(),
    ...components,
  }
}
