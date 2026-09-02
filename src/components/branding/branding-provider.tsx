"use client"

import { createContext, useContext, useEffect } from "react"

export type Branding = {
  brandName: string
  logoUrl: string | null
  primaryColor: string
  coachId: string | null
}

const BrandingContext = createContext<Branding>({
  brandName: "CoachFlow",
  logoUrl: null,
  primaryColor: "#E85D04",
  coachId: null,
})

function darken(hex: string, amount = 0.12): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)))
  const toHex = (v: number) => v.toString(16).padStart(2, "0")
  return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`
}
function lighten(hex: string, amount = 0.18): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const l = (v: number) => Math.min(255, Math.round(v + (255 - v) * amount))
  const toHex = (v: number) => v.toString(16).padStart(2, "0")
  return `#${toHex(l(r))}${toHex(l(g))}${toHex(l(b))}`
}
function fgForBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.55 ? "#1C1917" : "#FFFFFF"
}

export function BrandingProvider({ branding, children }: { branding: Branding; children: React.ReactNode }) {
  const primary = branding.primaryColor
  const primaryDark = darken(primary, 0.14)
  const primaryLight = lighten(primary, 0.22)
  const fg = fgForBg(primary)
  // Tenant-local CSS vars — overrides design tokens for this coach only
  // Also mirror to :root via effect so :root-defined tokens (brand scale) are overridden even if Tailwind resolves at :root level
  useEffect(() => {
    const root = document.documentElement
    const vars: Record<string, string> = {
      "--brand-primary": primary,
      "--primary": primary,
      "--primary-foreground": fg,
      "--ring": primary,
      "--sidebar-primary": primary,
      "--sidebar-primary-foreground": fg,
      "--sidebar-ring": primary,
      "--chart-1": primary,
      "--color-brand-500": primary,
      "--color-brand-600": primaryDark,
      "--color-brand-400": primaryLight,
      "--color-brand-700": primaryDark,
      "--brand-500": primary,
      "--brand-600": primaryDark,
    }
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k)
    }
  }, [primary, primaryDark, primaryLight, fg])

  const style = {
    ["--brand-primary" as string]: primary,
    ["--primary" as string]: primary,
    ["--primary-foreground" as string]: fg,
    ["--ring" as string]: primary,
    ["--sidebar-primary" as string]: primary,
    ["--sidebar-primary-foreground" as string]: fg,
    ["--sidebar-ring" as string]: primary,
    ["--chart-1" as string]: primary,
    // Tailwind v4 brand scale — used by from-brand-500 etc
    ["--color-brand-500" as string]: primary,
    ["--color-brand-600" as string]: primaryDark,
    ["--color-brand-400" as string]: primaryLight,
    ["--color-brand-700" as string]: primaryDark,
    // Also alias --brand-* for any direct usage
    ["--brand-500" as string]: primary,
    ["--brand-600" as string]: primaryDark,
  } as React.CSSProperties

  return (
    <BrandingContext.Provider value={branding}>
      <div style={style}>{children}</div>
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  return useContext(BrandingContext)
}
