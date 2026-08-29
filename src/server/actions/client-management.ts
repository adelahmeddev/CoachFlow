"use server"

import { hashPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"

export async function resetClientPasswordAction(
  clientId: string,
  newPassword: string,
  forceChange: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TRAINER")
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const clientRes = await pool.query(
    `SELECT "id", "userId", "trainerId" FROM "Client" WHERE "id"=$1 LIMIT 1`,
    [clientId]
  )
  const client = clientRes.rows[0] as
    | { id: string; userId: string | null; trainerId: string }
    | undefined

  if (!client) {
    return { ok: false, error: "CLIENT_NOT_FOUND" }
  }

  if (
    session.user.role === "TRAINER" &&
    client.trainerId !== session.user.trainerProfileId
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  if (!client.userId) {
    return { ok: false, error: "CLIENT_NO_ACCOUNT" }
  }

  const passwordHash = await hashPassword(newPassword)
  await pool.query(`UPDATE "User" SET "passwordHash"=$1, "mustChangePassword"=$2, "updatedAt"=NOW() WHERE "id"=$3`, [
    passwordHash,
    forceChange,
    client.userId,
  ])

  revalidatePath(`/clients/${clientId}`)
  invalidate([`client:${clientId}:profile`])
  return { ok: true }
}
