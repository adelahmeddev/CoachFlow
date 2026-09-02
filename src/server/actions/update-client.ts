"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { clientCreateSchema } from "@/lib/validations/client"

export async function updateClientInfoAction(
  clientId: string,
  input: unknown
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "COACH")
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const clientRes = await pool.query(
    `SELECT "id", "trainerId" FROM "Client" WHERE "id"=$1 LIMIT 1`,
    [clientId]
  )
  const client = clientRes.rows[0] as
    | { id: string; trainerId: string }
    | undefined

  if (!client) {
    return { ok: false, error: "CLIENT_NOT_FOUND" }
  }

  if (
    session.user.role === "COACH" &&
    client.trainerId !== session.user.trainerProfileId
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const parsed = clientCreateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, phone, birthDate, goal, status, coachingMode, workoutDisplayMode } = parsed.data

  await pool.query(
    `UPDATE "Client" SET
      "fullName" = $1,
      "phone" = $2,
      "birthDate" = $3,
      "goal" = $4::"Goal",
      "status" = $5::"ClientStatus",
      "coachingMode" = $6::"CoachingMode",
      "workoutDisplayMode" = $7::"WorkoutDisplayMode",
      "updatedAt" = NOW()
    WHERE "id" = $8`,
    [
      fullName,
      phone ?? null,
      birthDate ?? null,
      goal ?? null,
      status,
      coachingMode ?? 'ONLINE',
      workoutDisplayMode ?? 'FULL',
      clientId,
    ]
  )

  revalidatePath(`/clients/${clientId}`)
  invalidate([`client:${clientId}:profile`])
  return { ok: true }
}
