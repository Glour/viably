"use client"

import { useState, useEffect } from "react"
import { Search, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useProjectsStore } from "@/stores/projects"
import { useDebounce } from "@/hooks/use-debounce"
import type { ProjectFilter, ProjectSort } from "@/types"

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
      <div className="relative flex-1" role="search">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Поиск..."
          className="pl-9"
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

        <div className="flex rounded-lg border">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Сетка"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="Список"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
