import { notFound } from "next/navigation"
import { readFile, readdir } from "fs/promises"
import { join } from "path"
import matter from "gray-matter"
import { compileMDX } from "next-mdx-remote/rsc"
import type { Metadata } from "next"
import Link from "next/link"
import { Calendar, Clock, User, ArrowLeft } from "lucide-react"
import { getMDXComponents } from "@/shared/components/mdx/mdx-components"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { RelatedPosts } from "@/shared/components/blog/related-posts"
import type { BlogPostFrontmatter } from "../page"

/**
 * Generate static params for all available blog posts
 * Enables static generation at build time
 */
export async function generateStaticParams() {
  const contentPath = join(process.cwd(), "content", "blog")

  try {
    const files = await readdir(contentPath)
    const mdxFiles = files.filter((file) => file.endsWith(".mdx"))

    return mdxFiles.map((file) => ({
      slug: file.replace(".mdx", ""),
    }))
  } catch (error) {
    console.error("Error generating static params for blog:", error)
    return []
  }
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
    const { frontmatter } = await getBlogPostContent(slug)

    return {
      title: `${frontmatter.title} | Viably Blog`,
      description: frontmatter.description,
      authors: frontmatter.author ? [{ name: frontmatter.author }] : undefined,
      keywords: frontmatter.tags,
      openGraph: {
        title: frontmatter.title,
        description: frontmatter.description,
        type: "article",
        publishedTime: frontmatter.date,
        url: `/blog/${slug}`,
        images: frontmatter.image ? [{ url: frontmatter.image }] : undefined,
        authors: frontmatter.author ? [frontmatter.author] : undefined,
        tags: frontmatter.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: frontmatter.title,
        description: frontmatter.description,
        images: frontmatter.image ? [frontmatter.image] : undefined,
      },
    }
  } catch {
    return {
      title: "Blog Post Not Found | Viably",
      description: "The requested blog post could not be found.",
    }
  }
}

/**
 * Read and parse blog post MDX file from content directory
 */
async function getBlogPostContent(slug: string): Promise<{
  content: string
  frontmatter: BlogPostFrontmatter
}> {
  const contentPath = join(process.cwd(), "content", "blog", `${slug}.mdx`)

  try {
    const source = await readFile(contentPath, "utf8")
    const { data, content } = matter(source)

    // Validate frontmatter
    if (!data.title || !data.description || !data.date || !data.author) {
      throw new Error(
        "Missing required frontmatter fields: title, description, date, author"
      )
    }

    const frontmatter: BlogPostFrontmatter = {
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
      tags: data.tags || [],
      category: data.category || "General",
      image: data.image,
      readingTime: data.readingTime,
    }

    return { content, frontmatter }
  } catch (error) {
    console.error(`Error reading blog post: ${slug}`, error)
    throw error
  }
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Dynamic blog post page
 * Server component that compiles MDX on the server
 */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  try {
    const { content, frontmatter } = await getBlogPostContent(slug)

    // Compile MDX with custom components on the server
    const { content: MDXContent } = await compileMDX<BlogPostFrontmatter>({
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-0">
              <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent font-heading font-bold text-xl">
                V
              </span>
              <span className="font-heading font-bold text-lg">iably</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Дашборд</Link>
              </Button>
            </nav>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12">
          {/* Back button */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blog" className="flex items-center gap-2">
                <ArrowLeft className="size-4" />
                Назад к блогу
              </Link>
            </Button>
          </div>

          {/* Article */}
          <article className="max-w-3xl mx-auto">
            {/* Featured image */}
            {frontmatter.image && (
              <div className="aspect-[16/9] rounded-lg overflow-hidden mb-8 bg-accent/50">
                <img
                  src={frontmatter.image}
                  alt={frontmatter.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header */}
            <header className="space-y-6 mb-8">
              {/* Category and reading time */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{frontmatter.category}</Badge>
                {frontmatter.readingTime && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="size-4" />
                    {frontmatter.readingTime}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {frontmatter.title}
              </h1>

              {/* Description */}
              <p className="text-lg text-muted-foreground">
                {frontmatter.description}
              </p>

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span className="font-medium">{frontmatter.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  {formatDate(frontmatter.date)}
                </div>
              </div>

              {/* Tags */}
              {frontmatter.tags && frontmatter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {frontmatter.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </header>

            {/* Divider */}
            <hr className="border-t border-border mb-8" />

            {/* MDX Content */}
            <div className="prose prose-neutral dark:prose-invert max-w-none mdx-content">
              {MDXContent}
            </div>

            {/* Related Posts */}
            <RelatedPosts
              currentSlug={slug}
              currentTags={frontmatter.tags}
              currentCategory={frontmatter.category}
            />
          </article>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error rendering blog post page:", error)
    notFound()
  }
}
