/**
 * Integration: editing a training split must never destroy workout history.
 * Requires DATABASE_URL (skipped otherwise). Cleans up after itself.
 */
import { describe, it, before, after } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import dotenv from "dotenv"

dotenv.config()

const hasDb = !!process.env.DATABASE_URL

const tid = () => `c${randomUUID().replace(/-/g, "").slice(0, 24)}`

describe("training split versioning", { skip: !hasDb }, () => {
  let pool: typeof import("../src/lib/db").pool
  let svc: typeof import("../src/server/services/training-split.service")
  let trainerId = ""
  let clientId = ""
  const userIds: string[] = []

  before(async () => {
    const db = await import("../src/lib/db")
    pool = db.pool
    svc = await import("../src/server/services/training-split.service")

    const uid = tid()
    trainerId = tid()
    clientId = tid()
    userIds.push(uid)
    await pool.query(
      `INSERT INTO "User" ("id","username","passwordHash","role","createdAt","updatedAt")
       VALUES ($1,$2,'test-hash','COACH',NOW(),NOW())`,
      [uid, `vtest_${uid}`]
    )
    await pool.query(
      `INSERT INTO "TrainerProfile" ("id","userId","fullName","phone","createdAt","updatedAt")
       VALUES ($1,$2,'Version Test Coach','01000000001',NOW(),NOW())`,
      [trainerId, uid]
    )
    await pool.query(
      `INSERT INTO "Client" ("id","trainerId","fullName","status","createdAt","updatedAt")
       VALUES ($1,$2,'Version Test Client','ACTIVE',NOW(),NOW())`,
      [clientId, trainerId]
    )
  })

  after(async () => {
    if (!hasDb) return
    // Explicit client delete must still work with the RESTRICT guard in place.
    await pool.query(`DELETE FROM "Client" WHERE "id" = $1`, [clientId])
    await pool.query(`DELETE FROM "TrainerProfile" WHERE "id" = $1`, [trainerId])
    for (const uid of userIds) {
      await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [uid])
    }
  })

  it("editing a split WITH logs versions instead of deleting history", async () => {
    const split = await svc.createTrainingSplit(clientId, trainerId, {
      splitType: "FULL_BODY",
      status: "ACTIVE",
      scheduleMode: "SEQUENTIAL",
      notes: null,
      days: [
        {
          focus: "FULL_BODY",
          customFocus: null,
          weekday: null,
          notes: null,
          exercises: [
            { exerciseId: null, exerciseName: "Bench Press", targetSets: 3, targetReps: 8, targetWeightKg: 60, restSeconds: 90, notes: null, videoUrl: null },
          ],
        },
      ],
    } as never)
    assert.ok(split, "split created")

    const full = await svc.getActiveTrainingSplit(clientId, trainerId)
    const exId = full!.days[0]!.exercises[0]!.id
    await pool.query(
      `INSERT INTO "ExerciseLog" ("id","clientId","splitDayExerciseId","date","actualSets","actualReps","actualWeightKg","createdAt","updatedAt")
       VALUES ($1,$2,$3,NOW(),3,8,60,NOW(),NOW())`,
      [tid(), clientId, exId]
    )
    assert.equal(await svc.countSplitExerciseLogs(split!.id), 1)

    const updated = await svc.updateTrainingSplit(clientId, trainerId, split!.id, {
      splitType: "FULL_BODY",
      status: "ACTIVE",
      scheduleMode: "SEQUENTIAL",
      notes: null,
      days: [
        {
          focus: "FULL_BODY",
          customFocus: null,
          weekday: null,
          notes: null,
          exercises: [
            { exerciseId: null, exerciseName: "Incline Dumbbell Press", targetSets: 4, targetReps: 10, targetWeightKg: 22, restSeconds: 90, notes: null, videoUrl: null },
          ],
        },
      ],
    } as never)
    assert.ok(updated, "update returned a split")
    assert.equal((updated as { versioned?: boolean }).versioned, true)
    assert.notEqual(updated!.id, split!.id, "a NEW version was created")

    // History intact: the log still resolves to the original exercise name.
    const logs = await pool.query(
      `SELECT el."id", sde."exerciseName" FROM "ExerciseLog" el
       JOIN "SplitDayExercise" sde ON sde."id" = el."splitDayExerciseId"
       WHERE el."clientId" = $1`,
      [clientId]
    )
    assert.equal(logs.rows.length, 1)
    assert.equal((logs.rows[0] as { exerciseName: string }).exerciseName, "Bench Press")

    // Old split frozen, new split live with the edits.
    const oldRow = await pool.query(`SELECT "status" FROM "TrainingSplit" WHERE "id" = $1`, [split!.id])
    assert.equal((oldRow.rows[0] as { status: string }).status, "COMPLETED")
    const live = await svc.getActiveTrainingSplit(clientId, trainerId)
    assert.equal(live!.id, updated!.id)
    assert.equal(live!.days[0]!.exercises[0]!.exerciseName, "Incline Dumbbell Press")
  })

  it("editing a split WITHOUT logs updates in place (same id)", async () => {
    const data = await svc.getClientTrainingSplitData(clientId, trainerId)
    const target = data!.splits.find((s) => s.status === "ACTIVE")!
    // The live version has no logs of its own (the log points at v1's exercise).
    assert.equal(await svc.countSplitExerciseLogs(target.id), 0)
    const updated = await svc.updateTrainingSplit(clientId, trainerId, target.id, {
      splitType: "UPPER_LOWER",
      status: "ACTIVE",
      scheduleMode: "SEQUENTIAL",
      notes: "tweaked",
      days: [
        {
          focus: "UPPER",
          customFocus: null,
          weekday: null,
          notes: null,
          exercises: [
            { exerciseId: null, exerciseName: "Overhead Press", targetSets: 3, targetReps: 8, targetWeightKg: 40, restSeconds: 90, notes: null, videoUrl: null },
          ],
        },
      ],
    } as never)
    assert.ok(updated)
    // No history on this version -> mutated in place, id preserved.
    assert.equal(updated!.id, target.id)
    assert.ok(!(updated as { versioned?: boolean }).versioned)
    const live = await svc.getActiveTrainingSplit(clientId, trainerId)
    assert.equal(live!.days[0]!.exercises[0]!.exerciseName, "Overhead Press")
  })
})
