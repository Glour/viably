import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'
import type { Metadata } from 'next'
import { getMDXComponents } from "@/shared/components/mdx/mdx-components"

/**
 * Frontmatter structure for template documentation pages
 */
interface TemplateFrontmatter {
  title: string
  description: string
  date?: string
  author?: string
}

/**
 * Generate static params for all available template pages
 */
export async function generateStaticParams() {
  return [
    { slug: 'discord' },
    { slug: 'telegram' },
    { slug: 'slack' },
    { slug: 'whatsapp' },
    { slug: 'custom' },
    { slug: 'guide' },
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
    const { frontmatter } = await getTemplateContent(slug)

    return {
      title: `${frontmatter.title} | Viably Documentation`,
      description: frontmatter.description,
      authors: frontmatter.author ? [{ name: frontmatter.author }] : undefined,
      openGraph: {
        title: frontmatter.title,
        description: frontmatter.description,
        type: 'article',
        publishedTime: frontmatter.date,
        url: `/docs/templates/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: frontmatter.title,
        description: frontmatter.description,
      },
    }
  } catch {
    return {
      title: 'Template Guide Not Found | Viably',
      description: 'The requested template guide could not be found.',
    }
  }
}

/**
 * Read and parse MDX file from content/docs/templates directory
 */
async function getTemplateContent(slug: string): Promise<{
  content: string
  frontmatter: TemplateFrontmatter
}> {
  const contentPath = join(process.cwd(), 'content', 'docs', 'templates', `${slug}.mdx`)

  try {
    const source = await readFile(contentPath, 'utf8')
    const { data, content } = matter(source)

    // Validate frontmatter
    if (!data.title || !data.description) {
      throw new Error('Missing required frontmatter fields: title and description')
    }

    const frontmatter: TemplateFrontmatter = {
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
    }

    return { content, frontmatter }
  } catch (error) {
    console.error(`Error reading template doc file: ${slug}`, error)
    throw error
  }
}

/**
 * Template documentation page component
 */
export default async function TemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  try {
    const { content, frontmatter } = await getTemplateContent(slug)

    // Compile MDX on the server with custom components
    const { content: MDXContent } = await compileMDX({
      source: content,
      components: getMDXComponents(),
    })

    return (
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="mb-2">{frontmatter.title}</h1>
        {frontmatter.date && (
          <p className="text-sm text-muted-foreground mb-6">
            Last updated: {new Date(frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        <div className="mt-8">{MDXContent}</div>
      </article>
    )
  } catch (error) {
    console.error('Error rendering template page:', error)
    notFound()
  }
}
