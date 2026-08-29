"use server"

import { pool, generateId } from "@/lib/db"
import { hashPassword, comparePassword } from "@/lib/auth"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { PlanStatus } from "@/lib/db/enums"
import { getDayDetail } from "@/server/services/week.service"

async function invalidateClientWorkoutTags(clientId: string) {
  const clientRes = await pool.query(`SELECT "trainerId" FROM "Client" WHERE "id"=$1 LIMIT 1`, [clientId])
  const client = clientRes.rows[0] as { trainerId: string | null } | undefined
  const tags = [
    `client:${clientId}:workout`,
    `client:${clientId}:progress`,
    `client:${clientId}:profile`,
  ]
  if (client?.trainerId) {
    tags.push(`trainer:${client.trainerId}:dashboard`)
    tags.push(`trainer:${client.trainerId}:clients`)
  }
  invalidate(tags)
}

export async function saveDailyLogAction(
  clientId: string,
  data: {
    weightKg?: number
    sleepHours?: number
    waterLiters?: number
    energyLevel?: number
    moodLevel?: number
    nutritionCompliant?: boolean
    notes?: string
  }
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  const existingRes = await pool.query(
    `SELECT * FROM "DailyLog" WHERE "clientId"=$1 AND "date" >= $2 AND "date" < $3 LIMIT 1`,
    [clientId, today, tomorrow]
  )
  const existingLog = existingRes.rows[0] as { id: string } | undefined

  if (existingLog) {
    await pool.query(
      `UPDATE "DailyLog" SET "weightKg"=$1, "sleepHours"=$2, "waterLiters"=$3, "energyLevel"=$4, "moodLevel"=$5, "nutritionCompliant"=$6, "notes"=$7, "updatedAt"=NOW() WHERE "id"=$8`,
      [
        data.weightKg ?? null,
        data.sleepHours ?? null,
        data.waterLiters ?? null,
        data.energyLevel ?? null,
        data.moodLevel ?? null,
        data.nutritionCompliant ?? false,
        data.notes ?? null,
        existingLog.id,
      ]
    )
  } else {
    const id = generateId()
    await pool.query(
      `INSERT INTO "DailyLog" ("id","clientId","date","weightKg","sleepHours","waterLiters","energyLevel","moodLevel","nutritionCompliant","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
      [
        id,
        clientId,
        today,
        data.weightKg ?? null,
        data.sleepHours ?? null,
        data.waterLiters ?? null,
        data.energyLevel ?? null,
        data.moodLevel ?? null,
        data.nutritionCompliant ?? false,
        data.notes ?? null,
      ]
    )
  }

  await invalidateClientWorkoutTags(clientId)

  return { ok: true }
}
/* ------------------------------------------------------------------ */
/* START WORKOUT — per-exercise logging                                */
/* ------------------------------------------------------------------ */

async function requireClientId(): Promise<string | null> {
  const session = await getCurrentSession()
  return session?.user.clientProfileId ?? null
}

export async function getMyDayDetailAction(dayId: string) {
  const clientId = await requireClientId()
  if (!clientId) return null

  const detail = await getDayDetail(clientId, dayId)
  if (!detail) return null
  if (detail.dayId !== dayId) return null

  return detail
}

export async function saveExerciseLogAction(
  splitDayExerciseId: string,
  data: {
    actualSets?: number
    actualReps?: number
    actualWeightKg?: number
    rpe?: number
    notes?: string
    sets?: Array<{ weightKg?: number | null; reps?: number | null }>
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clientId = await requireClientId()
  if (!clientId) return { ok: false, error: "UNAUTHORIZED" }

  const ownedRes = await pool.query(
    `SELECT sde."id" FROM "SplitDayExercise" sde
      JOIN "TrainingSplitDay" tsd ON sde."splitDayId"=tsd."id"
      JOIN "TrainingSplit" ts ON tsd."splitId"=ts."id"
      WHERE sde."id"=$1 AND ts."clientId"=$2 AND ts."status"=$3::"PlanStatus" LIMIT 1`,
    [splitDayExerciseId, clientId, PlanStatus.ACTIVE]
  )
  const owned = ownedRes.rows[0] as { id: string } | undefined
  if (!owned) return { ok: false, error: "NOT_FOUND" }

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const completedSets = (data.sets ?? []).filter(
    (s) => (s.weightKg != null && s.weightKg > 0) || (s.reps != null && s.reps > 0)
  )
  const weights = completedSets
    .map((s) => s.weightKg)
    .filter((w): w is number => w != null && w > 0)
  const repsValues = completedSets
    .map((s) => s.reps)
    .filter((r): r is number => r != null && r > 0)

  const payload = {
    actualSets:
      data.sets && completedSets.length > 0
        ? completedSets.length
        : data.actualSets,
    actualReps:
      repsValues.length > 0 ? Math.min(...repsValues) : data.actualReps,
    actualWeightKg:
      weights.length > 0 ? Math.max(...weights) : data.actualWeightKg,
    rpe: data.rpe,
    notes: data.notes,
    setData: data.sets
      ? completedSets.map((s) => ({
          weightKg: s.weightKg ?? null,
          reps: s.reps ?? null,
        }))
      : undefined,
  }

  const existingRes = await pool.query(
    `SELECT "id" FROM "ExerciseLog" WHERE "clientId"=$1 AND "splitDayExerciseId"=$2 AND "date" >= $3 AND "date" < $4 LIMIT 1`,
    [clientId, splitDayExerciseId, dayStart, dayEnd]
  )
  const existing = existingRes.rows[0] as { id: string } | undefined

  const { setData, ...scalars } = payload

  if (existing) {
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1
    if (scalars.actualSets !== undefined) {
      fields.push(`"actualSets"=$${idx++}`)
      values.push(scalars.actualSets ?? null)
    }
    if (scalars.actualReps !== undefined) {
      fields.push(`"actualReps"=$${idx++}`)
      values.push(scalars.actualReps ?? null)
    }
    if (scalars.actualWeightKg !== undefined) {
      fields.push(`"actualWeightKg"=$${idx++}`)
      values.push(scalars.actualWeightKg ?? null)
    }
    if (scalars.rpe !== undefined) {
      fields.push(`"rpe"=$${idx++}`)
      values.push(scalars.rpe ?? null)
    }
    if (scalars.notes !== undefined) {
      fields.push(`"notes"=$${idx++}`)
      values.push(scalars.notes ?? null)
    }
    if (setData !== undefined) {
      fields.push(`"setData"=$${idx++}::jsonb`)
      values.push(JSON.stringify(setData))
    }
    if (fields.length === 0) {
      // nothing to update but touch updatedAt
      await pool.query(`UPDATE "ExerciseLog" SET "updatedAt"=NOW() WHERE "id"=$1`, [existing.id])
    } else {
      fields.push(`"updatedAt"=NOW()`)
      const sql = `UPDATE "ExerciseLog" SET ${fields.join(", ")} WHERE "id"=$${idx} RETURNING *`
      values.push(existing.id)
      await pool.query(sql, values)
    }
  } else {
    const id = generateId()
    const now = new Date()
    // Build insert with handling of undefined vs null
    const actualSets = scalars.actualSets ?? null
    const actualReps = scalars.actualReps ?? null
    const actualWeightKg = scalars.actualWeightKg ?? null
    const rpe = scalars.rpe ?? null
    const notes = scalars.notes ?? null
    const setDataJson = setData !== undefined ? JSON.stringify(setData) : null
    if (setData !== undefined) {
      await pool.query(
        `INSERT INTO "ExerciseLog" ("id","clientId","splitDayExerciseId","date","actualSets","actualReps","actualWeightKg","rpe","notes","setData","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$11)`,
        [id, clientId, splitDayExerciseId, now, actualSets, actualReps, actualWeightKg, rpe, notes, setDataJson, now]
      )
    } else {
      await pool.query(
        `INSERT INTO "ExerciseLog" ("id","clientId","splitDayExerciseId","date","actualSets","actualReps","actualWeightKg","rpe","notes","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        [id, clientId, splitDayExerciseId, now, actualSets, actualReps, actualWeightKg, rpe, notes, now]
      )
    }
  }

  await invalidateClientWorkoutTags(clientId)
  return { ok: true }
}
