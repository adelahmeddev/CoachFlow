import { pool, generateId, withTransaction, type PgClient } from "@/lib/db"
import { PlanStatus, ScheduleMode } from "@/lib/db/enums"
import type {
  TrainingSplit,
  TrainingSplitDay,
  SplitDayExercise,
} from "@/lib/db/types"
import type { TrainingSplitInput } from "@/lib/validations/training-split"
import {
  toIntOrNull,
  toNumberOrNull,
} from "@/lib/validations/exercise"

export interface TrainingSplitWithDays extends TrainingSplit {
  days: (TrainingSplitDay & { exercises: SplitDayExercise[] })[]
}

async function getOwnedClient(clientId: string, trainerProfileId?: string) {
  if (trainerProfileId) {
    const res = await pool.query(
      `SELECT "id", "fullName" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
      [clientId, trainerProfileId]
    )
    return (res.rows[0] as { id: string; fullName: string | null } | undefined) ?? null
  }
  const res = await pool.query(
    `SELECT "id", "fullName" FROM "Client" WHERE "id" = $1 LIMIT 1`,
    [clientId]
  )
  return (res.rows[0] as { id: string; fullName: string | null } | undefined) ?? null
}

export async function getOwnedClientForForm(
  clientId: string,
  trainerProfileId?: string
) {
  if (trainerProfileId) {
    const res = await pool.query(
      `SELECT "id", "fullName", "goal" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
      [clientId, trainerProfileId]
    )
    return (res.rows[0] as { id: string; fullName: string | null; goal: string | null } | undefined) ?? null
  }
  const res = await pool.query(
    `SELECT "id", "fullName", "goal" FROM "Client" WHERE "id" = $1 LIMIT 1`,
    [clientId]
  )
  return (res.rows[0] as { id: string; fullName: string | null; goal: string | null } | undefined) ?? null
}

async function hydrateSplitDays(
  splitId: string,
  exec: typeof pool | PgClient
): Promise<(TrainingSplitDay & { exercises: SplitDayExercise[] })[]> {
  const daysRes = await exec.query<TrainingSplitDay>(
    `SELECT * FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC`,
    [splitId]
  )
  const days = daysRes.rows as TrainingSplitDay[]
  const result: (TrainingSplitDay & { exercises: SplitDayExercise[] })[] = []
  for (const day of days) {
    const exRes = await exec.query<SplitDayExercise>(
      `SELECT * FROM "SplitDayExercise" WHERE "splitDayId" = $1 ORDER BY "order" ASC`,
      [day.id]
    )
    result.push({ ...day, exercises: exRes.rows as SplitDayExercise[] })
  }
  return result
}

async function hydrateSplits(
  splits: TrainingSplit[],
  exec: typeof pool | PgClient
): Promise<TrainingSplitWithDays[]> {
  const out: TrainingSplitWithDays[] = []
  for (const split of splits) {
    const days = await hydrateSplitDays(split.id, exec)
    out.push({ ...split, days })
  }
  return out
}

export async function getClientTrainingSplitData(
  clientId: string,
  trainerProfileId?: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const res = await pool.query<TrainingSplit>(
    `SELECT * FROM "TrainingSplit" WHERE "clientId" = $1 ORDER BY "createdAt" DESC`,
    [client.id]
  )
  const splitsRaw = res.rows as TrainingSplit[]
  const splits = await hydrateSplits(splitsRaw, pool)

  return { client, splits }
}

export async function getTrainerWeekStartDay(
  trainerProfileId?: string
): Promise<"SAT" | "SUN" | "MON"> {
  if (!trainerProfileId) return "SAT"
  const res = await pool.query(
    `SELECT "weekStartDay" FROM "TrainerProfile" WHERE "id" = $1 LIMIT 1`,
    [trainerProfileId]
  )
  const row = res.rows[0] as { weekStartDay: string } | undefined
  return (row?.weekStartDay as "SAT" | "SUN" | "MON") ?? "SAT"
}

export async function getActiveTrainingSplit(
  clientId: string,
  trainerProfileId?: string
): Promise<TrainingSplitWithDays | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const res = await pool.query<TrainingSplit>(
    `SELECT * FROM "TrainingSplit" WHERE "clientId" = $1 AND "status" = 'ACTIVE'::"PlanStatus" ORDER BY "createdAt" DESC LIMIT 1`,
    [client.id]
  )
  const split = res.rows[0] as TrainingSplit | undefined
  if (!split) return null
  const days = await hydrateSplitDays(split.id, pool)
  return { ...split, days }
}

export async function getTrainingSplitForEdit(
  clientId: string,
  trainerProfileId: string | undefined,
  splitId: string
): Promise<TrainingSplitWithDays | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const res = await pool.query<TrainingSplit>(
    `SELECT * FROM "TrainingSplit" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [splitId, client.id]
  )
  const split = res.rows[0] as TrainingSplit | undefined
  if (!split) return null
  const days = await hydrateSplitDays(split.id, pool)
  return { ...split, days }
}

export async function createTrainingSplit(
  clientId: string,
  trainerProfileId: string,
  data: TrainingSplitInput
): Promise<TrainingSplit | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  return withTransaction(async (tx) => {
    if (data.status === PlanStatus.ACTIVE) {
      await tx.query(
        `UPDATE "TrainingSplit" SET "status" = 'COMPLETED'::"PlanStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" = 'ACTIVE'::"PlanStatus"`,
        [client.id]
      )
    }

    const splitId = generateId()
    await tx.query(
      `INSERT INTO "TrainingSplit" ("id", "clientId", "splitType", "daysPerWeek", "scheduleMode", "notes", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3::"SplitType", $4, $5::"ScheduleMode", $6, $7::"PlanStatus", NOW(), NOW())`,
      [
        splitId,
        client.id,
        data.splitType,
        data.days.length,
        data.scheduleMode,
        data.notes || null,
        data.status,
      ]
    )

    for (let index = 0; index < data.days.length; index++) {
      const day = data.days[index]!
      const dayId = generateId()
      await tx.query(
        `INSERT INTO "TrainingSplitDay" ("id", "splitId", "dayNumber", "focus", "customFocus", "weekday", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4::"TrainingDayFocus", $5, $6::"Weekday", $7, NOW(), NOW())`,
        [
          dayId,
          splitId,
          index + 1,
          day.focus,
          day.customFocus?.trim() || null,
          data.scheduleMode === ScheduleMode.FIXED_WEEKDAYS ? day.weekday ?? null : null,
          day.notes?.trim() || null,
        ]
      )

      const exercises = day.exercises ?? []
      for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
        const exercise = exercises[exIndex]!
        const exId = generateId()
        await tx.query(
          `INSERT INTO "SplitDayExercise" ("id", "splitDayId", "order", "exerciseId", "exerciseName", "targetSets", "targetReps", "targetWeightKg", "restSeconds", "notes", "videoUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            exId,
            dayId,
            exIndex + 1,
            exercise.exerciseId ?? null,
            exercise.exerciseName.trim(),
            toIntOrNull(exercise.targetSets),
            toIntOrNull(exercise.targetReps),
            toNumberOrNull(exercise.targetWeightKg),
            toIntOrNull(exercise.restSeconds),
            exercise.notes?.trim() || null,
            exercise.videoUrl?.trim() || null,
          ]
        )
      }
    }

    const res = await tx.query<TrainingSplit>(`SELECT * FROM "TrainingSplit" WHERE "id" = $1 LIMIT 1`, [splitId])
    return res.rows[0] as TrainingSplit
  })
}

export async function updateTrainingSplit(
  clientId: string,
  trainerProfileId: string,
  splitId: string,
  data: TrainingSplitInput
): Promise<TrainingSplit | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const checkRes = await pool.query(
    `SELECT "id", "status" FROM "TrainingSplit" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [splitId, client.id]
  )
  const split = checkRes.rows[0] as { id: string; status: string } | undefined

  if (!split) return null

  return withTransaction(async (tx) => {
    if (data.status === PlanStatus.ACTIVE && split.status !== PlanStatus.ACTIVE) {
      await tx.query(
        `UPDATE "TrainingSplit" SET "status" = 'COMPLETED'::"PlanStatus", "updatedAt" = NOW() WHERE "clientId" = $1 AND "status" = 'ACTIVE'::"PlanStatus"`,
        [client.id]
      )
    }

    const updatedRes = await tx.query<TrainingSplit>(
      `UPDATE "TrainingSplit" SET "splitType" = $1::"SplitType", "daysPerWeek" = $2, "scheduleMode" = $3::"ScheduleMode", "notes" = $4, "status" = $5::"PlanStatus", "updatedAt" = NOW() WHERE "id" = $6 RETURNING *`,
      [data.splitType, data.days.length, data.scheduleMode, data.notes || null, data.status, splitId]
    )
    const updated = updatedRes.rows[0] as TrainingSplit

    await tx.query(`DELETE FROM "TrainingSplitDay" WHERE "splitId" = $1`, [splitId])

    const createdDayIds: string[] = []
    for (let index = 0; index < data.days.length; index++) {
      const day = data.days[index]!
      const dayId = generateId()
      createdDayIds.push(dayId)
      await tx.query(
        `INSERT INTO "TrainingSplitDay" ("id", "splitId", "dayNumber", "focus", "customFocus", "weekday", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4::"TrainingDayFocus", $5, $6::"Weekday", $7, NOW(), NOW())`,
        [
          dayId,
          splitId,
          index + 1,
          day.focus,
          day.customFocus?.trim() || null,
          data.scheduleMode === ScheduleMode.FIXED_WEEKDAYS ? day.weekday ?? null : null,
          day.notes?.trim() || null,
        ]
      )
    }

    // Insert exercises per day using the created day ids in order
    for (let index = 0; index < data.days.length; index++) {
      const day = data.days[index]!
      const dayId = createdDayIds[index]!
      const exercises = day.exercises ?? []
      for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
        const exercise = exercises[exIndex]!
        const exId = generateId()
        await tx.query(
          `INSERT INTO "SplitDayExercise" ("id", "splitDayId", "order", "exerciseId", "exerciseName", "targetSets", "targetReps", "targetWeightKg", "restSeconds", "notes", "videoUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            exId,
            dayId,
            exIndex + 1,
            exercise.exerciseId ?? null,
            exercise.exerciseName.trim(),
            toIntOrNull(exercise.targetSets),
            toIntOrNull(exercise.targetReps),
            toNumberOrNull(exercise.targetWeightKg),
            toIntOrNull(exercise.restSeconds),
            exercise.notes?.trim() || null,
            exercise.videoUrl?.trim() || null,
          ]
        )
      }
    }

    return updated
  })
}

export async function getOtherClientsSplits(
  clientId: string,
  trainerProfileId?: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return []

  let splitsRaw: TrainingSplit[] = []
  let clientNames = new Map<string, string | null>()

  if (trainerProfileId) {
    const res = await pool.query<TrainingSplit & { fullName: string | null }>(
      `SELECT ts.*, c."fullName" as "fullName"
       FROM "TrainingSplit" ts
       JOIN "Client" c ON c."id" = ts."clientId"
       WHERE ts."clientId" != $1 AND c."trainerId" = $2 AND ts."status" IN ('ACTIVE'::"PlanStatus", 'DRAFT'::"PlanStatus", 'PAUSED'::"PlanStatus")
       ORDER BY ts."updatedAt" DESC
       LIMIT 20`,
      [client.id, trainerProfileId]
    )
    splitsRaw = res.rows as TrainingSplit[]
    for (const row of res.rows as Array<TrainingSplit & { fullName: string | null }>) {
      clientNames.set((row as TrainingSplit).id, row.fullName)
    }
  } else {
    const res = await pool.query<TrainingSplit>(
      `SELECT * FROM "TrainingSplit" WHERE "clientId" != $1 AND "status" IN ('ACTIVE'::"PlanStatus", 'DRAFT'::"PlanStatus", 'PAUSED'::"PlanStatus") ORDER BY "updatedAt" DESC LIMIT 20`,
      [client.id]
    )
    splitsRaw = res.rows as TrainingSplit[]
    if (splitsRaw.length > 0) {
      const ids = splitsRaw.map((s) => s.clientId)
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",")
      const cRes = await pool.query(
        `SELECT "id", "fullName" FROM "Client" WHERE "id" IN (${placeholders})`,
        ids
      )
      const byId = new Map<string, string | null>()
      for (const r of cRes.rows as Array<{ id: string; fullName: string | null }>) byId.set(r.id, r.fullName)
      for (const s of splitsRaw) clientNames.set(s.id, byId.get(s.clientId) ?? null)
    }
  }

  const hydrated = await hydrateSplits(splitsRaw, pool)
  return hydrated.map((s) => ({
    ...s,
    client: { fullName: clientNames.get(s.id) ?? null },
  }))
}

export async function getClientPainFlags(
  clientId: string,
  trainerProfileId?: string
) {
  let res
  if (trainerProfileId) {
    res = await pool.query(
      `SELECT "neckPain", "shoulderPain", "backPain", "kneePain" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
      [clientId, trainerProfileId]
    )
  } else {
    res = await pool.query(
      `SELECT "neckPain", "shoulderPain", "backPain", "kneePain" FROM "Client" WHERE "id" = $1 LIMIT 1`,
      [clientId]
    )
  }
  const client = res.rows[0] as
    | { neckPain: boolean | null; shoulderPain: boolean | null; backPain: boolean | null; kneePain: boolean | null }
    | undefined

  if (!client) return null

  return {
    neckPain: client.neckPain ?? false,
    shoulderPain: client.shoulderPain ?? false,
    backPain: client.backPain ?? false,
    kneePain: client.kneePain ?? false,
  }
}

export const getLatestAssessmentPain = getClientPainFlags // keep alias for compat, will be removed in cleanup

export async function updateTrainingSplitStatus(
  clientId: string,
  trainerProfileId: string | undefined,
  splitId: string,
  status: PlanStatus
): Promise<TrainingSplit | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const checkRes = await pool.query(
    `SELECT "id" FROM "TrainingSplit" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [splitId, client.id]
  )

  if (!checkRes.rows[0]) return null

  const res = await pool.query<TrainingSplit>(
    `UPDATE "TrainingSplit" SET "status" = $1::"PlanStatus", "updatedAt" = NOW() WHERE "id" = $2 RETURNING *`,
    [status, splitId]
  )
  return (res.rows[0] as TrainingSplit) ?? null
}
