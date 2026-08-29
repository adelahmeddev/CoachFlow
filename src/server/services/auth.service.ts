import { hashPassword } from "@/lib/auth"
import { pool, generateId, withTransaction } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string }

export async function registerTrainer(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, phone, password } = parsed.data

  const existingRes = await pool.query(
    `SELECT "id" FROM "User" WHERE "username"=$1 OR "phone"=$1 LIMIT 1`,
    [phone]
  )
  if (existingRes.rows[0]) {
    return {
      ok: false,
      formError: "An account with this phone number already exists",
    }
  }

  const passwordHash = await hashPassword(password)

  const userId = await withTransaction(async (client) => {
    const id = generateId()
    const trainerId = generateId()
    await client.query(
      `INSERT INTO "User" ("id","username","phone","passwordHash","role","mustChangePassword","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'TRAINER',false,NOW(),NOW())`,
      [id, phone, phone, passwordHash]
    )
    await client.query(
      `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      [trainerId, id, fullName, phone]
    )
    return id
  })

  return { ok: true, userId }
}
