import { nanoid } from "nanoid"
import { pool, generateId, withTransaction, isUniqueViolation, isForeignKeyViolation } from "@/lib/db"
import { ClientStatus, Goal } from "@/lib/db/enums"
import {
  inviteBasicInfoSchema,
  inviteAccountSchema,
  joinClientSchema,
} from "@/lib/validations/invite"
import { hashPassword } from "@/lib/auth"

const DEFAULT_INVITE_EXPIRY_DAYS = 7

export type PublicInviteResult =
  | {
      valid: true
      clientId: string
      trainerName: string
      phone: string | null
      basicInfoCompletedAt: Date | null
      hasAccount: boolean
    }
  | { valid: false; reason: "not_found" | "expired" | "completed" }

const STATUS_MAP: Record<"NEW" | "ACTIVE" | "PAUSED", ClientStatus> = {
  NEW: ClientStatus.PENDING_ASSESSMENT,
  ACTIVE: ClientStatus.ACTIVE,
  PAUSED: ClientStatus.PAUSED,
}

async function ensureTrainerProfile(trainerProfileId: string): Promise<string> {
  const res = await pool.query(`SELECT "id" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [trainerProfileId])
  if (res.rowCount && res.rowCount > 0) return (res.rows[0] as { id: string }).id
  throw new Error(`Trainer profile not found: ${trainerProfileId}. Please log out and log in again.`)
}

export async function createClientInvite(
  trainerProfileId: string,
  expiresInDays?: number | null
) {
  if (!trainerProfileId || typeof trainerProfileId !== "string") {
    throw new Error("Missing trainer profile. Please log out and log in again.")
  }

  const trainerProfile = await pool.query(`SELECT "id" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [trainerProfileId])

  if (!trainerProfile.rowCount || trainerProfile.rowCount === 0) {
    throw new Error(
      `Trainer profile not found (${trainerProfileId}). Your session is stale after a database reset. Please log out and log in again to create a new profile.`
    )
  }

  const inviteToken = nanoid(24)
  const inviteExpiresAt = new Date(
    Date.now() +
      (expiresInDays ?? DEFAULT_INVITE_EXPIRY_DAYS) * 24 * 60 * 60 * 1000
  )

  try {
    const id = generateId()
    const now = new Date()
    const res = await pool.query(
      `INSERT INTO "Client" ("id", "trainerId", "inviteToken", "inviteExpiresAt", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5::"ClientStatus", $6, $6) RETURNING *`,
      [id, trainerProfileId, inviteToken, inviteExpiresAt, ClientStatus.INVITED, now]
    )
    return res.rows[0]
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      throw new Error(
        "Failed to create invite: trainer profile no longer exists. Please log out and log in again."
      )
    }
    throw error
  }
}

export async function getTrainerInvites(trainerProfileId: string) {
  const res = await pool.query(
    `SELECT "id", "fullName", "status", "inviteToken", "inviteExpiresAt", "basicInfoCompletedAt", "createdAt"
     FROM "Client" WHERE "trainerId" = $1 ORDER BY "createdAt" DESC`,
    [trainerProfileId]
  )
  return res.rows as Array<{
    id: string
    fullName: string | null
    status: ClientStatus
    inviteToken: string | null
    inviteExpiresAt: Date | null
    basicInfoCompletedAt: Date | null
    createdAt: Date
  }>
}

export async function getPublicClientByInviteToken(
  token: string
): Promise<PublicInviteResult> {
  const res = await pool.query(
    `SELECT c."id", c."inviteExpiresAt", c."basicInfoCompletedAt", c."userId", c."phone", tp."fullName" AS "trainerFullName"
     FROM "Client" c
     LEFT JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
     WHERE c."inviteToken" = $1 LIMIT 1`,
    [token]
  )
  if (!res.rowCount || res.rowCount === 0) {
    return { valid: false, reason: "not_found" }
  }
  const client = res.rows[0] as {
    id: string
    inviteExpiresAt: Date | null
    basicInfoCompletedAt: Date | null
    userId: string | null
    phone: string | null
    trainerFullName: string | null
  }
  if (client.inviteExpiresAt && client.inviteExpiresAt < new Date()) {
    return { valid: false, reason: "expired" }
  }
  if (client.userId) {
    return { valid: false, reason: "completed" }
  }
  return {
    valid: true,
    clientId: client.id,
    trainerName: client.trainerFullName ?? "",
    phone: client.phone,
    basicInfoCompletedAt: client.basicInfoCompletedAt,
    hasAccount: false,
  }
}

export type SubmitInviteResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export async function submitClientBasicInfo(
  token: string,
  input: unknown
): Promise<SubmitInviteResult> {
  const invite = await getPublicClientByInviteToken(token)
  if (!invite.valid) {
    return { ok: false, error: "This invite is invalid or has expired." }
  }

  const parsed = inviteBasicInfoSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, birthDate, phone, goal } = parsed.data as typeof parsed.data & { status?: string }
  const statusValue =
    (parsed.data as unknown as { status?: string }).status != null
      ? STATUS_MAP[(parsed.data as unknown as { status: keyof typeof STATUS_MAP }).status] ?? ClientStatus.PENDING_ASSESSMENT
      : ClientStatus.PENDING_ASSESSMENT

  await pool.query(
    `UPDATE "Client" SET "fullName" = $1, "birthDate" = $2, "phone" = $3, "goal" = $4::"Goal", "status" = $5::"ClientStatus", "basicInfoCompletedAt" = $6, "updatedAt" = NOW() WHERE "id" = $7`,
    [fullName, new Date(`${birthDate}T00:00:00Z`), phone, goal as string, statusValue, new Date(), invite.clientId]
  )

  return { ok: true }
}

export async function getOrCreateInviteSlug(trainerProfileId: string): Promise<string> {
  const profileRes = await pool.query(`SELECT "inviteSlug" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [trainerProfileId])
  if (!profileRes.rowCount || profileRes.rowCount === 0) throw new Error(`Trainer profile not found: ${trainerProfileId}`)
  const row = profileRes.rows[0] as { inviteSlug: string | null }
  if (row.inviteSlug) return row.inviteSlug
  const slug = nanoid(10)
  const now = new Date()
  const updated = await pool.query(
    `UPDATE "TrainerProfile" SET "inviteSlug" = $1, "inviteSlugCreatedAt" = $2, "previousInviteSlug" = NULL, "previousInviteSlugExpiresAt" = NULL, "updatedAt" = NOW() WHERE "id" = $3 RETURNING "inviteSlug"`,
    [slug, now, trainerProfileId]
  )
  return (updated.rows[0] as { inviteSlug: string }).inviteSlug
}

export async function regenerateInviteSlug(trainerProfileId: string): Promise<string> {
  const profileRes = await pool.query(`SELECT "inviteSlug" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`, [trainerProfileId])
  if (!profileRes.rowCount || profileRes.rowCount === 0) throw new Error(`Trainer profile not found: ${trainerProfileId}`)
  const row = profileRes.rows[0] as { inviteSlug: string | null }
  const newSlug = nanoid(10)
  const graceExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
  const updated = await pool.query(
    `UPDATE "TrainerProfile" SET "previousInviteSlug" = $1, "previousInviteSlugExpiresAt" = $2, "inviteSlug" = $3, "inviteSlugCreatedAt" = $4, "updatedAt" = NOW() WHERE "id" = $5 RETURNING "inviteSlug"`,
    [row.inviteSlug, row.inviteSlug ? graceExpiresAt : null, newSlug, new Date(), trainerProfileId]
  )
  return (updated.rows[0] as { inviteSlug: string }).inviteSlug
}

export async function getTrainerByJoinSlug(slug: string) {
  const now = new Date()
  const byCurrent = await pool.query(`SELECT "id", "fullName", "inviteSlug" FROM "TrainerProfile" WHERE "inviteSlug" = $1 LIMIT 1`, [slug])
  if (byCurrent.rowCount && byCurrent.rowCount > 0) {
    const r = byCurrent.rows[0] as { id: string; fullName: string }
    return { trainerProfileId: r.id, trainerName: r.fullName, isGrace: false }
  }
  const byPrevious = await pool.query(
    `SELECT "id", "fullName" FROM "TrainerProfile" WHERE "previousInviteSlug" = $1 AND "previousInviteSlugExpiresAt" > $2 LIMIT 1`,
    [slug, now]
  )
  if (byPrevious.rowCount && byPrevious.rowCount > 0) {
    const r = byPrevious.rows[0] as { id: string; fullName: string }
    return { trainerProfileId: r.id, trainerName: r.fullName, isGrace: true }
  }
  return null
}

export async function submitJoinClient(
  slug: string,
  input: unknown
): Promise<SubmitInviteResult & { clientId?: string }> {
  const trainer = await getTrainerByJoinSlug(slug)
  if (!trainer) {
    return { ok: false, error: "This invite link is invalid or has expired." }
  }
  const parsed = joinClientSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }
  const { fullName, phone, goal, password } = parsed.data
  const existing = await pool.query(`SELECT "id" FROM "Client" WHERE "trainerId" = $1 AND "phone" = $2 LIMIT 1`, [trainer.trainerProfileId, phone])
  if (existing.rowCount && existing.rowCount > 0) {
    return { ok: false, error: "A client with this phone number already exists for this trainer.", fieldErrors: { phone: ["Phone already registered"] } }
  }
  const passwordHash = await hashPassword(password)
  try {
    const client = await withTransaction(async (tx) => {
      const userId = generateId()
      const clientId = generateId()
      const now = new Date()
      await tx.query(
        `INSERT INTO "User" ("id", "username", "phone", "passwordHash", "role", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Role", $6, $6)`,
        [userId, phone, phone, passwordHash, "CLIENT", now]
      )
      const res = await tx.query(
        `INSERT INTO "Client" ("id", "trainerId", "fullName", "phone", "goal", "status", "basicInfoCompletedAt", "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Goal", $6::"ClientStatus", $7, $8, $9, $9) RETURNING "id"`,
        [clientId, trainer.trainerProfileId, fullName, phone, goal as string, ClientStatus.PENDING_ASSESSMENT, now, userId, now]
      )
      return res.rows[0] as { id: string }
    })
    return { ok: true, clientId: client.id }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        error: "An account with this phone number already exists.",
        fieldErrors: { phone: ["Phone already registered"] },
      }
    }
    throw error
  }
}

export async function submitClientAccountInfo(
  token: string,
  input: unknown
): Promise<SubmitInviteResult> {
  const invite = await getPublicClientByInviteToken(token)
  if (!invite.valid) {
    return { ok: false, error: "This invite is invalid or has expired." }
  }

  if (!invite.basicInfoCompletedAt) {
    return { ok: false, error: "Please complete your basic information first." }
  }

  if (invite.hasAccount) {
    return { ok: false, error: "Account already setup. Please log in." }
  }

  const parsed = inviteAccountSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { password } = parsed.data
  const passwordHash = await hashPassword(password)

  try {
    await withTransaction(async (tx) => {
      const userId = generateId()
      const now = new Date()
      const username = invite.phone ?? `client_${invite.clientId}`
      const phoneVal = invite.phone ?? null
      await tx.query(
        `INSERT INTO "User" ("id", "username", "phone", "passwordHash", "role", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5::"Role", $6, $6)`,
        [userId, username, phoneVal, passwordHash, "CLIENT", now]
      )
      await tx.query(`UPDATE "Client" SET "userId" = $1, "updatedAt" = NOW() WHERE "id" = $2`, [userId, invite.clientId])
    })

    return { ok: true }
  } catch (error) {
    if (isUniqueViolation(error)) {
      const refreshed = await pool.query(`SELECT "userId" FROM "Client" WHERE "id" = $1 LIMIT 1`, [invite.clientId])
      if (refreshed.rowCount && refreshed.rowCount > 0 && (refreshed.rows[0] as { userId: string | null }).userId) {
        return { ok: true }
      }
      return {
        ok: false,
        error: "An account with this phone number already exists.",
      }
    }
    throw error
  }
}
