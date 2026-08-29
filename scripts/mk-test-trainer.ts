import "dotenv/config"
import bcrypt from "bcryptjs"
import { pool, generateId } from "../src/lib/db"

async function main() {
  const username = "nuttest"
  const existingRes = await pool.query(`SELECT * FROM "User" WHERE "username" = $1 LIMIT 1`, [username])
  const existing = (existingRes.rows[0] as any) ?? null
  if (existing) {
    console.log("user exists, deleting", existing.id)
    await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [existing.id])
  }
  const passwordHash = await bcrypt.hash("test1234", 10)
  const userId = generateId()
  const userRes = await pool.query(
    `INSERT INTO "User" ("id","username","passwordHash","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"Role",NOW(),NOW()) RETURNING *`,
    [userId, username, passwordHash, "TRAINER"]
  )
  const user = userRes.rows[0] as any
  const profileId = generateId()
  const profileRes = await pool.query(
    `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING *`,
    [profileId, user.id, "Nutrition Test Trainer", "01000000000"]
  )
  const profile = profileRes.rows[0] as any
  console.log("created user", user.id, "profile", profile.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
