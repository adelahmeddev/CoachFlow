"use client"

import Image from "next/image"

type Variant = "full" | "mark"

interface BrandLogoProps {
  alt?: string
  height?: number
  width?: number
  className?: string
  variant?: Variant
  priority?: boolean
  quality?: number
}

const RATIOS = {
  full: 520 / 304, // 1.71 from actual 520x304
  mark: 256 / 166, // 1.54
}

const SIZES = {
  full: { height: 80, width: 137 }, // 80*1.71=137 preserves ratio
  mark: { height: 32, width: 49 }, // 32*1.54=49
}

const FILES = {
  full: { dark: "/brand/logo-on-dark.png", light: "/brand/logo-on-light.png" },
  mark: { dark: "/brand/logo-mark-dark.png", light: "/brand/logo-mark-light.png" },
}

export function BrandLogo({
  alt = "NANOUSH",
  height,
  width,
  className = "",
  variant = "full",
  priority = false,
  quality = 95,
}: BrandLogoProps) {
  const defaults = SIZES[variant]
  const ratio = RATIOS[variant]
  let h = height ?? defaults.height
  let w = width ?? defaults.width

  // preserve aspect ratio if only one dimension given
  if (height !== undefined && width === undefined) {
    w = Math.round(h * ratio)
  } else if (width !== undefined && height === undefined) {
    h = Math.round(w / ratio)
  } else if (height === undefined && width === undefined) {
    // use defaults already
  }
  // if both given but ratio mismatched, respect caller's explicit size but ensure contain
  const { dark, light } = FILES[variant]

  // Use next/image for optimization; keep two images for light/dark but only one visible
  // Browser will still download both (hidden via display:none), but next/image + sharp serves WebP ~15-25k vs 170k
  // For true single-download, picture+media would be needed — kept simple for next-themes class toggle.
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-hidden={alt ? undefined : true}>
      {/* dark */}
      <Image
        src={dark}
        alt={alt}
        height={h}
        width={w}
        className="hidden dark:block h-auto w-auto max-w-full object-contain"
        priority={priority}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        quality={quality}
        sizes={variant === "mark" ? "(max-width: 768px) 44px, 64px" : "(max-width: 640px) 140px, 180px"}
        style={{ height: h, width: w, imageRendering: "auto" as const }}
      />
      {/* light */}
      <Image
        src={light}
        alt={alt}
        height={h}
        width={w}
        className="block dark:hidden h-auto w-auto max-w-full object-contain"
        priority={priority}
        loading={priority ? "eager" : undefined}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        quality={quality}
        sizes={variant === "mark" ? "(max-width: 768px) 44px, 64px" : "(max-width: 640px) 140px, 180px"}
        style={{ height: h, width: w, imageRendering: "auto" as const }}
      />
    </span>
  )
}
