import Link from "next/link"
import { readdir, readFile } from "fs/promises"
import { join } from "path"
import matter from "gray-matter"
import { Calendar, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { BlogPostFrontmatter } from "@/app/blog/page"

interface RelatedPost {
  slug: string
  frontmatter: BlogPostFrontmatter
}

interface RelatedPostsProps {
  currentSlug: string
  currentTags: string[]
  currentCategory: string
  limit?: number
}

/**
 * Calculate similarity score between two posts based on tags and category
 */
function calculateSimilarity(
  post: RelatedPost,
  tags: string[],
  category: string
): number {
  let score = 0

  // Category match gives high score
  if (post.frontmatter.category === category) {
    score += 10
  }

  // Each matching tag gives a point
  const postTags = post.frontmatter.tags || []
  const matchingTags = postTags.filter((tag) => tags.includes(tag))
  score += matchingTags.length * 2

  return score
}

/**
 * Get related blog posts based on tags and category
 */
async function getRelatedPosts({
  currentSlug,
  currentTags,
  currentCategory,
  limit = 3,
}: RelatedPostsProps): Promise<RelatedPost[]> {
  const contentPath = join(process.cwd(), "content", "blog")

  try {
    const files = await readdir(contentPath)
    const mdxFiles = files.filter(
      (file) => file.endsWith(".mdx") && file.replace(".mdx", "") !== currentSlug
    )

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

    // Calculate similarity scores and sort
    const postsWithScores = posts.map((post) => ({
      post,
      score: calculateSimilarity(post, currentTags, currentCategory),
    }))

    const sortedPosts = postsWithScores
      .filter((item) => item.score > 0) // Only include posts with some similarity
      .sort((a, b) => {
        // First sort by score
        if (b.score !== a.score) {
          return b.score - a.score
        }
        // Then by date (newest first)
        return (
          new Date(b.post.frontmatter.date).getTime() -
          new Date(a.post.frontmatter.date).getTime()
        )
      })
      .slice(0, limit)
      .map((item) => item.post)

    // If we don't have enough related posts, fill with recent posts
    if (sortedPosts.length < limit) {
      const recentPosts = posts
        .filter((post) => !sortedPosts.includes(post))
        .sort(
          (a, b) =>
            new Date(b.frontmatter.date).getTime() -
            new Date(a.frontmatter.date).getTime()
        )
        .slice(0, limit - sortedPosts.length)

      return [...sortedPosts, ...recentPosts]
    }

    return sortedPosts
  } catch (error) {
    console.error("Error getting related posts:", error)
    return []
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
 * Related posts component
 * Shows up to 3 related posts at the bottom of a blog post
 */
export async function RelatedPosts({
  currentSlug,
  currentTags,
  currentCategory,
  limit = 3,
}: RelatedPostsProps) {
  const relatedPosts = await getRelatedPosts({
    currentSlug,
    currentTags,
    currentCategory,
    limit,
  })

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="mt-16 pt-12 border-t">
      <h2 className="text-2xl font-bold font-heading mb-6">Related Articles</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block"
          >
            <article className="h-full border rounded-lg overflow-hidden hover:border-primary transition-colors">
              {/* Featured image */}
              {post.frontmatter.image && (
                <div className="aspect-[16/9] bg-accent/50 overflow-hidden">
                  <img
                    src={post.frontmatter.image}
                    alt={post.frontmatter.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-5 space-y-3">
                {/* Category */}
                <Badge variant="secondary" className="text-xs">
                  {post.frontmatter.category}
                </Badge>

                {/* Title */}
                <h3 className="text-lg font-semibold font-heading group-hover:text-primary transition-colors line-clamp-2">
                  {post.frontmatter.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.frontmatter.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="size-3" />
                  {formatDate(post.frontmatter.date)}
                </div>

                {/* Read more */}
                <div className="flex items-center gap-2 text-sm text-primary pt-2">
                  Read more
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}
