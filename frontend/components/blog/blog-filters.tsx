"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { BlogPostFrontmatter } from "@/app/blog/page"

interface BlogPost {
  slug: string
  frontmatter: BlogPostFrontmatter
}

interface BlogFiltersProps {
  posts: BlogPost[]
  onFilterChange: (filteredPosts: BlogPost[]) => void
}

/**
 * Blog filters component with category filtering and search
 * Client-side filtering for better UX
 */
export function BlogFilters({ posts, onFilterChange }: BlogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Extract unique categories from posts
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    posts.forEach((post) => {
      if (post.frontmatter.category) {
        categorySet.add(post.frontmatter.category)
      }
    })
    return Array.from(categorySet).sort()
  }, [posts])

  // Filter posts based on search query and selected category
  const filteredPosts = useMemo(() => {
    let result = posts

    // Filter by category
    if (selectedCategory) {
      result = result.filter(
        (post) => post.frontmatter.category === selectedCategory
      )
    }

    // Filter by search query (title, description, tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((post) => {
        const matchesTitle = post.frontmatter.title
          .toLowerCase()
          .includes(query)
        const matchesDescription = post.frontmatter.description
          .toLowerCase()
          .includes(query)
        const matchesTags = post.frontmatter.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        )
        const matchesAuthor = post.frontmatter.author
          .toLowerCase()
          .includes(query)

        return (
          matchesTitle || matchesDescription || matchesTags || matchesAuthor
        )
      })
    }

    return result
  }, [posts, selectedCategory, searchQuery])

  // Update parent component when filters change
  useMemo(() => {
    onFilterChange(filteredPosts)
  }, [filteredPosts, onFilterChange])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
  }

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== null

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search articles by title, tags, or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={
                  selectedCategory === category ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category ? null : category
                  )
                }
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between py-2 px-4 bg-accent/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPosts.length} of {posts.length} articles
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
