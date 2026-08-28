"use client"

import { useMemo } from "react"
import { extractYoutubeId, getEmbedUrl } from "@/lib/utils/video"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  url: string
  title?: string
  className?: string
  autoPlay?: boolean
}

export function VideoPlayer({
  url,
  title,
  className,
  autoPlay,
}: VideoPlayerProps) {
  const videoId = useMemo(() => extractYoutubeId(url), [url])

  if (!videoId) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
        Invalid video link
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <iframe
        src={getEmbedUrl(videoId, { autoPlay })}
        title={title ?? "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full border-0"
      />
    </div>
  )
}
