"use client"

import { useState, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"
import { useBranding } from "@/components/branding/branding-provider"

type Variant = "full" | "mark"

interface BrandLogoProps {
  alt?: string
  height?: number
  width?: number
  className?: string
  variant?: Variant
  priority?: boolean
  quality?: number
  /** Render the gradient "Coach Flow" wordmark next to the image */
  showWordmark?: boolean
}

const SIZES = {
  full: { height: 76, width: 76 },
  mark: { height: 48, width: 48 },
}

/**
 * Gradient wordmark — used alongside the mark when showWordmark is set.
 * If coach has custom branding, show brandName, else Coach Flow default.
 */
function Wordmark({ fontSize, className }: { fontSize: number; className?: string }) {
  let brandName = "Coach Flow"
  try {
    const b = useBranding()
    if (b.brandName && b.brandName !== "CoachFlow") brandName = b.brandName
  } catch {}
  return (
    <span
      dir="ltr"
      className={cn(
        "select-none bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text font-extrabold tracking-tight text-transparent dark:from-brand-400 dark:via-brand-300 dark:to-brand-200",
        className
      )}
      style={{ fontSize }}
    >
      {brandName}
    </span>
  )
}

export function BrandLogo({
  alt = "Coach Flow",
  height,
  width,
  className = "",
  variant = "full",
  priority = false,
  quality = 95,
  showWordmark = false,
}: BrandLogoProps) {
  // Hydration-safe mount flag: placeholder on server/first paint (exact
  // dimensions → zero layout shift), real logo after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  let brandingLogo: string | null = null
  let brandingName: string | null = null
  try {
    const b = useBranding()
    brandingLogo = b.logoUrl
    brandingName = b.brandName
  } catch {}

  // A failed load is tied to the URL that failed — a newly saved logo URL
  // recovers automatically without any effect.
  const src = brandingLogo ?? "/brand/logo.png"
  const error = failedSrc !== null && failedSrc === src

  const defaults = SIZES[variant]
  const h = height ?? defaults.height
  const w = width ?? defaults.width

  // Before mount: themed placeholder with exact dimensions → zero layout shift
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-flex shrink-0 items-center", className)}
        style={{ gap: 10 }}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-brand-500/10 dark:bg-brand-500/15",
            !priority && "animate-pulse"
          )}
          style={{ width: w, height: h }}
        />
        {showWordmark && <Wordmark fontSize={Math.round(Math.max(15, Math.min(17, h * 0.35)))} />}
      </span>
    )
  }

  // Graceful fallback if the image can't load
  if (error) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center", className)}
        style={{ width: w, height: h }}
      >
        <Wordmark fontSize={Math.max(12, h * 0.32)} />
      </span>
    )
  }

  // If coach has custom logo, use it
  if (brandingLogo) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center", className)}
        style={{ gap: 10 }}
        aria-hidden={alt ? undefined : true}
      >
        <span
          className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-soft ring-1 ring-black/10 dark:ring-white/15"
          style={{ width: w, height: h }}
        >
          <img
            key={brandingLogo}
            src={brandingLogo}
            alt={brandingName || alt}
            width={w}
            height={h}
            className="h-full w-full object-cover"
            onError={() => setFailedSrc(brandingLogo)}
          />
        </span>
        {showWordmark && <Wordmark fontSize={Math.round(Math.max(15, Math.min(17, h * 0.35)))} />}
      </span>
    )
  }

  // Default official Coach Flow logo
  return (
    <span
      className={cn("inline-flex shrink-0 items-center", className)}
      style={{ gap: 10 }}
      aria-hidden={alt ? undefined : true}
    >
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-soft ring-1 ring-black/10 dark:ring-white/15"
        style={{ width: w, height: h }}
      >
          <img
            src="/brand/logo.png"
            alt={alt}
            width={w}
            height={h}
            className="h-full w-full object-contain"
            onError={() => setFailedSrc(src)}
          />
      </span>
      {showWordmark && <Wordmark fontSize={Math.round(Math.max(15, Math.min(17, h * 0.35)))} />}
    </span>
  )
}
