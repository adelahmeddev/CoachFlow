import { pool, generateId } from "@/lib/db"
import { PlanStatus, type TrainingDayFocus } from "@/lib/db/enums"
import { withCache } from "@/lib/cache"
import type {
  ProgressReviewInput,
  WorkoutLogInput,
} from "@/lib/validations/progress"
import type { PgClient } from "@/lib/db"

export interface StrengthSeriesPoint {
  date: string
  weightKg: number
}

export interface ExerciseStrengthSeries {
  exerciseId: string
  name: string
  points: StrengthSeriesPoint[]
}

export function getCachedStrengthSeries(clientId: string) {
  return withCache(
    async (): Promise<ExerciseStrengthSeries[]> => {
      const res = await pool.query(
        `SELECT el."actualWeightKg", el."date", sde."id" AS "sde_id", sde."exerciseName" AS "sde_name"
         FROM "ExerciseLog" el
         JOIN "SplitDayExercise" sde ON el."splitDayExerciseId" = sde."id"
         WHERE el."clientId" = $1
         ORDER BY el."date" ASC`,
        [clientId]
      )

      const byExercise = new Map<
        string,
        { name: string; points: StrengthSeriesPoint[] }
      >()

      for (const row of res.rows as Array<{
        actualWeightKg: number | null
        date: Date
        sde_id: string
        sde_name: string
      }>) {
        if (row.actualWeightKg == null) continue
        const key = row.sde_id
        const entry = byExercise.get(key) ?? {
          name: row.sde_name,
          points: [],
        }
        entry.points.push({
          date: (row.date as Date).toISOString(),
          weightKg: row.actualWeightKg,
        })
        byExercise.set(key, entry)
      }

      return [...byExercise.entries()].map(([exerciseId, entry]) => ({
        exerciseId,
        name: entry.name,
        points: entry.points,
      }))
    },
    ["client-strength-series", clientId],
    [`client:${clientId}:progress`],
    120
  )()
}

function toDateOrNull(value: string | undefined): Date | null {
  if (!value) return null
  return new Date(`${value}T00:00:00Z`)
}

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
    daysWithExercises.push({ ...day, exercises: exRes.rows })
  }

  return { ...split, days: daysWithExercises }
}

export async function getClientProgressData(
  clientId: string,
  trainerProfileId: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const [
    bodyCompositionsRes,
    progressReviewsRes,
    workoutLogsRes,
    exerciseLogsRes,
    activeSplit,
  ] = await Promise.all([
    pool.query(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" ASC`, [client.id]),
    pool.query(`SELECT * FROM "ProgressReview" WHERE "clientId" = $1 ORDER BY "reviewDate" DESC`, [client.id]),
    pool.query(`SELECT * FROM "WorkoutLog" WHERE "clientId" = $1 ORDER BY "date" DESC`, [client.id]),
    pool.query(
      `SELECT 
        el."id", el."clientId", el."splitDayExerciseId", el."date", el."actualSets", el."actualReps", el."actualWeightKg", el."rpe", el."notes", el."setData", el."createdAt", el."updatedAt",
        sde."id" AS "sde_id", sde."splitDayId" AS "sde_splitDayId", sde."order" AS "sde_order", sde."exerciseId" AS "sde_exerciseId", sde."exerciseName" AS "sde_exerciseName", sde."targetSets" AS "sde_targetSets", sde."targetReps" AS "sde_targetReps", sde."targetWeightKg" AS "sde_targetWeightKg", sde."restSeconds" AS "sde_restSeconds", sde."notes" AS "sde_notes", sde."videoUrl" AS "sde_videoUrl",
        tsd."id" AS "tsd_id", tsd."splitId" AS "tsd_splitId", tsd."dayNumber" AS "tsd_dayNumber", tsd."focus" AS "tsd_focus", tsd."customFocus" AS "tsd_customFocus", tsd."weekday" AS "tsd_weekday", tsd."notes" AS "tsd_notes",
        ts."id" AS "ts_id", ts."splitType" AS "ts_splitType", ts."status" AS "ts_status"
       FROM "ExerciseLog" el
       JOIN "SplitDayExercise" sde ON el."splitDayExerciseId" = sde."id"
       JOIN "TrainingSplitDay" tsd ON sde."splitDayId" = tsd."id"
       JOIN "TrainingSplit" ts ON tsd."splitId" = ts."id"
       WHERE el."clientId" = $1
       ORDER BY el."date" DESC`,
      [client.id]
    ),
    fetchActiveSplitWithDays(client.id),
  ])

  const bodyCompositions = bodyCompositionsRes.rows as Array<any>
  const progressReviews = progressReviewsRes.rows as Array<any>
  const workoutLogs = workoutLogsRes.rows as Array<any>

  const exerciseLogs = (exerciseLogsRes.rows as Array<any>).map((row) => ({
    id: row.id as string,
    clientId: row.clientId as string,
    splitDayExerciseId: row.splitDayExerciseId as string,
    date: row.date as Date,
    actualSets: row.actualSets as number | null,
    actualReps: row.actualReps as number | null,
    actualWeightKg: row.actualWeightKg as number | null,
    rpe: row.rpe as number | null,
    notes: row.notes as string | null,
    setData: row.setData as unknown | null,
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    splitDayExercise: {
      id: row.sde_id as string,
      splitDayId: row.sde_splitDayId as string,
      order: row.sde_order as number,
      exerciseId: row.sde_exerciseId as string | null,
      exerciseName: row.sde_exerciseName as string,
      targetSets: row.sde_targetSets as number | null,
      targetReps: row.sde_targetReps as number | null,
      targetWeightKg: row.sde_targetWeightKg as number | null,
      restSeconds: row.sde_restSeconds as number | null,
      notes: row.sde_notes as string | null,
      videoUrl: row.sde_videoUrl as string | null,
      splitDay: {
        id: row.tsd_id as string,
        splitId: row.tsd_splitId as string,
        dayNumber: row.tsd_dayNumber as number,
        focus: row.tsd_focus as TrainingDayFocus,
        customFocus: row.tsd_customFocus as string | null,
        weekday: row.tsd_weekday as string | null,
        notes: row.tsd_notes as string | null,
        split: {
          id: row.ts_id as string,
          splitType: row.ts_splitType as string,
          status: row.ts_status as string,
        },
      },
    },
  }))

  const baseline = bodyCompositions[0] ?? null
  const latest =
    bodyCompositions.length > 0 ? bodyCompositions[bodyCompositions.length - 1] : null

  return {
    client,
    bodyCompositions,
    baseline,
    latest,
    progressReviews,
    workoutLogs,
    exerciseLogs,
    activeSplit,
  }
}

export async function createProgressReview(
  clientId: string,
  trainerProfileId: string,
  data: ProgressReviewInput
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const reviewDate = new Date(`${data.reviewDate}T00:00:00Z`)
  const adherencePct =
    data.adherencePct === "" || data.adherencePct === undefined
      ? null
      : (data.adherencePct as number)
  const energyLevel =
    data.energyLevel === "" || data.energyLevel === undefined
      ? null
      : (data.energyLevel as number)
  const trainerNotes = data.trainerNotes?.trim() || null

  const id = generateId()
  const res = await pool.query(
    `INSERT INTO "ProgressReview" ("id", "clientId", "reviewDate", "adherencePct", "energyLevel", "trainerNotes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [id, client.id, reviewDate, adherencePct, energyLevel, trainerNotes]
  )
  return res.rows[0] as any
}

export async function createWorkoutLog(
  clientId: string,
  trainerProfileId: string,
  data: WorkoutLogInput
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const date = new Date(`${data.date}T00:00:00Z`)
  const sets = data.sets === "" || data.sets === undefined ? null : (data.sets as number)
  const reps = data.reps === "" || data.reps === undefined ? null : (data.reps as number)
  const weightKg =
    data.weightKg === "" || data.weightKg === undefined
      ? null
      : (data.weightKg as number)
  const rpe = data.rpe === "" || data.rpe === undefined ? null : (data.rpe as number)
  const notes = data.notes?.trim() || null
  const exerciseName = data.exerciseName.trim()

  const id = generateId()
  const res = await pool.query(
    `INSERT INTO "WorkoutLog" ("id", "clientId", "date", "exerciseName", "sets", "reps", "weightKg", "rpe", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING *`,
    [id, client.id, date, exerciseName, sets, reps, weightKg, rpe, notes]
  )
  return res.rows[0] as any
}

export async function deleteWorkoutLog(
  clientId: string,
  trainerProfileId: string,
  logId: string
): Promise<boolean> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return false

  const logRes = await pool.query(
    `SELECT "id" FROM "WorkoutLog" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [logId, client.id]
  )

  if (!logRes.rowCount || logRes.rowCount === 0) return false

  await pool.query(`DELETE FROM "WorkoutLog" WHERE "id" = $1`, [logRes.rows[0].id])
  return true
}
