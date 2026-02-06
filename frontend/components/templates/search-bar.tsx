"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { useTemplatesStore } from "@/stores/templates"

export function SearchBar() {
  const setSearchQuery = useTemplatesStore((s) => s.setSearchQuery)
  const [value, setValue] = useState("")
  const debouncedValue = useDebounce(value, 300)

  useEffect(() => {
    setSearchQuery(debouncedValue)
  }, [debouncedValue, setSearchQuery])

  return (
    <div className="relative" role="search">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск шаблонов..."
        className="pl-10"
        aria-label="Поиск шаблонов"
      />
    </div>
  )
}
