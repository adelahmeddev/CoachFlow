/**
 * Shared helpers for DB-backed tests. Each suite creates uniquely-prefixed
 * rows and removes them afterwards — never touches real data.
 */
import dotenv from "dotenv"

dotenv.config()

export const hasDb = !!process.env.DATABASE_URL

export const tid = () =>
  `c${[...crypto.getRandomValues(new Uint8Array(12))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`

export async function createCoachWithClient(pool: {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>
}) {
  const coachUserId = tid()
  const trainerId = tid()
  const clientUserId = tid()
  const clientId = tid()
  await pool.query(
    `INSERT INTO "User" ("id","username","passwordHash","role","createdAt","updatedAt")
     VALUES ($1,$2,'test-hash','COACH',NOW(),NOW())`,
    [coachUserId, `p0coach_${coachUserId}`]
  )
  await pool.query(
    `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt")
     VALUES ($1,$2,'P0 Coach','01000000002',NOW(),NOW())`,
    [trainerId, coachUserId]
  )
  await pool.query(
    `INSERT INTO "User" ("id","username","passwordHash","role","createdAt","updatedAt")
     VALUES ($1,$2,'test-hash','CLIENT',NOW(),NOW())`,
    [clientUserId, `p0client_${clientUserId}`]
  )
  await pool.query(
    `INSERT INTO "Client" ("id","trainerId","userId","fullName","status","createdAt","updatedAt")
     VALUES ($1,$2,$3,'P0 Client','ACTIVE',NOW(),NOW())`,
    [clientId, trainerId, clientUserId]
  )
  return { coachUserId, trainerId, clientUserId, clientId }
}

export async function cleanupCoachWithClient(
  pool: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  ids: { coachUserId: string; trainerId: string; clientUserId: string; clientId: string }
) {
  await pool.query(`DELETE FROM "Notification" WHERE "userId" IN ($1,$2)`, [
    ids.coachUserId,
    ids.clientUserId,
  ])
  await pool.query(`DELETE FROM "Client" WHERE "id" = $1`, [ids.clientId])
  await pool.query(`DELETE FROM "TrainerProfile" WHERE "id" = $1`, [ids.trainerId])
  await pool.query(`DELETE FROM "User" WHERE "id" IN ($1,$2)`, [ids.coachUserId, ids.clientUserId])
}
