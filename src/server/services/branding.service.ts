import { pool } from "@/lib/db"
import type { CoachBranding } from "@/lib/db/types"

export const DEFAULT_BRANDING = {
  brandName: "Coach Flow",
  logoUrl: null as string | null,
  primaryColor: "#E85D04",
} as const

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{6})$/
const FORBIDDEN_RE = /(url\(|javascript:|<\s*style|expression\()/i

export function isValidPrimaryColor(v: string | null | undefined): boolean {
  if (!v) return true // null allowed → default
  if (FORBIDDEN_RE.test(v)) return false
  return HEX_COLOR_RE.test(v.trim())
}

export function sanitizeBranding(input: { brandName?: string | null; logoUrl?: string | null; primaryColor?: string | null }) {
  const out: { brandName: string | null; logoUrl: string | null; primaryColor: string | null } = {
    brandName: null,
    logoUrl: null,
    primaryColor: null,
  }
  if (typeof input.brandName === "string") {
    const t = input.brandName.trim().slice(0, 80)
    out.brandName = t.length ? t : null
  }
  if (typeof input.logoUrl === "string") {
    const t = input.logoUrl.trim().slice(0, 2048)
    // only allow http/https or data:image (validated on upload) or relative
    if (t && !FORBIDDEN_RE.test(t)) out.logoUrl = t
  }
  if (typeof input.primaryColor === "string") {
    const t = input.primaryColor.trim()
    if (isValidPrimaryColor(t)) out.primaryColor = t.toUpperCase()
    else throw new Error("INVALID_COLOR")
  }
  return out
}

// Centralized resolution — tenant-isolated, no global cache
// Resilient: returns default branding if DB unreachable (never breaks layout)
export async function getCoachBranding(coachId: string): Promise<CoachBranding & { effective: typeof DEFAULT_BRANDING }> {
  try {
    const res = await pool.query<CoachBranding>(`SELECT * FROM "CoachBranding" WHERE "coachId" = $1 LIMIT 1`, [coachId])
    const row = res.rows[0] as CoachBranding | undefined
    const effective = {
      brandName: row?.brandName?.trim() ? row.brandName.trim() : DEFAULT_BRANDING.brandName,
      logoUrl: row?.logoUrl?.trim() ? row.logoUrl : DEFAULT_BRANDING.logoUrl,
      primaryColor: row?.primaryColor && isValidPrimaryColor(row.primaryColor) ? row.primaryColor : DEFAULT_BRANDING.primaryColor,
    }
    const base: CoachBranding = row ?? {
      id: "",
      coachId,
      brandName: null,
      logoUrl: null,
      primaryColor: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }
    return { ...base, effective } as CoachBranding & { effective: typeof DEFAULT_BRANDING }
  } catch {
    const fallback: CoachBranding = {
      id: "",
      coachId,
      brandName: null,
      logoUrl: null,
      primaryColor: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }
    return { ...fallback, effective: { ...DEFAULT_BRANDING } } as CoachBranding & { effective: typeof DEFAULT_BRANDING }
  }
}

// For client -> resolve via trainerId
export async function getBrandingForClient(clientId: string) {
  try {
    const cRes = await pool.query<{ trainerId: string }>(`SELECT "trainerId" FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])
    const trainerId = cRes.rows[0]?.trainerId
    if (!trainerId) return { ...DEFAULT_BRANDING, coachId: null as string | null }
    const b = await getCoachBranding(trainerId)
    return { ...b.effective, coachId: trainerId }
  } catch {
    return { ...DEFAULT_BRANDING, coachId: null as string | null }
  }
}

// Contrast helper for admin warning
export function getContrastWarning(hex: string | null): string | null {
  if (!hex || !HEX_COLOR_RE.test(hex)) return null
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // relative luminance
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  // white text on this bg — warn if too light (lum > 0.8)
  if (lum > 0.85) return "Very light primary color may have poor contrast on white buttons."
  if (lum < 0.08) return "Very dark primary color may have poor contrast."
  return null
}

export function foregroundForPrimary(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.55 ? "#1C1917" : "#FFFFFF"
}
