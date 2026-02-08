"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Calendar, Clock, User, Tag, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BlogFilters } from "./blog-filters"
import type { BlogPostFrontmatter } from "@/app/blog/page"

interface BlogPost {
  slug: string
  frontmatter: BlogPostFrontmatter
}

interface BlogListClientProps {
  initialPosts: BlogPost[]
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
 * Blog post card component
 */
function BlogPostCard({ post }: { post: BlogPost }) {
  const { slug, frontmatter } = post

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="h-full border rounded-lg overflow-hidden hover:border-primary transition-colors">
        {/* Featured image */}
        {frontmatter.image && (
          <div className="aspect-[16/9] bg-accent/50 overflow-hidden">
            <img
              src={frontmatter.image}
              alt={frontmatter.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {frontmatter.category}
            </Badge>
            {frontmatter.readingTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {frontmatter.readingTime}
              </span>
            )}
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold font-heading group-hover:text-primary transition-colors line-clamp-2">
              {frontmatter.title}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {frontmatter.description}
            </p>
          </div>

          {/* Tags */}
          {frontmatter.tags && frontmatter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <Tag className="size-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(frontmatter.date)}
            </div>
            <div className="flex items-center gap-1">
              <User className="size-3" />
              {frontmatter.author}
            </div>
          </div>

          {/* Read more link */}
          <div className="flex items-center gap-2 text-sm text-primary pt-2">
            Read article
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  )
}

/**
 * Client-side blog list with filtering
 */
export function BlogListClient({ initialPosts }: BlogListClientProps) {
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialPosts)

  const handleFilterChange = useCallback((posts: BlogPost[]) => {
    setFilteredPosts(posts)
  }, [])

  return (
    <div className="space-y-8">
      {/* Filters */}
      <BlogFilters posts={initialPosts} onFilterChange={handleFilterChange} />

      {/* Blog posts grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No articles found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}
