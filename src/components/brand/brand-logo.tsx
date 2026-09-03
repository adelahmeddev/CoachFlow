"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
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

const RATIOS = {
  full: 520 / 304, // 1.71
  mark: 256 / 166, // 1.54
}

const SIZES = {
  full: { height: 80, width: 137 },
  mark: { height: 32, width: 49 },
}

const FILES = {
  full: { dark: "/brand/logo-on-dark.png", light: "/brand/logo-on-light.png" },
  mark: { dark: "/brand/logo-mark-dark.png", light: "/brand/logo-mark-light.png" },
}

/**
 * Gradient wordmark — used as graceful fallback when the image fails to load,
 * and alongside the mark when showWordmark is set.
 * If coach has custom branding, show brandName, else CoachFlow/Coach Flow default.
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
        "select-none bg-gradient-to-r from-brand-600 to-energy-500 bg-clip-text font-extrabold tracking-tight text-transparent dark:from-brand-400 dark:to-energy-400",
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
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState(false)
  let brandingLogo: string | null = null
  let brandingName: string | null = null
  try {
    const b = useBranding()
    brandingLogo = b.logoUrl
    brandingName = b.brandName
  } catch {}

  useEffect(() => {
    setMounted(true)
  }, [])

  const defaults = SIZES[variant]
  const ratio = RATIOS[variant]
  let h = height ?? defaults.height
  let w = width ?? defaults.width

  // preserve aspect ratio if only one dimension given
  if (height !== undefined && width === undefined) {
    w = Math.round(h * ratio)
  } else if (width !== undefined && height === undefined) {
    h = Math.round(w / ratio)
  }

  const sizesAttr =
    variant === "mark"
      ? "(max-width: 768px) 48px, 72px"
      : "(max-width: 640px) 150px, 190px"

  // Before mount: themed placeholder with exact dimensions → zero layout shift,
  // zero wrong-theme flash. Only ONE image is ever downloaded (theme-aware).
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-flex shrink-0 items-center", className)}
        style={{ gap: 10 }}
      >
        <span
          className={cn(
            "inline-block rounded-lg bg-brand-500/10 dark:bg-brand-500/15",
            !priority && "animate-pulse"
          )}
          style={{ width: w, height: h }}
        />
        {showWordmark && <Wordmark fontSize={Math.max(14, h * 0.42)} />}
      </span>
    )
  }

  // Graceful fallback if the image can't load (missing file, offline, blocked).
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

  // If coach has custom logo, use it (never break on missing)
  if (brandingLogo) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center", className)}
        style={{ gap: 10 }}
        aria-hidden={alt ? undefined : true}
      >
        <img
          src={brandingLogo}
          alt={brandingName || alt}
          height={h}
          width={w}
          className="h-auto w-auto max-w-full object-contain"
          style={{ height: h, width: w }}
          onError={() => setError(true)}
        />
        {showWordmark && <Wordmark fontSize={Math.max(14, h * 0.42)} />}
      </span>
    )
  }

  const src = resolvedTheme === "dark" ? FILES[variant].dark : FILES[variant].light

  return (
    <span
      className={cn("inline-flex shrink-0 items-center", className)}
      style={{ gap: 10 }}
      aria-hidden={alt ? undefined : true}
    >
      <Image
        src={src}
        alt={alt}
        height={h}
        width={w}
        className="h-auto w-auto max-w-full object-contain transition-opacity duration-300"
        priority={priority}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        quality={quality}
        sizes={sizesAttr}
        style={{ height: h, width: w }}
        onError={() => setError(true)}
      />
      {showWordmark && <Wordmark fontSize={Math.max(14, h * 0.42)} />}
    </span>
  )
}
