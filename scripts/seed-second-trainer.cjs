require("dotenv/config")
const bcrypt = require("@node-rs/bcrypt")
const { Pool } = require("pg")
const crypto = require("crypto")

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

function generateId() {
  return `c${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`
}

async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

async function main() {
  let userRow = await pool.query(`SELECT * FROM "User" WHERE "phone" = $1 LIMIT 1`, ["02001112222"])
  let user = userRow.rows[0] ?? null
  if (!user) {
    const hash = await bcrypt.hash("password", 10)
    const userId = generateId()
    const profileId = generateId()
    await withTransaction(async (tx) => {
      await tx.query(
        `INSERT INTO "User" ("id","phone","passwordHash","role","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"Role",NOW(),NOW())`,
        [userId, "02001112222", hash, "TRAINER"]
      )
      await tx.query(
        `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [profileId, userId, "Second Trainer", "02001112222"]
      )
    })
  }

  const trainerRes = await pool.query(`SELECT * FROM "User" WHERE "phone" = $1 LIMIT 1`, ["02001112222"])
  const trainer = trainerRes.rows[0]
  const profileRes = await pool.query(`SELECT * FROM "TrainerProfile" WHERE "userId" = $1 LIMIT 1`, [trainer.id])
  const trainerProfile = profileRes.rows[0]

  let clientRes = await pool.query(`SELECT * FROM "Client" WHERE "trainerId" = $1 LIMIT 1`, [trainerProfile.id])
  let client = clientRes.rows[0] ?? null
  if (!client) {
    const clientId = generateId()
    const newRes = await pool.query(
      `INSERT INTO "Client" ("id","trainerId","fullName","status","goal","createdAt","updatedAt") VALUES ($1,$2,$3,$4::"ClientStatus",$5::"Goal",NOW(),NOW()) RETURNING *`,
      [clientId, trainerProfile.id, "Other Trainer's Client", "ACTIVE", "STRENGTH"]
    )
    client = newRes.rows[0]
  } else {
    // ensure we have latest
    const fresh = await pool.query(`SELECT * FROM "Client" WHERE "trainerId" = $1 LIMIT 1`, [trainerProfile.id])
    client = fresh.rows[0]
  }

  console.log(JSON.stringify({ trainerId: trainerProfile.id, clientId: client.id }))
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
