import { pool, generateId } from "@/lib/db"
import { PlanStatus } from "@/lib/db/enums"
import type {
  SessionLogEntryInput,
  SessionLogInput,
} from "@/lib/validations/session-log"

async function getOwnedClient(clientId: string, trainerProfileId: string) {
  const res = await pool.query(
    `SELECT "id", "fullName" FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [clientId, trainerProfileId]
  )
  return (res.rows[0] as { id: string; fullName: string | null } | undefined) ?? null
}

async function fetchActiveSplitWithDays(clientId: string) {
  const splitRes = await pool.query(
    `SELECT * FROM "TrainingSplit" WHERE "clientId" = $1 AND "status" = $2::"PlanStatus" ORDER BY "createdAt" DESC LIMIT 1`,
    [clientId, PlanStatus.ACTIVE]
  )
  const split = splitRes.rows[0] as any & { id: string } | undefined
  if (!split) return null
  const daysRes = await pool.query(
    `SELECT * FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC`,
    [split.id]
  )
  const days = daysRes.rows as Array<any & { id: string }>
  const daysWithExercises: Array<any & { exercises: any[] }> = []
  for (const day of days) {
    const exRes = await pool.query(
      `SELECT * FROM "SplitDayExercise" WHERE "splitDayId" = $1 ORDER BY "order" ASC`,
      [day.id]
    )
    daysWithExercises.push({ ...day, exercises: exRes.rows as any[] })
  }
  return { ...split, days: daysWithExercises }
}

export async function getSessionLogPageData(
  clientId: string,
  trainerProfileId: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const activeSplit = await fetchActiveSplitWithDays(client.id)

  return { client, activeSplit }
}

export async function createSessionLogs(
  clientId: string,
  trainerProfileId: string,
  data: SessionLogInput
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const splitDayRes = await pool.query(
    `SELECT tsd."id" AS "dayId", ts."clientId" AS "clientId"
     FROM "TrainingSplitDay" tsd
     JOIN "TrainingSplit" ts ON tsd."splitId" = ts."id"
     WHERE tsd."id" = $1 AND ts."clientId" = $2 LIMIT 1`,
    [data.splitDayId, client.id]
  )
  if (!splitDayRes.rowCount || splitDayRes.rowCount === 0) return null

  const exercisesRes = await pool.query(
    `SELECT "id" FROM "SplitDayExercise" WHERE "splitDayId" = $1`,
    [data.splitDayId]
  )
  const exerciseIds = new Set((exercisesRes.rows as Array<{ id: string }>).map((e) => e.id))
  const validEntries = data.entries.filter((entry) =>
    exerciseIds.has(entry.splitDayExerciseId)
  )
  if (validEntries.length === 0) return null

  const date = new Date(`${data.date}T00:00:00Z`)

  let count = 0
  for (const entry of validEntries as SessionLogEntryInput[]) {
    const id = generateId()
    const actualSets =
      entry.actualSets === "" || entry.actualSets === undefined || entry.actualSets === null
        ? null
        : (entry.actualSets as number)
    const actualReps =
      entry.actualReps === "" || entry.actualReps === undefined || entry.actualReps === null
        ? null
        : (entry.actualReps as number)
    const actualWeightKg =
      entry.actualWeightKg === "" || entry.actualWeightKg === undefined || entry.actualWeightKg === null
        ? null
        : (entry.actualWeightKg as number)
    const rpe =
      entry.rpe === "" || entry.rpe === undefined || entry.rpe === null
        ? null
        : (entry.rpe as number)
    const notes = entry.notes?.trim() || null

    await pool.query(
      `INSERT INTO "ExerciseLog" ("id", "splitDayExerciseId", "clientId", "date", "actualSets", "actualReps", "actualWeightKg", "rpe", "notes", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [id, entry.splitDayExerciseId, client.id, date, actualSets, actualReps, actualWeightKg, rpe, notes]
    )
    count++
  }

  return { count }
}
