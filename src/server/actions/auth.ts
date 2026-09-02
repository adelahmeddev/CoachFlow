"use server"

import { hashPassword } from "@/lib/auth"
import { registerTrainer } from "@/server/services/auth.service"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { Role } from "@/lib/db/enums"

export async function registerAction(input: {
  fullName: string
  phone: string
  password: string
  confirmPassword: string
}) {
  return registerTrainer(input)
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "SUPER_ADMIN" && session.user.role !== "COACH")
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const userRes = await pool.query(`SELECT * FROM "User" WHERE "id"=$1 LIMIT 1`, [userId])
  const user = userRes.rows[0]
  if (!user) {
    return { ok: false, error: "User not found" }
  }

  const passwordHash = await hashPassword(newPassword)
  await pool.query(`UPDATE "User" SET "passwordHash"=$1, "updatedAt"=NOW() WHERE "id"=$2`, [passwordHash, userId])

  return { ok: true }
}
