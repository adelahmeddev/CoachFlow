"use server"

import { comparePassword, hashPassword } from "@/lib/auth"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { pool, withTransaction } from "@/lib/db"
import { getCurrentSession, invalidateNameCache } from "@/server/auth"
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config"
import {
  businessSchema,
  notificationsSchema,
  preferencesSchema,
  profileSchema,
  securitySchema,
} from "@/lib/validations/settings"

type ActionResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; error?: string }

type PreferencesResult =
  | { ok: true; language?: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; error?: string }

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "TRAINER" &&
      session.user.trainerProfileId
  )
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const userId = session!.user!.id
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { fullName, phone } = parsed.data

  const existingRes = await pool.query(`SELECT "id" FROM "User" WHERE "phone"=$1 AND "id" <> $2 LIMIT 1`, [phone, userId])
  const existing = existingRes.rows[0]
  if (existing) {
    return { ok: false, error: "PHONE_EXISTS" }
  }

  await pool.query(`UPDATE "TrainerProfile" SET "fullName"=$1, "phone"=$2, "updatedAt"=NOW() WHERE "id"=$3`, [fullName, phone, trainerProfileId])

  invalidateNameCache(userId)
  revalidatePath("/settings")
  return { ok: true }
}

export async function updateSecurityAction(
  input: unknown
): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const userId = session!.user!.id

  const parsed = securitySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { currentPassword, newPassword } = parsed.data

  const userRes = await pool.query(`SELECT * FROM "User" WHERE "id"=$1 LIMIT 1`, [userId])
  const user = userRes.rows[0] as { passwordHash: string } | undefined
  if (!user) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const passwordValid = await comparePassword(
    currentPassword,
    user.passwordHash
  )
  if (!passwordValid) {
    return { ok: false, error: "WRONG_CURRENT_PASSWORD" }
  }

  const passwordHash = await hashPassword(newPassword)
  await pool.query(`UPDATE "User" SET "passwordHash"=$1, "updatedAt"=NOW() WHERE "id"=$2`, [passwordHash, userId])

  return { ok: true }
}

export async function updatePreferencesAction(
  input: unknown
): Promise<PreferencesResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = preferencesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { language, units, weekStartDay, timezone } = parsed.data

  await pool.query(
    `UPDATE "TrainerProfile" SET "units"=$1::"Units", "weekStartDay"=$2::"WeekStartDay", "timezone"=$3, "updatedAt"=NOW() WHERE "id"=$4`,
    [units, weekStartDay, timezone || null, trainerProfileId]
  )

  if (isLocale(language)) {
    const cookieStore = await cookies()
    cookieStore.set(LOCALE_COOKIE, language, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
  }

  revalidatePath("/settings")
  return { ok: true, language }
}

export async function updateNotificationsAction(
  input: unknown
): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = notificationsSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1
  if (parsed.data.notifyReassessment !== undefined) {
    fields.push(`"notifyReassessment"=$${idx++}`)
    values.push(parsed.data.notifyReassessment)
  }
  fields.push(`"notifyInactivity"=$${idx++}`)
  values.push(parsed.data.notifyInactivity)
  fields.push(`"notifySubscription"=$${idx++}`)
  values.push(parsed.data.notifySubscription)
  fields.push(`"weeklySummary"=$${idx++}`)
  values.push(parsed.data.weeklySummary)
  fields.push(`"updatedAt"=NOW()`)
  const sql = `UPDATE "TrainerProfile" SET ${fields.join(", ")} WHERE "id"=$${idx} RETURNING *`
  values.push(trainerProfileId)
  await pool.query(sql, values)

  revalidatePath("/settings")
  return { ok: true }
}

export async function updateBusinessAction(
  input: unknown
): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = businessSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await pool.query(`UPDATE "TrainerProfile" SET "businessName"=$1, "updatedAt"=NOW() WHERE "id"=$2`, [
    parsed.data.businessName || null,
    trainerProfileId,
  ])

  revalidatePath("/settings")
  return { ok: true }
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false, error: "UNAUTHORIZED" }
  }
  const userId = session!.user!.id

  try {
    await withTransaction(async (client) => {
      const profileRes = await client.query(`SELECT "id" FROM "TrainerProfile" WHERE "userId"=$1 LIMIT 1`, [userId])
      const profile = profileRes.rows[0] as { id: string } | undefined
      if (profile) {
        await client.query(`DELETE FROM "Client" WHERE "trainerId"=$1`, [profile.id])
      }
      await client.query(`DELETE FROM "User" WHERE "id"=$1`, [userId])
    })

    const cookieStore = await cookies()
    cookieStore.set("next-auth.session-token", "", {
      path: "/",
      maxAge: 0,
    })
  } catch {
    return { ok: false, error: "DELETE_FAILED" }
  }

  redirect("/login")
}
