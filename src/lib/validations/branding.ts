import { z } from "zod"

/**
 * Coach social-link normalization (client-safe: no server imports).
 * All helpers accept unknown input, return a canonical https URL or null
 * for empty input, and throw Error("INVALID_SOCIAL") for invalid values.
 * `sanitizeBranding` (server) reuses these so client and server agree.
 */

function ensureHttpUrl(v: string): string {
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`
  let u: URL
  try {
    u = new URL(withScheme)
  } catch {
    throw new Error("INVALID_SOCIAL")
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("INVALID_SOCIAL")
  return withScheme
}

const DOMAIN_LIKE_RE = /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i

export function normalizeWhatsappUrl(input: unknown): string | null {
  if (input == null) return null
  if (typeof input !== "string") throw new Error("INVALID_SOCIAL")
  const t = input.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t) || /wa\.me|whatsapp\.com/i.test(t) || DOMAIN_LIKE_RE.test(t)) {
    return ensureHttpUrl(t)
  }
  // Raw phone number → wa.me link. Egyptian mobiles (01xxxxxxxxx) get +20.
  const hasPlus = t.startsWith("+")
  const digits = t.replace(/\D/g, "")
  if (digits.length < 7) throw new Error("INVALID_SOCIAL")
  let intl = digits
  if (!hasPlus) {
    if (/^0\d{10}$/.test(digits)) intl = `20${digits.slice(1)}`
    else if (/^00\d+$/.test(digits)) intl = digits.slice(2)
  }
  return `https://wa.me/${intl}`
}

export function normalizeInstagramUrl(input: unknown): string | null {
  if (input == null) return null
  if (typeof input !== "string") throw new Error("INVALID_SOCIAL")
  let t = input.trim()
  if (!t) return null
  if (t.startsWith("@")) t = t.slice(1)
  // Full URLs (or scheme-less URLs with a path) stay URLs; anything else in
  // this field is a handle — checked before the domain pattern because
  // handles may contain dots (e.g. coach.ahmed).
  if (/^https?:\/\//i.test(t) || t.includes("/")) return ensureHttpUrl(t)
  if (/^[A-Za-z0-9._]{1,30}$/.test(t)) return `https://instagram.com/${t}`
  throw new Error("INVALID_SOCIAL")
}

export function normalizeFacebookUrl(input: unknown): string | null {
  if (input == null) return null
  if (typeof input !== "string") throw new Error("INVALID_SOCIAL")
  const t = input.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t) || DOMAIN_LIKE_RE.test(t)) return ensureHttpUrl(t)
  throw new Error("INVALID_SOCIAL")
}

/** Shape validation for coach branding identity fields (detail checks live in sanitizeBranding). */
export const coachSocialsSchema = z.object({
  whatsappUrl: z.string().trim().max(2048).nullish(),
  facebookUrl: z.string().trim().max(2048).nullish(),
  instagramUrl: z.string().trim().max(2048).nullish(),
})

export type CoachSocialsInput = z.infer<typeof coachSocialsSchema>
