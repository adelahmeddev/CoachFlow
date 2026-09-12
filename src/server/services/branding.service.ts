import { pool } from "@/lib/db"
import type { CoachBranding } from "@/lib/db/types"
import { normalizeFacebookUrl, normalizeInstagramUrl, normalizeWhatsappUrl } from "@/lib/validations/branding"

export const DEFAULT_BRANDING = {
  brandName: "Coach Flow",
  logoUrl: null as string | null,
  primaryColor: "#961112",
  whatsappUrl: null as string | null,
  facebookUrl: null as string | null,
  instagramUrl: null as string | null,
} as const

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{6})$/
const FORBIDDEN_RE = /(url\(|javascript:|<\s*style|expression\()/i

// Logos are stored as data URLs (see adminUploadLogoAction) — those are
// 100KB-3MB, so they need a much larger cap than http(s)/relative URLs.
const URL_MAX_LEN = 2048
const DATA_URL_MAX_LEN = 3_500_000 // ~2.6MB binary
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/

export function isValidPrimaryColor(v: string | null | undefined): boolean {
  if (!v) return true // null allowed → default
  if (FORBIDDEN_RE.test(v)) return false
  return HEX_COLOR_RE.test(v.trim())
}

export function sanitizeBranding(input: { brandName?: string | null; logoUrl?: string | null; primaryColor?: string | null; whatsappUrl?: string | null; facebookUrl?: string | null; instagramUrl?: string | null }) {
  const out: { brandName: string | null; logoUrl: string | null; primaryColor: string | null; whatsappUrl: string | null; facebookUrl: string | null; instagramUrl: string | null } = {
    brandName: null,
    logoUrl: null,
    primaryColor: null,
    whatsappUrl: null,
    facebookUrl: null,
    instagramUrl: null,
  }
  if (typeof input.brandName === "string") {
    const t = input.brandName.trim().slice(0, 80)
    out.brandName = t.length ? t : null
  }
  if (typeof input.logoUrl === "string") {
    const t = input.logoUrl.trim()
    if (!t || FORBIDDEN_RE.test(t)) {
      // empty or dangerous → leave as null (clears logo)
    } else if (t.startsWith("data:")) {
      // data URLs must be images and fit the storage cap — never truncate,
      // a truncated data URL is a corrupt image (was the refresh logo bug)
      if (t.length <= DATA_URL_MAX_LEN && DATA_IMAGE_RE.test(t)) out.logoUrl = t
      else throw new Error("INVALID_LOGO")
    } else {
      // http(s)/relative URLs stay short
      if (t.length > URL_MAX_LEN) throw new Error("INVALID_LOGO")
      out.logoUrl = t
    }
  }
  if (typeof input.primaryColor === "string") {
    const t = input.primaryColor.trim()
    if (isValidPrimaryColor(t)) out.primaryColor = t.toUpperCase()
    else throw new Error("INVALID_COLOR")
  }
  if (input.whatsappUrl !== undefined) out.whatsappUrl = normalizeWhatsappUrl(input.whatsappUrl)
  if (input.facebookUrl !== undefined) out.facebookUrl = normalizeFacebookUrl(input.facebookUrl)
  if (input.instagramUrl !== undefined) out.instagramUrl = normalizeInstagramUrl(input.instagramUrl)
  return out
}

// Centralized resolution — tenant-isolated, no global cache
// Resilient: returns default branding if DB unreachable (never breaks layout)
export async function getCoachBranding(coachId: string): Promise<CoachBranding & { effective: typeof DEFAULT_BRANDING & { whatsappUrl: string | null; facebookUrl: string | null; instagramUrl: string | null } }> {
  try {
    const res = await pool.query<CoachBranding>(`SELECT * FROM "CoachBranding" WHERE "coachId" = $1 LIMIT 1`, [coachId])
    const row = res.rows[0] as CoachBranding | undefined
    const effective = {
      brandName: row?.brandName?.trim() ? row.brandName.trim() : DEFAULT_BRANDING.brandName,
      logoUrl: row?.logoUrl?.trim() ? row.logoUrl : DEFAULT_BRANDING.logoUrl,
      primaryColor: row?.primaryColor && isValidPrimaryColor(row.primaryColor) ? row.primaryColor : DEFAULT_BRANDING.primaryColor,
      whatsappUrl: row?.whatsappUrl?.trim() ? row.whatsappUrl.trim() : null,
      facebookUrl: row?.facebookUrl?.trim() ? row.facebookUrl.trim() : null,
      instagramUrl: row?.instagramUrl?.trim() ? row.instagramUrl.trim() : null,
    }
    const base: CoachBranding = row ?? {
      id: "",
      coachId,
      brandName: null,
      logoUrl: null,
      primaryColor: null,
      whatsappUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }
    return { ...base, effective } as CoachBranding & { effective: typeof DEFAULT_BRANDING & { whatsappUrl: string | null; facebookUrl: string | null; instagramUrl: string | null } }
  } catch {
    const fallback: CoachBranding = {
      id: "",
      coachId,
      brandName: null,
      logoUrl: null,
      primaryColor: null,
      whatsappUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }
    return { ...fallback, effective: { ...DEFAULT_BRANDING, whatsappUrl: null, facebookUrl: null, instagramUrl: null } } as CoachBranding & { effective: typeof DEFAULT_BRANDING & { whatsappUrl: string | null; facebookUrl: string | null; instagramUrl: string | null } }
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

// Central payload builder — single source of truth for the client Branding
// shape. Layouts pass the coachId they already resolved (trainerProfileId for
// coaches, client.trainerId for clients, token/slug owner for public pages)
// so branding can never leak across coaches.
export type BrandingPayload = {
  brandName: string
  logoUrl: string | null
  primaryColor: string
  whatsappUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  coachId: string | null
}

export function toBranding(
  raw: {
    effective: { brandName: string; logoUrl: string | null; primaryColor: string; whatsappUrl?: string | null; facebookUrl?: string | null; instagramUrl?: string | null }
  } | null | undefined,
  coachId: string | null | undefined
): BrandingPayload {
  if (!raw || !coachId) {
    return { ...DEFAULT_BRANDING, whatsappUrl: null, facebookUrl: null, instagramUrl: null, coachId: coachId ?? null }
  }
  return {
    brandName: raw.effective.brandName,
    logoUrl: raw.effective.logoUrl,
    primaryColor: raw.effective.primaryColor,
    whatsappUrl: raw.effective.whatsappUrl ?? null,
    facebookUrl: raw.effective.facebookUrl ?? null,
    instagramUrl: raw.effective.instagramUrl ?? null,
    coachId,
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
