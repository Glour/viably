"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiteYouTubeProps {
  videoId: string
  title?: string
  className?: string
}

/**
 * Lightweight YouTube embed component with lazy loading
 *
 * Loads only a thumbnail initially, then loads the full YouTube player
 * when the user clicks play. This significantly improves page load performance.
 *
 * @example
 * <LiteYouTube videoId="dQw4w9WgXcQ" title="Demo Video" />
 */
export function LiteYouTube({
  videoId,
  title = "Video",
  className
}: LiteYouTubeProps) {
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)

  const handlePlay = () => {
    setIsIframeLoaded(true)
  }

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-black shadow-2xl",
        className
      )}
    >
      {!isIframeLoaded ? (
        <>
          {/* YouTube thumbnail as background */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Play button */}
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center transition-transform hover:scale-105"
            aria-label={`Play ${title}`}
          >
            <div className="flex size-20 items-center justify-center rounded-full bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-all hover:bg-red-700 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)]">
              <Play className="ml-1 size-8 fill-white text-white" />
            </div>
          </button>
        </>
      ) : (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      )}
    </div>
  )
}
