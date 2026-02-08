import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'
import type { Metadata } from 'next'
import { getMDXComponents } from '@/components/mdx/mdx-components'

/**
 * Frontmatter structure for documentation pages
 */
interface DocFrontmatter {
  title: string
  description: string
  date?: string
  author?: string
}

/**
 * Generate static params for all available documentation pages
 * This enables static generation at build time
 */
export async function generateStaticParams() {
  // For now, return known slugs. In production, scan the content/docs directory
  return [
    { slug: 'quickstart' },
    { slug: 'installation' },
  ]
}

/**
 * Generate dynamic metadata for SEO from MDX frontmatter
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const { frontmatter } = await getDocContent(slug)

    return {
      title: `${frontmatter.title} | Viably Documentation`,
      description: frontmatter.description,
      authors: frontmatter.author ? [{ name: frontmatter.author }] : undefined,
      openGraph: {
        title: frontmatter.title,
        description: frontmatter.description,
        type: 'article',
        publishedTime: frontmatter.date,
        url: `/docs/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: frontmatter.title,
        description: frontmatter.description,
      },
    }
  } catch {
    return {
      title: 'Documentation Not Found | Viably',
      description: 'The requested documentation page could not be found.',
    }
  }
}

/**
 * Read and parse MDX file from content directory
 */
async function getDocContent(slug: string): Promise<{
  content: string
  frontmatter: DocFrontmatter
}> {
  const contentPath = join(process.cwd(), 'content', 'docs', `${slug}.mdx`)

  try {
    const source = await readFile(contentPath, 'utf8')
    const { data, content } = matter(source)

    // Validate frontmatter
    if (!data.title || !data.description) {
      throw new Error('Missing required frontmatter fields: title and description')
    }

    const frontmatter: DocFrontmatter = {
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
    }

    return { content, frontmatter }
  } catch (error) {
    console.error(`Error reading doc file: ${slug}`, error)
    throw error
  }
}

/**
 * Dynamic documentation page
 * Server component that compiles MDX on the server
 */
export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  try {
    const { content, frontmatter } = await getDocContent(slug)

    // Compile MDX with custom components on the server
    const { content: MDXContent } = await compileMDX<DocFrontmatter>({
      source: content,
      options: {
        parseFrontmatter: false, // We already parsed it with gray-matter
        mdxOptions: {
          remarkPlugins: [],
          rehypePlugins: [],
        },
      },
      components: getMDXComponents(),
    })

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <header className="space-y-2">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {frontmatter.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {frontmatter.description}
          </p>
          {(frontmatter.date || frontmatter.author) && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              {frontmatter.author && <span>By {frontmatter.author}</span>}
              {frontmatter.date && (
                <span>
                  {new Date(frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}
        </header>

        {/* Divider */}
        <hr className="border-t border-border" />

        {/* MDX Content */}
        <div className="mdx-content">
          {MDXContent}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering documentation page:', error)
    notFound()
  }
}
