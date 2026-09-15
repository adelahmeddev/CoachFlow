"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface GlassSheenProps {
  opacity?: number
  className?: string
}

/**
 * Specular light highlight for Liquid Glass surfaces.
 * Includes a top-edge hairline specular gradient and soft top-left reflection.
 */
export function GlassSheen({ opacity = 1, className }: GlassSheenProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden", className)}
      style={{ opacity }}
    >
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/20" />
      <span className="absolute -top-12 -left-12 size-28 rounded-full bg-white/[0.07] dark:bg-white/[0.04] blur-2xl" />
    </span>
  )
}
