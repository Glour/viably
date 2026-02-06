"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/stores/sidebar"
import { cn } from "@/lib/utils"

export function Sidebar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { isOpen, toggle, close } = useSidebarStore()
  const pathname = usePathname()

  // Close on mobile route change
  useEffect(() => {
    if (window.innerWidth < 768) close()
  }, [pathname, close])

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Боковая панель"
        className={cn(
          "hidden md:block border-r bg-card transition-all duration-300 overflow-hidden",
          isOpen ? "w-[280px]" : "w-0",
          className
        )}
      >
        <div className="w-[280px] p-4">
          <Button variant="ghost" size="icon" onClick={toggle} className="mb-4">
            {isOpen ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
          {children}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={close}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") close()
            }}
            role="button"
            tabIndex={0}
            aria-label="Закрыть боковую панель"
          />
          <aside className="relative w-[280px] h-full bg-card border-r p-4">
            <Button variant="ghost" size="icon" onClick={close} className="mb-4">
              <ChevronLeft className="size-4" />
            </Button>
            {children}
          </aside>
        </div>
      )}
    </>
  )
}
