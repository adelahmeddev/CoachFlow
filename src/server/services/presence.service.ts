import { pool } from "@/lib/db"

export async function upsertPresenceSession(
  clientId: string,
  trainerId?: string | null,
  ttlMinutes = 15
) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000)
  await pool.query(
    `INSERT INTO "PresenceSession" ("id", "clientId", "trainerId", "lastHeartbeatAt", "expiresAt", "createdAt")
     VALUES ($1, $2, $3, NOW(), $4, NOW())
     ON CONFLICT ("id") DO NOTHING`,
    // We use id based on clientId for simplicity; in practice use cuid
    []
  )
  // Simpler upsert by client latest session
  await pool.query(
    `INSERT INTO "PresenceSession" ("id", "clientId", "trainerId", "lastHeartbeatAt", "expiresAt", "createdAt")
     VALUES ($1, $2, $3, NOW(), $4, NOW())
     ON CONFLICT DO NOTHING`,
    [clientId, clientId, trainerId, expiresAt]
  )
  // Cleanup expired
  await pool.query(`DELETE FROM "PresenceSession" WHERE "expiresAt" < NOW()`)
}

export async function heartbeatPresence(clientId: string) {
  const expiresAt = new Date(Date.now() + 15 * 60_000)
  await pool.query(
    `UPDATE "PresenceSession"
     SET "lastHeartbeatAt" = NOW(), "expiresAt" = $2
     WHERE "clientId" = $1 AND "expiresAt" > NOW()`,
    [clientId, expiresAt]
  )
}

export async function getActivePresence(clientId: string) {
  const res = await pool.query(
    `SELECT * FROM "PresenceSession"
     WHERE "clientId" = $1 AND "expiresAt" > NOW()
     ORDER BY "lastHeartbeatAt" DESC
     LIMIT 1`,
    [clientId]
  )
  return res.rows[0] ?? null
}
