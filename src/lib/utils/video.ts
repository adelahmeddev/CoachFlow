const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/(?:watch\?v=|embed|v|shorts)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})[^&]*/,
  /^[a-zA-Z0-9_-]{11}$/,
]

export function extractYoutubeId(url: string): string | null {
  if (!url) return null
  const cleanedUrl = url.trim().replace(/\/+/g, "/")
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = cleanedUrl.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getEmbedUrl(
  videoId: string,
  options?: { autoPlay?: boolean }
): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  })
  if (options?.autoPlay) {
    params.set("autoplay", "1")
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
