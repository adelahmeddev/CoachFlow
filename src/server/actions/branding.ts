"use server"

import { revalidatePath } from "next/cache"
import { pool, generateId } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"
import { sanitizeBranding, isValidPrimaryColor, DEFAULT_BRANDING } from "@/server/services/branding.service"

function assertSuperAdmin(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  if (!session?.user || session.user.role !== "SUPER_ADMIN") throw new Error("UNAUTHORIZED")
}

async function assertCoachExists(coachId: string) {
  const r = await pool.query(`SELECT "id" FROM "TrainerProfile" WHERE "id"=$1 LIMIT 1`, [coachId])
  if (!r.rows[0]) throw new Error("COACH_NOT_FOUND")
}

export async function adminUpsertBrandingAction(coachId: string, input: { brandName?: string | null; logoUrl?: string | null; primaryColor?: string | null }) {
  const session = await getCurrentSession()
  try { assertSuperAdmin(session) } catch { return { ok: false as const, error: "UNAUTHORIZED" } }
  try { await assertCoachExists(coachId) } catch { return { ok: false as const, error: "COACH_NOT_FOUND" } }

  if (input.primaryColor && !isValidPrimaryColor(input.primaryColor)) return { ok: false as const, error: "INVALID_COLOR" }

  let sanitized: ReturnType<typeof sanitizeBranding>
  try { sanitized = sanitizeBranding(input) } catch (e) { return { ok: false as const, error: (e as Error).message } }

  const existing = await pool.query(`SELECT "id" FROM "CoachBranding" WHERE "coachId"=$1 LIMIT 1`, [coachId])
  if (existing.rows[0]) {
    await pool.query(`UPDATE "CoachBranding" SET "brandName"=$1, "logoUrl"=$2, "primaryColor"=$3, "updatedAt"=NOW() WHERE "coachId"=$4`, [sanitized.brandName, sanitized.logoUrl, sanitized.primaryColor, coachId])
  } else {
    await pool.query(`INSERT INTO "CoachBranding" ("id","coachId","brandName","logoUrl","primaryColor","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`, [generateId(), coachId, sanitized.brandName, sanitized.logoUrl, sanitized.primaryColor])
  }

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
  // Also could insert default row with nulls, but deletion = fallback to DEFAULT_BRANDING
  revalidatePath(`/admin/trainers/${coachId}`)
  revalidatePath(`/admin/trainers`)
  revalidatePath(`/dashboard`, "layout")
  revalidatePath(`/subscription`, "layout")
  revalidatePath(`/client`, "layout")
  return { ok: true as const }
}

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])
const MAX_BYTES = 2 * 1024 * 1024

export async function adminUploadLogoAction(coachId: string, formData: FormData) {
  const session = await getCurrentSession()
  try { assertSuperAdmin(session) } catch { return { ok: false as const, error: "UNAUTHORIZED" } }
  try { await assertCoachExists(coachId) } catch { return { ok: false as const, error: "COACH_NOT_FOUND" } }

  const file = formData.get("file") as File | null
  if (!file || typeof file === "string") return { ok: false as const, error: "NO_FILE" }
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false as const, error: "INVALID_TYPE" }
  if (file.size > MAX_BYTES) return { ok: false as const, error: "TOO_LARGE" }

  // Store as data URL for simplicity (reuse existing storage if available — none found, so inline).
  // Do not store binary in PG; we store URL. For production replace with S3/UploadThing.
  const buf = Buffer.from(await file.arrayBuffer())
  const b64 = buf.toString("base64")
  const dataUrl = `data:${file.type};base64,${b64}`

  // Upsert logoUrl only
  const existing = await pool.query(`SELECT "id" FROM "CoachBranding" WHERE "coachId"=$1 LIMIT 1`, [coachId])
  if (existing.rows[0]) {
    await pool.query(`UPDATE "CoachBranding" SET "logoUrl"=$1, "updatedAt"=NOW() WHERE "coachId"=$2`, [dataUrl, coachId])
  } else {
    await pool.query(`INSERT INTO "CoachBranding" ("id","coachId","brandName","logoUrl","primaryColor","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`, [generateId(), coachId, null, dataUrl, DEFAULT_BRANDING.primaryColor])
  }

  revalidatePath(`/admin/trainers/${coachId}`)
  revalidatePath(`/dashboard`, "layout")
  revalidatePath(`/subscription`, "layout")
  return { ok: true as const, logoUrl: dataUrl }
}
