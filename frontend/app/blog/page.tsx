import type { Metadata } from "next"
import Link from "next/link"
import { readdir, readFile } from "fs/promises"
import { join } from "path"
import matter from "gray-matter"
import { Button } from "@/components/ui/button"
import { BlogListClient } from "@/components/blog/blog-list-client"

export const metadata: Metadata = {
  title: "Blog",
  description: "Latest articles, tutorials, and insights about building AI-powered bots with Viably",
}

/**
 * Frontmatter structure for blog posts
 */
export interface BlogPostFrontmatter {
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  category: string
  image?: string
  readingTime?: string
}

/**
 * Blog post with metadata
 */
interface BlogPost {
  slug: string
  frontmatter: BlogPostFrontmatter
}

/**
 * Get all blog posts from content/blog directory
 */
async function getAllBlogPosts(): Promise<BlogPost[]> {
  const contentPath = join(process.cwd(), "content", "blog")

  try {
    const files = await readdir(contentPath)
    const mdxFiles = files.filter((file) => file.endsWith(".mdx"))

    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const slug = file.replace(".mdx", "")
        const source = await readFile(join(contentPath, file), "utf8")
        const { data } = matter(source)

        return {
          slug,
          frontmatter: data as BlogPostFrontmatter,
        }
      })
    )

    // Sort by date (newest first)
    return posts.sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    )
  } catch (error) {
    console.error("Error reading blog posts:", error)
    return []
  }
}


/**
 * Blog listing page
 */
export default async function BlogPage() {
  const posts = await getAllBlogPosts()

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
              className="text-sm font-medium text-foreground"
            >
              Blog
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Page header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading">
            Viably Blog
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover the latest articles, tutorials, and insights about building
            AI-powered bots, automation, and the future of conversational AI.
          </p>
        </div>

        {/* Blog posts with filters */}
        {posts.length > 0 ? (
          <BlogListClient initialPosts={posts} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No blog posts yet. Check back soon for updates!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
