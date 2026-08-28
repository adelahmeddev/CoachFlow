"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface YouTubePlayerProps {
  url?: string | null
  className?: string
  aspectRatio?: "16/9" | "4/3"
  allowFullscreen?: boolean
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function YouTubePlayer({
  url,
  className,
  aspectRatio = "16/9",
  allowFullscreen = true,
}: YouTubePlayerProps) {
  const videoId = useMemo(() => (url ? extractVideoId(url) : null), [url])

  if (!videoId) return null

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`

  return (
    <div className={cn("relative", className)} style={{ aspectRatio }}>
      <iframe
        src={embedUrl}
        title="Exercise demonstration"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen={allowFullscreen}
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 w-full h-full rounded-lg border-0"
        loading="lazy"
      />
    </div>
  )
}
