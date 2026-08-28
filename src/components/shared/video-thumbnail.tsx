"use client"

import { useMemo } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { extractYoutubeId, getThumbnailUrl } from "@/lib/utils/video"

interface VideoThumbnailProps {
  url: string
  onClick: () => void
  className?: string
}

export function VideoThumbnail({ url, onClick, className }: VideoThumbnailProps) {
  const videoId = useMemo(() => extractYoutubeId(url), [url])

  if (!videoId) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl ${className ?? ""}`}
    >
      <Image
        src={getThumbnailUrl(videoId)}
        alt=""
        width={480}
        height={270}
        sizes="(max-width: 768px) 100vw, 480px"
        className="aspect-video h-auto w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
        <div className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black transition-transform group-hover:scale-110">
          <Play className="size-5 ms-0.5" />
        </div>
      </div>
    </button>
  )
}
