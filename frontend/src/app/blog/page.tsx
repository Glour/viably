import type { Metadata } from "next"
import { readdir, readFile } from "fs/promises"
import { join } from "path"
import matter from "gray-matter"
import { BlogListClient } from "@/shared/components/blog/blog-list-client"
import { MainLayout } from "@/widgets/layout"

export const metadata: Metadata = {
  title: "Блог",
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
    <MainLayout>
      <div className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div
            className="absolute rounded-full opacity-[0.08] dark:opacity-[0.15]"
            style={{
              width: 400,
              height: 400,
              background: "#7C3AED",
              filter: "blur(80px)",
              left: "20%",
              top: "10%",
            }}
          />
          <div
            className="absolute rounded-full opacity-[0.08] dark:opacity-[0.15]"
            style={{
              width: 300,
              height: 300,
              background: "#2563EB",
              filter: "blur(80px)",
              right: "15%",
              top: "30%",
            }}
          />
          <div
            className="absolute rounded-full opacity-[0.08] dark:opacity-[0.15]"
            style={{
              width: 250,
              height: 250,
              background: "#06B6D4",
              filter: "blur(80px)",
              left: "40%",
              bottom: "20%",
            }}
          />
        </div>

        {/* Page header with gradient text */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading">
            <span className="bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              Viably
            </span>{" "}
            Блог
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Статьи, руководства и полезные материалы о создании
            AI-ботов, автоматизации и будущем разговорного ИИ.
          </p>
        </div>

        {/* Blog posts with filters */}
        {posts.length > 0 ? (
          <BlogListClient initialPosts={posts} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Пока нет статей. Скоро здесь появятся новые материалы!
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
