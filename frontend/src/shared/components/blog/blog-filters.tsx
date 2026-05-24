"use client"

import { useState, useMemo } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
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
      {/* Search bar with glass morphism */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Поиск статей по заголовку, тегам или автору..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-11 h-12 border-border/50 bg-card/40 backdrop-blur-xl focus:border-primary/50 focus:shadow-[0_0_16px_var(--primary-glow)] transition-all duration-300"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors hover:scale-110"
            aria-label="Очистить поиск"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category filters with modern styling */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground font-heading">Categories</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-300 ${
                selectedCategory === null
                  ? "bg-[image:var(--gradient-main)] text-white shadow-[0_0_16px_var(--primary-glow)] border-transparent"
                  : "border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-primary-subtle"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              Все
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={
                  selectedCategory === category ? "default" : "outline"
                }
                className={`cursor-pointer transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-[image:var(--gradient-main)] text-white shadow-[0_0_16px_var(--primary-glow)] border-transparent"
                    : "border-border/50 bg-card/40 backdrop-blur-sm hover:border-primary/50 hover:bg-primary-subtle"
                }`}
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

      {/* Active filters indicator with glass morphism */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between py-3 px-5 bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredPosts.length}</span> of {posts.length} articles
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs hover:bg-primary-subtle hover:text-primary transition-colors"
          >
            Сбросить фильтры
          </Button>
        </div>
      )}
    </div>
  )
}
