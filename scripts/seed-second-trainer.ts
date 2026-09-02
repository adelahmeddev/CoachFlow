import "dotenv/config"
import { pool, generateId, withTransaction } from "../src/lib/db"
import bcrypt from "bcryptjs"

async function main() {
  let userRow = await pool.query(`SELECT * FROM "User" WHERE "phone" = $1 LIMIT 1`, ["02001112222"])
  let user: any = userRow.rows[0] ?? null
  if (!user) {
    const hash = await bcrypt.hash("password", 10)
    const userId = generateId()
    const profileId = generateId()
    await withTransaction(async (tx) => {
      await tx.query(
        `INSERT INTO "User" ("id","phone","passwordHash","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"Role",NOW(),NOW())`,
        [userId, "02001112222", hash, "COACH"]
      )
      await tx.query(
        `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [profileId, userId, "Second Trainer", "02001112222"]
      )
    })
    const fresh = await pool.query(`SELECT * FROM "User" WHERE "id" = $1`, [userId])
    user = fresh.rows[0]
  }

  const trainerRes = await pool.query(`SELECT * FROM "User" WHERE "phone" = $1 LIMIT 1`, ["02001112222"])
  const trainer = trainerRes.rows[0]
  const profileRes = await pool.query(`SELECT * FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [trainer.id])
  if (profileRes.rowCount === 0 || !profileRes.rows[0]) throw new Error("no profile")
  const trainerProfile = profileRes.rows[0]

  let clientRes = await pool.query(`SELECT * FROM "Client" WHERE "trainerId" = $1 LIMIT 1`, [trainerProfile.id])
  let client: any = clientRes.rows[0] ?? null
  if (!client) {
    const clientId = generateId()
    const newRes = await pool.query(
      `INSERT INTO "Client" ("id","trainerId","fullName","status","goal","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"ClientStatus",$5::"Goal",NOW(),NOW()) RETURNING *`,
      [clientId, trainerProfile.id, "Other Trainer's Client", "ACTIVE", "STRENGTH"]
    )
    client = newRes.rows[0]
  }

  console.log(JSON.stringify({ trainerProfileId: trainerProfile.id, clientId: client.id }))
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
