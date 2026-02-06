import { cn } from "@/lib/utils"

export function Shimmer({
  className,
  width = "100%",
  height = "1rem",
}: {
  className?: string
  width?: string
  height?: string
}) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-muted",
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}
