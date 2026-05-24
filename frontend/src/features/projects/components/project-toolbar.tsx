"use client"

import { useState, useEffect } from "react"
import { Search, LayoutGrid, List } from "lucide-react"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Button } from "@/shared/ui/button"
import { useProjectsStore } from "@/features/projects/stores"
import { useDebounce } from "@/shared/hooks/use-debounce"
import type { ProjectFilter, ProjectSort } from "@/shared/types"

export function ProjectToolbar() {
  const searchQuery = useProjectsStore((s) => s.searchQuery)
  const filter = useProjectsStore((s) => s.filter)
  const sort = useProjectsStore((s) => s.sort)
  const viewMode = useProjectsStore((s) => s.viewMode)
  const setSearchQuery = useProjectsStore((s) => s.setSearchQuery)
  const setFilter = useProjectsStore((s) => s.setFilter)
  const setSort = useProjectsStore((s) => s.setSort)
  const setViewMode = useProjectsStore((s) => s.setViewMode)

  const [localQuery, setLocalQuery] = useState(searchQuery)
  const debouncedQuery = useDebounce(localQuery, 300)

  useEffect(() => {
    setSearchQuery(debouncedQuery)
  }, [debouncedQuery, setSearchQuery])

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search - full width on mobile */}
      <div className="relative flex-1 group" role="search">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
        <Input
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Поиск проектов..."
          className="pl-12 h-12 text-base bg-card/80 backdrop-blur-xl border-border/60 rounded-2xl transition-all duration-300 focus:border-primary/50 focus:shadow-[0_0_20px_var(--primary-glow)] focus:bg-card"
          aria-label="Поиск проектов"
        />
      </div>

      {/* Filter + Sort + View toggle */}
      <div className="flex gap-2">
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as ProjectFilter)}
        >
          <SelectTrigger aria-label="Фильтр по статусу">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="deployed">Запущенные</SelectItem>
            <SelectItem value="generated">Готовые</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
            <SelectItem value="failed">С ошибками</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(v) => setSort(v as ProjectSort)}
        >
          <SelectTrigger aria-label="Сортировка">
            <SelectValue placeholder="Новые первые" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Новые первые</SelectItem>
            <SelectItem value="oldest">Старые первые</SelectItem>
            <SelectItem value="name">По имени</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Сетка"
            className={viewMode === "grid" ? "bg-[image:var(--gradient-main)] shadow-[0_0_12px_var(--primary-glow)]" : "hover:bg-card/60"}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="Список"
            className={viewMode === "list" ? "bg-[image:var(--gradient-main)] shadow-[0_0_12px_var(--primary-glow)]" : "hover:bg-card/60"}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
