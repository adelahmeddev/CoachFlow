"use server"

import { revalidatePath } from "next/cache"
import { pool, generateId } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"
import { sanitizeBranding, isValidPrimaryColor, getCoachBranding, toBranding } from "@/server/services/branding.service"
import { sniffLogo, convertLogoToWebp, LOGO_MAX_INPUT_BYTES } from "@/lib/logo-image"

function assertSuperAdmin(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("UNAUTHORIZED")
}

async function assertCoachExists(coachId: string) {
  const r = await pool.query(`SELECT "id" FROM "TrainerProfile" WHERE "id"=$1 LIMIT 1`, [coachId])
  if (!r.rows[0]) throw new Error("COACH_NOT_FOUND")
}

type BrandingFields = { brandName?: string | null; logoUrl?: string | null; primaryColor?: string | null; whatsappUrl?: string | null; facebookUrl?: string | null; instagramUrl?: string | null }

const BRANDING_COLS = ["brandName", "logoUrl", "primaryColor", "whatsappUrl", "facebookUrl", "instagramUrl"] as const

/** Partial upsert — only the provided keys are written, so a logo-only or
 *  color-only save never wipes the other fields (legacy data-URL logos
 *  survive color edits untouched). */
async function upsertBrandingFields(coachId: string, fields: BrandingFields) {
  const keys = BRANDING_COLS.filter((k) => fields[k] !== undefined)
  if (keys.length === 0) return
  const existing = await pool.query(`SELECT "id" FROM "CoachBranding" WHERE "coachId"=$1 LIMIT 1`, [coachId])
  if (existing.rows[0]) {
    const sets = keys.map((k, i) => `"${k}"=$${i + 1}`).join(", ")
    await pool.query(
      `UPDATE "CoachBranding" SET ${sets}, "updatedAt"=NOW() WHERE "coachId"=$${keys.length + 1}`,
      [...keys.map((k) => fields[k] ?? null), coachId]
    )
  } else {
    // Partial insert — only the provided columns are written. The table is
    // the source of truth for which columns exist (e.g. logo-only first
    // save), so never reference columns the caller didn't set.
    const cols = keys.map((k) => `"${k}"`).join(",")
    const vals = keys.map((_, i) => `$${i + 3}`).join(",")
    await pool.query(
      `INSERT INTO "CoachBranding" ("id","coachId",${cols},"createdAt","updatedAt") VALUES ($1,$2,${vals},NOW(),NOW())`,
      [generateId(), coachId, ...keys.map((k) => fields[k] ?? null)]
    )
  }
}

export async function adminUpsertBrandingAction(coachId: string, input: BrandingFields) {
  const session = await getCurrentSession()
  try { assertSuperAdmin(session) } catch { return { ok: false as const, error: "UNAUTHORIZED" } }
  try { await assertCoachExists(coachId) } catch { return { ok: false as const, error: "COACH_NOT_FOUND" } }

  if (input.primaryColor && !isValidPrimaryColor(input.primaryColor)) return { ok: false as const, error: "INVALID_COLOR" }

  let sanitized: ReturnType<typeof sanitizeBranding>
  try { sanitized = sanitizeBranding(input) } catch (e) { return { ok: false as const, error: (e as Error).message } }

  // Only persist keys the caller actually sent (see upsertBrandingFields).
  const toWrite: BrandingFields = {}
  if (input.brandName !== undefined) toWrite.brandName = sanitized.brandName
  if (input.logoUrl !== undefined) toWrite.logoUrl = sanitized.logoUrl
  if (input.primaryColor !== undefined) toWrite.primaryColor = sanitized.primaryColor
  if (input.whatsappUrl !== undefined) toWrite.whatsappUrl = sanitized.whatsappUrl
  if (input.facebookUrl !== undefined) toWrite.facebookUrl = sanitized.facebookUrl
  if (input.instagramUrl !== undefined) toWrite.instagramUrl = sanitized.instagramUrl
  await upsertBrandingFields(coachId, toWrite)

  revalidatePath(`/admin/trainers/${coachId}`)
  revalidatePath(`/admin/trainers`)
  revalidatePath(`/admin/subscriptions`)
  // Ensure coach & client see new branding immediately (per-request, but revalidate cached layouts)
  revalidatePath(`/dashboard`, "layout")
  revalidatePath(`/subscription`, "layout")
  revalidatePath(`/client`, "layout")
  return { ok: true as const }
}

export async function adminResetBrandingAction(coachId: string) {
  const session = await getCurrentSession()
  try { assertSuperAdmin(session) } catch { return { ok: false as const, error: "UNAUTHORIZED" } }
  await pool.query(`DELETE FROM "CoachBranding" WHERE "coachId"=$1`, [coachId])
  // Removal also drops the stored logo file (nothing references it anymore).
  await pool.query(`DELETE FROM "CoachLogoFile" WHERE "coachId"=$1`, [coachId])
  revalidatePath(`/admin/trainers/${coachId}`)
  revalidatePath(`/admin/trainers`)
  revalidatePath(`/dashboard`, "layout")
  revalidatePath(`/subscription`, "layout")
  revalidatePath(`/client`, "layout")
  return { ok: true as const }
}

export async function adminUploadLogoAction(coachId: string, formData: FormData) {
  const session = await getCurrentSession()
  try { assertSuperAdmin(session) } catch { return { ok: false as const, error: "UNAUTHORIZED" } }
  try { await assertCoachExists(coachId) } catch { return { ok: false as const, error: "COACH_NOT_FOUND" } }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string" || file.size === 0) return { ok: false as const, error: "NO_FILE" }
  // Reject extremely large uploads BEFORE reading/processing.
  if (file.size > LOGO_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length > LOGO_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }
  // Sniff content — never trust the client-provided MIME type.
  if (!sniffLogo(buf)) return { ok: false as const, error: "INVALID_TYPE" }

  // Compress to a small WebP (<=512px, metadata stripped, alpha preserved).
  let webp: Buffer
  try {
    webp = await convertLogoToWebp(buf)
  } catch {
    return { ok: false as const, error: "INVALID_IMAGE" }
  }

  // One row per coach — re-upload overwrites, so the previous file is gone.
  await pool.query(
    `INSERT INTO "CoachLogoFile" ("coachId","bytes","contentType","byteSize","updatedAt")
     VALUES ($1,$2,'image/webp',$3,NOW())
     ON CONFLICT ("coachId") DO UPDATE SET "bytes"=EXCLUDED."bytes", "contentType"=EXCLUDED."contentType", "byteSize"=EXCLUDED."byteSize", "updatedAt"=NOW()`,
    [coachId, webp, webp.length]
  )

  // Short versioned URL in the branding record (served immutable, cache-busted
  // on every upload). Never a data URL.
  const logoUrl = `/api/coach-logo/${coachId}?v=${Date.now()}`
  await upsertBrandingFields(coachId, { logoUrl })

  revalidatePath(`/admin/trainers/${coachId}`)
  revalidatePath(`/dashboard`, "layout")
  revalidatePath(`/subscription`, "layout")
  revalidatePath(`/client`, "layout")
  return { ok: true as const, logoUrl, byteSize: webp.length }
}

// --- Coach self-service (Settings) -------------------------------------------
// Same storage pipeline as the admin actions, but scoped to the coach's own
// trainerProfileId so branding can never leak across coaches.

function coachIdOf(session: Awaited<ReturnType<typeof getCurrentSession>>): string | null {
  if (!session?.user || session.user.role !== "COACH") return null
  return session.user.trainerProfileId ?? null
}

function revalidateCoachBranding() {
  revalidatePath(`/dashboard`, "layout")
  revalidatePath(`/settings`, "layout")
  revalidatePath(`/subscription`, "layout")
  revalidatePath(`/client`, "layout")
}

async function currentCoachBranding(coachId: string) {
  return toBranding(await getCoachBranding(coachId), coachId)
}

async function storeCoachLogoFile(coachId: string, buf: Buffer) {
  if (buf.length > LOGO_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }
  if (!sniffLogo(buf)) return { ok: false as const, error: "INVALID_TYPE" }
  let webp: Buffer
  try {
    webp = await convertLogoToWebp(buf)
  } catch {
    return { ok: false as const, error: "INVALID_IMAGE" }
  }
  await pool.query(
    `INSERT INTO "CoachLogoFile" ("coachId","bytes","contentType","byteSize","updatedAt")
     VALUES ($1,$2,'image/webp',$3,NOW())
     ON CONFLICT ("coachId") DO UPDATE SET "bytes"=EXCLUDED."bytes", "contentType"=EXCLUDED."contentType", "byteSize"=EXCLUDED."byteSize", "updatedAt"=NOW()`,
    [coachId, webp, webp.length]
  )
  const logoUrl = `/api/coach-logo/${coachId}?v=${Date.now()}`
  await upsertBrandingFields(coachId, { logoUrl })
  revalidateCoachBranding()
  const branding = await currentCoachBranding(coachId)
  return { ok: true as const, logoUrl, branding }
}

export async function coachUploadLogoAction(formData: FormData) {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string" || file.size === 0) return { ok: false as const, error: "NO_FILE" }
  if (file.size > LOGO_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }

  return storeCoachLogoFile(coachId, Buffer.from(await file.arrayBuffer()))
}

/** Save the client-cropped result (already a square WebP data URL from the
 *  logo editor) so the stored file matches exactly what the coach previewed. */
export async function coachUploadCroppedLogoAction(dataUrl: string) {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim())
  if (!m) return { ok: false as const, error: "INVALID_LOGO" }
  return storeCoachLogoFile(coachId, Buffer.from(m[2].replace(/\s/g, ""), "base64"))
}

export async function coachUpdateBrandingAction(input: BrandingFields) {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  if (input.primaryColor && !isValidPrimaryColor(input.primaryColor)) return { ok: false as const, error: "INVALID_COLOR" }

  let sanitized: ReturnType<typeof sanitizeBranding>
  try { sanitized = sanitizeBranding(input) } catch (e) { return { ok: false as const, error: (e as Error).message } }

  const toWrite: BrandingFields = {}
  if (input.brandName !== undefined) toWrite.brandName = sanitized.brandName
  if (input.primaryColor !== undefined) toWrite.primaryColor = sanitized.primaryColor
  if (input.whatsappUrl !== undefined) toWrite.whatsappUrl = sanitized.whatsappUrl
  if (input.facebookUrl !== undefined) toWrite.facebookUrl = sanitized.facebookUrl
  if (input.instagramUrl !== undefined) toWrite.instagramUrl = sanitized.instagramUrl
  await upsertBrandingFields(coachId, toWrite)

  revalidateCoachBranding()
  return { ok: true as const, branding: await currentCoachBranding(coachId) }
}

export async function coachRemoveLogoAction() {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  await pool.query(`DELETE FROM "CoachLogoFile" WHERE "coachId"=$1`, [coachId])
  await upsertBrandingFields(coachId, { logoUrl: null })

  revalidateCoachBranding()
  return { ok: true as const, branding: await currentCoachBranding(coachId) }
}

// --- Coach personal photo (avatar) -------------------------------------------
// Distinct from the brand logo: a photo of the coach shown on the client
// home hero. Same pipeline (WebP bytes + versioned URL), stored in
// CoachAvatarFile with the URL on TrainerProfile.avatarUrl.

async function storeCoachAvatarFile(coachId: string, buf: Buffer) {
  if (buf.length > LOGO_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }
  if (!sniffLogo(buf)) return { ok: false as const, error: "INVALID_TYPE" }
  let webp: Buffer
  try {
    webp = await convertLogoToWebp(buf)
  } catch {
    return { ok: false as const, error: "INVALID_IMAGE" }
  }
  await pool.query(
    `INSERT INTO "CoachAvatarFile" ("coachId","bytes","contentType","byteSize","updatedAt")
     VALUES ($1,$2,'image/webp',$3,NOW())
     ON CONFLICT ("coachId") DO UPDATE SET "bytes"=EXCLUDED."bytes", "contentType"=EXCLUDED."contentType", "byteSize"=EXCLUDED."byteSize", "updatedAt"=NOW()`,
    [coachId, webp, webp.length]
  )
  const avatarUrl = `/api/coach-avatar/${coachId}?v=${Date.now()}`
  await pool.query(`UPDATE "TrainerProfile" SET "avatarUrl"=$1, "updatedAt"=NOW() WHERE "id"=$2`, [avatarUrl, coachId])
  revalidateCoachBranding()
  const branding = await currentCoachBranding(coachId)
  return { ok: true as const, avatarUrl, branding }
}

export async function coachUploadAvatarAction(formData: FormData) {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string" || file.size === 0) return { ok: false as const, error: "NO_FILE" }
  if (file.size > LOGO_MAX_INPUT_BYTES) return { ok: false as const, error: "TOO_LARGE" }

  return storeCoachAvatarFile(coachId, Buffer.from(await file.arrayBuffer()))
}

/** Save the client-cropped result (square WebP data URL from the editor). */
export async function coachUploadAvatarCroppedAction(dataUrl: string) {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim())
  if (!m) return { ok: false as const, error: "INVALID_LOGO" }
  return storeCoachAvatarFile(coachId, Buffer.from(m[2].replace(/\s/g, ""), "base64"))
}

export async function coachRemoveAvatarAction() {
  const session = await getCurrentSession()
  const coachId = coachIdOf(session)
  if (!coachId) return { ok: false as const, error: "UNAUTHORIZED" }

  await pool.query(`DELETE FROM "CoachAvatarFile" WHERE "coachId"=$1`, [coachId])
  await pool.query(`UPDATE "TrainerProfile" SET "avatarUrl"=NULL, "updatedAt"=NOW() WHERE "id"=$1`, [coachId])

  revalidateCoachBranding()
  return { ok: true as const, branding: await currentCoachBranding(coachId) }
}
