"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useTemplatesStore } from "@/features/templates/stores"

export function SearchBar() {
  const setSearchQuery = useTemplatesStore((s) => s.setSearchQuery)
  const [value, setValue] = useState("")
  const debouncedValue = useDebounce(value, 300)

  useEffect(() => {
    setSearchQuery(debouncedValue)
  }, [debouncedValue, setSearchQuery])

  return (
    <div className="relative group" role="search">
      <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск шаблонов..."
        className="pl-12 h-12 text-base bg-card/80 backdrop-blur-xl border-border/60 rounded-2xl transition-all duration-300 focus:border-primary/50 focus:shadow-[0_0_20px_var(--primary-glow)] focus:bg-card"
        aria-label="Поиск шаблонов"
      />
    </div>
  )
}
