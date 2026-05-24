"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Calendar, Clock, User, Tag, ArrowRight } from "lucide-react"
import { Badge } from "@/shared/ui/badge"
import { BlogFilters } from "./blog-filters"
import { fadeInUp, staggerContainer } from "@/shared/lib/animations"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
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
 * Blog post card component with modern glass morphism and hover effects
 */
function BlogPostCard({ post }: { post: BlogPost }) {
  const { slug, frontmatter } = post
  const reduced = useReducedMotion()

  const CardWrapper = reduced ? "div" : motion.div

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <CardWrapper
        className="h-full"
        whileHover={reduced ? undefined : { y: -8, scale: 1.02 }}
        transition={reduced ? undefined : { duration: 0.3, ease: "easeOut" }}
      >
        <article className="relative h-full border border-border/50 rounded-2xl overflow-hidden bg-card/40 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_24px_var(--primary-glow)]">
          {/* Gradient border overlay on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />

          {/* Featured image */}
          {frontmatter.image && (
            <div className="aspect-[16/9] bg-accent/50 overflow-hidden relative">
              <img
                src={frontmatter.image}
                alt={frontmatter.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-4 relative z-10">
            {/* Category badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="font-body text-xs bg-primary-subtle border-primary/20 hover:border-primary/40 transition-colors"
              >
                {frontmatter.category}
              </Badge>
              {frontmatter.readingTime && (
                <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {frontmatter.readingTime}
                </span>
              )}
            </div>

            {/* Title and description */}
            <div className="space-y-2">
              <h2 className="font-heading text-xl font-semibold line-clamp-2 group-hover:bg-[image:var(--gradient-main)] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {frontmatter.title}
              </h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {frontmatter.description}
              </p>
            </div>

            {/* Tags */}
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {frontmatter.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="font-body text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 rounded-md bg-accent/50 backdrop-blur-sm"
                  >
                    <Tag className="size-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 font-body text-xs text-muted-foreground pt-2 border-t border-border/30">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(frontmatter.date)}
              </div>
              <div className="flex items-center gap-1">
                <User className="size-3" />
                {frontmatter.author}
              </div>
            </div>

            {/* Read more link with gradient */}
            <div className="flex items-center gap-2 font-body text-sm font-medium pt-2 bg-[image:var(--gradient-main)] bg-clip-text text-transparent">
              Читать статью
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform text-primary" />
            </div>
          </div>
        </article>
      </CardWrapper>
    </Link>
  )
}

/**
 * Client-side blog list with filtering and animations
 */
export function BlogListClient({ initialPosts }: BlogListClientProps) {
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialPosts)
  const reduced = useReducedMotion()

  const handleFilterChange = useCallback((posts: BlogPost[]) => {
    setFilteredPosts(posts)
  }, [])

  const GridWrapper = reduced ? "div" : motion.div

  return (
    <div className="space-y-8">
      {/* Filters */}
      <BlogFilters posts={initialPosts} onFilterChange={handleFilterChange} />

      {/* Blog posts grid */}
      {filteredPosts.length > 0 ? (
        <GridWrapper
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={reduced ? undefined : staggerContainer}
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "visible"}
        >
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </GridWrapper>
      ) : (
        <div className="text-center py-12">
          <p className="font-body text-base text-muted-foreground">
            No articles found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}
