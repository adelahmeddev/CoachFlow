import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { cleanupCoachWithClient, createCoachWithClient, hasDb, tid } from "./db-setup"

const DAY_MS = 24 * 60 * 60 * 1000

describe("subscription automation", { skip: !hasDb }, () => {
  let pool: typeof import("../src/lib/db").pool
  let jobs: typeof import("../src/server/automation/jobs")
  let ids = { coachUserId: "", trainerId: "", clientUserId: "", clientId: "" }
  let expiringSubId = ""
  let overdueSubId = ""

  before(async () => {
    pool = (await import("../src/lib/db")).pool
    jobs = await import("../src/server/automation/jobs")
    ids = await createCoachWithClient(pool as never)

    const in3Days = new Date(Date.now() + 3 * DAY_MS)
    const yesterday = new Date(Date.now() - DAY_MS)
    const lastMonth = new Date(Date.now() - 30 * DAY_MS)
    expiringSubId = tid()
    overdueSubId = tid()
    await pool.query(
      `INSERT INTO "Subscription" ("id","clientId","planName","planType","status","startDate","endDate","durationDays","paymentStatus","createdAt","updatedAt")
       VALUES ($1,$2,'Monthly','PERIOD','ACTIVE',$3,$4,30,'PENDING',NOW(),NOW())`,
      [expiringSubId, ids.clientId, lastMonth, in3Days]
    )
    await pool.query(
      `INSERT INTO "Subscription" ("id","clientId","planName","planType","status","startDate","endDate","durationDays","paymentStatus","createdAt","updatedAt")
       VALUES ($1,$2,'Old','PERIOD','ACTIVE',$3,$4,30,'PAID',NOW(),NOW())`,
      [overdueSubId, ids.clientId, lastMonth, yesterday]
    )
  })

  after(async () => {
    if (!hasDb) return
    await pool.query(`DELETE FROM "Subscription" WHERE "clientId" = $1`, [ids.clientId])
    await cleanupCoachWithClient(pool as never, ids)
  })

  async function notifCount(): Promise<number> {
    const r = await pool.query(
      `SELECT COUNT(*)::int c FROM "Notification" WHERE "userId" IN ($1,$2)`,
      [ids.coachUserId, ids.clientUserId]
    )
    return (r.rows[0] as { c: number }).c
  }

  it("expires overdue subscriptions and sends each reminder exactly once", async () => {
    const before = await notifCount()
    const first = await jobs.runAutomationJobs(new Date())
    assert.equal(first.locked, true)
    assert.ok(first.expiredSubscriptions >= 1)

    const status = await pool.query(`SELECT "status" FROM "Subscription" WHERE "id" = $1`, [overdueSubId])
    assert.equal((status.rows[0] as { status: string }).status, "EXPIRED")

    // T-3 client reminder + coach heads-up + expiry notices exist.
    const keys = await pool.query(
      `SELECT "dedupeKey" FROM "Notification" WHERE "userId" IN ($1,$2)`,
      [ids.coachUserId, ids.clientUserId]
    )
    const set = new Set((keys.rows as { dedupeKey: string }[]).map((r) => r.dedupeKey))
    assert.ok(set.has(`sub:${expiringSubId}:c:3`), "T-3 client reminder")
    assert.ok(set.has(`sub:${expiringSubId}:coach:3`), "T-3 coach reminder")
    assert.ok(set.has(`sub:${overdueSubId}:c:expired`), "expiry client notice")

    const afterFirst = await notifCount()
    assert.ok(afterFirst > before)

    // Second run same day: fully idempotent for OUR users (other suites may
    // run concurrently with their own ACTIVE clients, so global counters
    // are not asserted — per-user counts are the hermetic signal).
    await jobs.runAutomationJobs(new Date())
    assert.equal(await notifCount(), afterFirst)
  })

  it("never deletes subscription history", async () => {
    const r = await pool.query(`SELECT COUNT(*)::int c FROM "Subscription" WHERE "clientId" = $1`, [ids.clientId])
    assert.equal((r.rows[0] as { c: number }).c, 2)
  })
})
