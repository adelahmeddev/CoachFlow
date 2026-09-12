"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Branding = {
  brandName: string
  logoUrl: string | null
  primaryColor: string
  whatsappUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  coachId: string | null
}

const BrandingContext = createContext<Branding>({
  brandName: "Coach Flow",
  logoUrl: null,
  primaryColor: "#961112",
  whatsappUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  coachId: null,
})

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => clampByte(v).toString(16).padStart(2, "0")
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Mix a hex color toward white (amount>0) — same math as the old lighten. */
function lighten(hex: string, amount = 0.18): string {
  const [r, g, b] = parseHex(hex)
  const l = (v: number) => v + (255 - v) * amount
  return toHex(l(r), l(g), l(b))
}

/** Mix a hex color toward black (amount>0) — same math as the old darken. */
function darken(hex: string, amount = 0.12): string {
  const [r, g, b] = parseHex(hex)
  const d = (v: number) => v * (1 - amount)
  return toHex(d(r), d(g), d(b))
}

function fgForBg(hex: string): string {
  const [r, g, b] = parseHex(hex)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.55 ? "#1C1917" : "#FFFFFF"
}

export type BrandScale = {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
}

/** Derive a full 50-900 scale from one primary so every Tailwind
 *  `brand-*` step (bg-brand-100, border-brand-200, text-brand-700…)
 *  follows the coach color instead of staying default orange. */
export function buildBrandScale(primary: string): BrandScale {
  const safe = /^#([0-9A-Fa-f]{6})$/.test(primary) ? primary : "#961112"
  return {
    50: lighten(safe, 0.94),
    100: lighten(safe, 0.87),
    200: lighten(safe, 0.72),
    300: lighten(safe, 0.5),
    400: lighten(safe, 0.22),
    500: safe,
    600: darken(safe, 0.14),
    700: darken(safe, 0.3),
    800: darken(safe, 0.45),
    900: darken(safe, 0.58),
  }
}

/** All CSS vars the provider owns. One builder feeds both the wrapper-div
 *  inline style (tenant subtree) and the :root mirror effect (covers
 *  body::before and other root-level tokens via inheritance). */
export function buildBrandingVars(primary: string): Record<string, string> {
  const scale = buildBrandScale(primary)
  const fg = fgForBg(scale[500])
  const vars: Record<string, string> = {
    "--brand-primary": scale[500],
    "--primary": scale[500],
    "--primary-foreground": fg,
    "--ring": scale[500],
    "--sidebar-primary": scale[500],
    "--sidebar-primary-foreground": fg,
    "--sidebar-ring": scale[500],
    "--chart-1": scale[500],
    // Chat bubbles (own messages) follow the coach color
    "--msg-orange": scale[500],
    "--msg-bubble-own-bg": scale[500],
    "--msg-bubble-own-border": scale[600],
    "--msg-bubble-own-text": fg,
    "--msg-bubble-own-time":
      fg === "#FFFFFF" ? "rgba(255,255,255,0.9)" : "rgba(28,25,23,0.85)",
  }
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const) {
    vars[`--color-brand-${step}`] = scale[step]
    vars[`--brand-${step}`] = scale[step]
  }
  return vars
}

export function BrandingProvider({ branding, children }: { branding: Branding; children: React.ReactNode }) {
  // Live branding: seeded from the server layout, then updated in-place when
  // the coach saves new branding in Settings (same-tab, no refresh needed).
  // Server layouts revalidate in parallel so reload/login/logout stay correct.
  const [live, setLive] = useState(branding)
  const [synced, setSynced] = useState(branding)
  // Adjust during render (not in an effect): when the server delivers a new
  // branding object after navigation/refresh, adopt it — unless it matches
  // the live update we already applied optimistically.
  if (branding !== synced) {
    setSynced(branding)
    setLive(branding)
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Branding>).detail
      if (!detail) return
      // Tenant isolation: only apply updates for our own coach scope.
      // A null coachId update (reset to defaults) applies only when we also
      // have no coach scope (e.g. admin shell).
      if (detail.coachId !== live.coachId) return
      setLive(detail)
    }
    window.addEventListener(BRANDING_UPDATED_EVENT, handler)
    return () => window.removeEventListener(BRANDING_UPDATED_EVENT, handler)
  }, [live.coachId])

  const vars = useMemo(() => buildBrandingVars(live.primaryColor), [live.primaryColor])

  // Mirror to :root so root-level tokens (body glow, :root-defined scales)
  // are overridden even though Tailwind may resolve them outside our subtree
  useEffect(() => {
    const root = document.documentElement
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    return () => {
      for (const k of Object.keys(vars)) root.style.removeProperty(k)
    }
  }, [vars])

  return (
    <BrandingContext.Provider value={live}>
      <div style={vars as React.CSSProperties}>{children}</div>
    </BrandingContext.Provider>
  )
}

/** Same-tab live sync: dispatched after a branding save so every mounted
 *  BrandingProvider (sidebar, topnav, dashboards) updates immediately. */
export const BRANDING_UPDATED_EVENT = "branding:updated"

export function notifyBrandingUpdated(branding: Branding) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BRANDING_UPDATED_EVENT, { detail: branding }))
  }
}

export function useBranding() {
  return useContext(BrandingContext)
}
