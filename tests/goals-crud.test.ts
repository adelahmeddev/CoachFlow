import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { cleanupCoachWithClient, createCoachWithClient, hasDb } from "./db-setup"

describe("client goals", { skip: !hasDb }, () => {
  let pool: typeof import("../src/lib/db").pool
  let svc: typeof import("../src/server/services/goal.service")
  let ids = { coachUserId: "", trainerId: "", clientUserId: "", clientId: "" }

  before(async () => {
    pool = (await import("../src/lib/db")).pool
    svc = await import("../src/server/services/goal.service")
    ids = await createCoachWithClient(pool as never)
  })

  after(async () => {
    if (hasDb) {
      await pool.query(`DELETE FROM "ClientGoal" WHERE "clientId" = $1`, [ids.clientId])
      await cleanupCoachWithClient(pool as never, ids)
    }
  })

  it("creates, updates and archives goals without destroying history", async () => {
    const created = await svc.createGoal(ids.clientId, ids.trainerId, {
      type: "WEIGHT",
      title: "Reach 80kg",
      startValue: 95,
      currentValue: null,
      targetValue: 80,
      unit: "kg",
      deadline: null,
    })
    assert.ok(created)

    const updated = await svc.updateGoal(created.id, ids.clientId, ids.trainerId, {
      type: "WEIGHT",
      title: "Reach 80kg",
      startValue: 95,
      currentValue: null,
      targetValue: 78,
      unit: "kg",
      deadline: null,
    })
    assert.equal(updated?.targetValue, 78)

    const archived = await svc.setGoalStatus(created.id, ids.clientId, ids.trainerId, "CANCELLED")
    assert.equal(archived?.status, "CANCELLED")

    // History remains intact after archival.
    const second = await svc.createGoal(ids.clientId, ids.trainerId, {
      type: "STRENGTH",
      title: "Bench 100kg",
      startValue: 60,
      currentValue: 70,
      targetValue: 100,
      unit: "kg",
      deadline: null,
    })
    assert.ok(second)
    const all = await svc.listGoalsForClient(ids.clientId)
    assert.equal(all.length, 2)
    const strength = all.find((g) => g.id === second!.id)!
    assert.equal(strength.progress, 25)
    assert.equal(strength.autoSynced, false)
  })

  it("auto-syncs body metrics from the latest InBody", async () => {
    await pool.query(
      `INSERT INTO "BodyComposition" ("id","clientId","date","source","weightKg","createdAt","updatedAt")
       VALUES ($1,$2,CURRENT_DATE,'COACH',88,NOW(),NOW())`,
      [`ctest_${Date.now()}`, ids.clientId]
    )
    const goals = await svc.listGoalsForClient(ids.clientId)
    const weight = goals.find((g) => g.type === "WEIGHT")!
    assert.equal(weight.resolvedCurrent, 88)
    assert.equal(weight.autoSynced, true)
    await pool.query(`DELETE FROM "BodyComposition" WHERE "clientId" = $1`, [ids.clientId])
  })

  it("rejects cross-coach access", async () => {
    const other = await pool.query(
      `SELECT "id" FROM "TrainerProfile" WHERE "id" != $1 LIMIT 1`,
      [ids.trainerId]
    )
    const otherTrainerId = (other.rows[0] as { id: string } | undefined)?.id ?? "c_nope000000000000000000"
    assert.equal(await svc.createGoal(ids.clientId, otherTrainerId, {
      type: "CUSTOM",
      title: "Hijack",
      startValue: null,
      currentValue: null,
      targetValue: 1,
      unit: null,
      deadline: null,
    }), null)
    assert.equal(await svc.listGoalsForClientOfTrainer(ids.clientId, otherTrainerId), null)
  })
})
