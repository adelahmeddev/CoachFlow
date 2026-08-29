import { pool, generateId, withTransaction } from "@/lib/db"
import { PlanStatus, ScheduleMode, TrainingDayFocus } from "@/lib/db/enums"
import type { BodyComposition, DailyLog, ProgressReview, Subscription } from "@/lib/db/types"
import { withCache } from "@/lib/cache"
import { parseSetData } from "@/lib/calculations/session-progress"
import { getClientWeekBoard, getDayDetail } from "@/server/services/week.service"

export interface TodayWorkoutResult {
  day: {
    id: string
    dayName: string
    focus: TrainingDayFocus | string
    customFocus: string | null
  } | null
  exercises: Array<{
    id: string
    exerciseName: string
    sets: number
    reps: number
    targetWeight: number | null
    restSeconds: number | null
    notes: string | null
    youtubeUrl: string | null
    videoUrl: string | null
    log: {
      actualSets: number | null
      actualReps: number | null
      actualWeightKg: number | null
      rpe: number | null
      notes: string | null
      setData: Array<{ weightKg: number | null; reps: number | null }> | null
    } | null
  }>
  status: "TODAY" | "CURRENT" | "REST"
  nextTrainingDay: { focus: string; customFocus: string | null } | null
}

export async function getClientHomeData(clientId: string) {
  const clientRes = await pool.query(`SELECT * FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])
  if (!clientRes.rowCount || clientRes.rowCount === 0) return null
  const client = clientRes.rows[0] as {
    id: string
    fullName: string | null
    phone: string | null
    email: string | null
    goal: string | null
    status: string
    userId: string | null
  }

  const [dailyLogsRes, progressReviewsRes, subscriptionsRes, bodyCompRes, exerciseLogsRes] = await Promise.all([
    pool.query(`SELECT * FROM "DailyLog" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 1`, [clientId]),
    pool.query(`SELECT * FROM "ProgressReview" WHERE "clientId" = $1 ORDER BY "reviewDate" DESC`, [clientId]),
    pool.query(`SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [clientId]),
    pool.query(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" ASC`, [clientId]),
    pool.query(
      `SELECT el.*, sde."exerciseName", sde."targetSets", sde."targetReps", sde."targetWeightKg"
       FROM "ExerciseLog" el
       JOIN "SplitDayExercise" sde ON el."splitDayExerciseId" = sde."id"
       JOIN "TrainingSplitDay" tsd ON sde."splitDayId" = tsd."id"
       JOIN "TrainingSplit" ts ON tsd."splitId" = ts."id"
       WHERE ts."clientId" = $1
       ORDER BY el."date" DESC`,
      [clientId]
    ),
  ])

  const [todayWorkout, weekBoard] = await Promise.all([
    getTodayWorkout(clientId),
    getClientWeekBoard(clientId),
  ])

  const bodyCompositions = bodyCompRes.rows as unknown as BodyComposition[]
   const exerciseLogs = exerciseLogsRes.rows as { id: string; date: Date; exerciseName: string; targetSets: number; targetReps: number; targetWeightKg: number | null }[]
  const progressReviews = progressReviewsRes.rows as unknown as ProgressReview[]

  const latestBodyComposition = bodyCompositions[bodyCompositions.length - 1] ?? null
  const baselineBodyComposition = bodyCompositions[0] ?? null
  const currentWeight = latestBodyComposition?.weightKg ?? null
  const baselineWeight = baselineBodyComposition?.weightKg ?? null
  const weightChange =
    currentWeight !== null && baselineWeight !== null && baselineBodyComposition?.id !== latestBodyComposition?.id
      ? +(currentWeight - baselineWeight).toFixed(1)
      : null
  const latestAdherence =
    progressReviews[0]?.adherencePct != null
      ? `${progressReviews[0].adherencePct}%`
      : null

  return {
    client: {
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      goal: client.goal,
      status: client.status,
      streak: dailyLogsRes.rows.length > 0 ? 1 : 0,
    },
    todayWorkout,
    week: {
      summary: weekBoard.summary,
      entries: weekBoard.board.slice(0, 7).map((entry) => ({
        dayNumber: entry.dayNumber,
        focus: entry.focus,
        customFocus: entry.customFocus,
        status: entry.status,
        done: entry.done,
      })),
    },
    latestDailyLog: (dailyLogsRes.rows[0] as unknown as DailyLog) ?? null,
    latestTrainerNotes: (progressReviewsRes.rows[0] as { trainerNotes: string | null } | undefined)?.trainerNotes ?? null,
    subscription: (subscriptionsRes.rows[0] as unknown as Subscription) ?? null,
    progress: {
      currentWeight,
      weightChange,
      totalWorkouts: exerciseLogs.length,
      latestAdherence,
      sessionHistory: exerciseLogs.slice(0, 20),
    },
  }
}

export function getTodayWorkout(clientId: string) {
  return withCache(
    () => getTodayWorkoutUncached(clientId),
    ["client-today-workout", clientId],
    [`client:${clientId}:workout`],
    120
  )()
}

async function getTodayWorkoutUncached(
  clientId: string
): Promise<TodayWorkoutResult> {
  const boardData = await getClientWeekBoard(clientId)

  const activeEntry =
    boardData.board.find((entry) => entry.status === "TODAY") ??
    boardData.board.find((entry) => entry.status === "CURRENT") ??
    null

  if (!activeEntry?.dayId) {
    const nextTraining = boardData.board.find(
      (entry) => entry.status === "UPCOMING" && entry.dayId !== null
    )
    return {
      day: null,
      exercises: [],
      status: "REST",
      nextTrainingDay: nextTraining
        ? { focus: nextTraining.focus, customFocus: nextTraining.customFocus }
        : null,
    }
  }

  const dayRes = await pool.query(
    `SELECT tsd.* FROM "TrainingSplitDay" tsd
     JOIN "TrainingSplit" ts ON tsd."splitId" = ts."id"
     WHERE tsd."id" = $1 AND ts."clientId" = $2 AND ts."status" = $3::"PlanStatus" LIMIT 1`,
    [activeEntry.dayId, clientId, PlanStatus.ACTIVE]
  )

  if (!dayRes.rowCount || dayRes.rowCount === 0) {
    return {
      day: null,
      exercises: [],
      status: activeEntry.status === "CURRENT" ? "CURRENT" : "TODAY",
      nextTrainingDay: null,
    }
  }

  const todayDay = dayRes.rows[0] as {
    id: string
    dayNumber: number
    focus: string
    customFocus: string | null
  }

  const exRes = await pool.query(
    `SELECT sde.*, e."name" AS "ex_name", e."youtubeUrl" AS "ex_youtube"
     FROM "SplitDayExercise" sde
     LEFT JOIN "Exercise" e ON sde."exerciseId" = e."id"
     WHERE sde."splitDayId" = $1 ORDER BY sde."order" ASC`,
    [todayDay.id]
  )

  const exercises = (exRes.rows as Array<Record<string, unknown>>).map((ex) => ({
    id: ex.id as string,
    exerciseName: (ex.exerciseName as string) || (ex.ex_name as string) || "Exercise",
    sets: (ex.targetSets as number | null) ?? 3,
    reps: (ex.targetReps as number | null) ?? 10,
    targetWeight: (ex.targetWeightKg as number | null) ?? null,
    restSeconds: (ex.restSeconds as number | null) ?? null,
    notes: (ex.notes as string | null) ?? null,
    youtubeUrl: (ex.ex_youtube as string | null) ?? null,
    videoUrl: (ex.videoUrl as string | null) ?? null,
    log: null as {
      actualSets: number | null
      actualReps: number | null
      actualWeightKg: number | null
      rpe: number | null
      notes: string | null
      setData: Array<{ weightKg: number | null; reps: number | null }> | null
    } | null,
  }))

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  let todaysLogs: Array<Record<string, unknown>> = []
  if (exercises.length > 0) {
    const exIds = exercises.map((ex) => ex.id)
    const placeholders = exIds.map((_, i) => `$${i + 4}`).join(",")
    const sql = `SELECT * FROM "ExerciseLog" WHERE "clientId" = $1 AND "date" >= $2 AND "date" < $3 AND "splitDayExerciseId" IN (${placeholders}) ORDER BY "createdAt" DESC`
    const res = await pool.query(sql, [clientId, dayStart, dayEnd, ...exIds])
    todaysLogs = res.rows as Array<Record<string, unknown>>
  }

  for (const log of todaysLogs) {
    const exercise = exercises.find((ex) => ex.id === log.splitDayExerciseId)
    if (exercise && !exercise.log) {
      exercise.log = {
        actualSets: log.actualSets as number | null,
        actualReps: log.actualReps as number | null,
        actualWeightKg: log.actualWeightKg as number | null,
        rpe: log.rpe as number | null,
        notes: log.notes as string | null,
        setData: parseSetData(log.setData),
      }
    }
  }

  return {
    day: {
      id: todayDay.id,
      dayName: `Day ${todayDay.dayNumber}`,
      focus: todayDay.focus,
      customFocus: todayDay.customFocus,
    },
    exercises,
    status:
      boardData.mode === ScheduleMode.SEQUENTIAL || activeEntry.status === "CURRENT"
        ? "CURRENT"
        : "TODAY",
    nextTrainingDay: null,
  }
}

export interface SessionLastTime {
  weightKg: number | null
  reps: number | null
  date: string
}

export async function getSessionWorkout(
  clientId: string,
  dayId?: string
): Promise<{
  workout: TodayWorkoutResult
  lastTime: Record<string, SessionLastTime>
}> {
  let workout: TodayWorkoutResult | null = null

  if (dayId) {
    const detail = await getDayDetail(clientId, dayId)
    if (detail && detail.exercises.length > 0 && detail.status !== "REST") {
      workout = {
        day: {
          id: detail.dayId,
          dayName: `Day ${detail.dayNumber}`,
          focus: detail.focus,
          customFocus: detail.customFocus,
        },
        exercises: detail.exercises.map((ex) => ({
          id: ex.id,
          exerciseName: ex.exerciseName,
          sets: ex.targetSets ?? 3,
          reps: ex.targetReps ?? 10,
          targetWeight: ex.targetWeightKg ?? null,
          restSeconds: ex.restSeconds,
          notes: ex.notes,
          youtubeUrl: ex.youtubeUrl,
          videoUrl: ex.videoUrl,
          log:
            ex.actualSets != null ||
            ex.actualReps != null ||
            ex.actualWeightKg != null
              ? {
                  actualSets: ex.actualSets,
                  actualReps: ex.actualReps,
                  actualWeightKg: ex.actualWeightKg,
                  rpe: ex.rpe ?? null,
                  notes: ex.notes_actual ?? null,
                  setData: ex.setData,
                }
              : null,
        })),
        status: detail.status === "CURRENT" ? "CURRENT" : "TODAY",
        nextTrainingDay: null,
      }
    }
  }

  if (!workout) {
    workout = await getTodayWorkout(clientId)
  }

  if (!workout.day || workout.exercises.length === 0) {
    return { workout, lastTime: {} }
  }

  const exIds = workout.exercises.map((ex) => ex.id)
  const placeholders = exIds.map((_, i) => `$${i + 1}`).join(",")
  const rowsRes = await pool.query(`SELECT "id", "exerciseId" FROM "SplitDayExercise" WHERE "id" IN (${placeholders})`, exIds)
  const sdeToExercise = new Map<string, string>()
  for (const row of rowsRes.rows as Array<{ id: string; exerciseId: string | null }>) {
    if (row.exerciseId) sdeToExercise.set(row.id, row.exerciseId)
  }
  const masterIds = [...new Set(sdeToExercise.values())]
  const lastTime: Record<string, SessionLastTime> = {}

  if (masterIds.length > 0) {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const masterPlaceholders = masterIds.map((_, i) => `$${i + 3}`).join(",")
    const logsRes = await pool.query(
      `SELECT el."date", el."actualWeightKg", el."actualReps", sde."exerciseId" AS "masterId"
       FROM "ExerciseLog" el
       JOIN "SplitDayExercise" sde ON el."splitDayExerciseId" = sde."id"
       WHERE el."clientId" = $1 AND el."date" < $2 AND sde."exerciseId" IN (${masterPlaceholders})
       ORDER BY el."date" DESC LIMIT 200`,
      [clientId, dayStart, ...masterIds]
    )

    const latestByMaster = new Map<string, Record<string, unknown>>()
    for (const log of logsRes.rows as Array<Record<string, unknown>>) {
      const key = log.masterId as string
      if (!key || latestByMaster.has(key)) continue
      latestByMaster.set(key, log)
    }

    for (const ex of workout.exercises) {
      const masterId = sdeToExercise.get(ex.id)
      const log = masterId ? (latestByMaster.get(masterId) as { actualWeightKg: number | null; actualReps: number | null; date: Date } | undefined) : undefined
      if (log && (log.actualWeightKg != null || log.actualReps != null)) {
        lastTime[ex.id] = {
          weightKg: log.actualWeightKg,
          reps: log.actualReps,
          date: (log.date as Date).toISOString(),
        }
      }
    }
  }

  return { workout, lastTime }
}

export async function getClientProgressData(clientId: string) {
  const [clientRes, dailyLogsRes, exerciseLogsRes, bodyCompositionsRes, progressReviewsRes, subscriptionsRes] = await Promise.all([
    pool.query(`SELECT * FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId]),
    pool.query(`SELECT * FROM "DailyLog" WHERE "clientId" = $1 ORDER BY "date" ASC LIMIT 90`, [clientId]),
    pool.query(
      `SELECT el."id", el."date", el."actualSets", el."actualReps", el."actualWeightKg", el."rpe", el."notes",
              sde."id" AS "sde_id", sde."exerciseName" AS "sde_exerciseName", sde."targetSets" AS "sde_targetSets", sde."targetReps" AS "sde_targetReps", sde."targetWeightKg" AS "sde_targetWeightKg",
              tsd."dayNumber" AS "tsd_dayNumber", tsd."focus" AS "tsd_focus", tsd."customFocus" AS "tsd_customFocus"
       FROM "ExerciseLog" el
       JOIN "SplitDayExercise" sde ON el."splitDayExerciseId" = sde."id"
       JOIN "TrainingSplitDay" tsd ON sde."splitDayId" = tsd."id"
       WHERE el."clientId" = $1 ORDER BY el."date" DESC`,
      [clientId]
    ),
    pool.query(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" ASC`, [clientId]),
    pool.query(`SELECT * FROM "ProgressReview" WHERE "clientId" = $1 ORDER BY "reviewDate" DESC`, [clientId]),
    pool.query(`SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [clientId]),
  ])

  if (!clientRes.rowCount || clientRes.rowCount === 0) return null

  const clientRow = clientRes.rows[0] as Record<string, unknown>
  const bodyCompositions = bodyCompositionsRes.rows as unknown as BodyComposition[]
  const progressReviews = progressReviewsRes.rows as unknown as ProgressReview[]
  const subscriptions = subscriptionsRes.rows as unknown as Subscription[]
  const dailyLogs = dailyLogsRes.rows as unknown as DailyLog[]

  const exerciseLogs = (exerciseLogsRes.rows as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    date: r.date as Date,
    actualSets: r.actualSets as number | null,
    actualReps: r.actualReps as number | null,
    actualWeightKg: r.actualWeightKg as number | null,
    rpe: r.rpe as number | null,
    notes: r.notes as string | null,
    splitDayExercise: {
      id: r.sde_id as string,
      exerciseName: r.sde_exerciseName as string,
      targetSets: r.sde_targetSets as number | null,
      targetReps: r.sde_targetReps as number | null,
      targetWeightKg: r.sde_targetWeightKg as number | null,
      splitDay: {
        dayNumber: r.tsd_dayNumber as number,
        focus: r.tsd_focus as string,
        customFocus: r.tsd_customFocus as string | null,
      },
    },
  }))

  // Build per-exercise strength series for the chart
  const byExercise = new Map<
    string,
    { name: string; points: { date: string; weightKg: number }[] }
  >()
  for (const log of [...exerciseLogs].reverse()) {
    if (log.actualWeightKg == null) continue
    const key = log.splitDayExercise.id
    const entry = byExercise.get(key) ?? {
      name: log.splitDayExercise.exerciseName,
      points: [],
    }
    entry.points.push({
      date: (log.date as Date).toISOString(),
      weightKg: log.actualWeightKg,
    })
    byExercise.set(key, entry)
  }
  const strengthSeries = [...byExercise.entries()].map(
    ([exerciseId, entry]) => ({ exerciseId, name: entry.name, points: entry.points })
  )

  const clientWithRelations = {
    ...clientRow,
    bodyCompositions,
    progressReviews,
    subscriptions,
  } as unknown as Record<string, unknown> & { bodyCompositions: BodyComposition[]; progressReviews: ProgressReview[]; subscriptions: Subscription[] }

  return {
    client: clientWithRelations as unknown as typeof clientRow & { bodyCompositions: BodyComposition[]; progressReviews: ProgressReview[]; subscriptions: Subscription[] },
    dailyLogs,
    workoutCount: exerciseLogs.length,
    exerciseLogs: exerciseLogs as unknown as Array<{ id: string; date: Date; actualSets: number | null; actualReps: number | null; actualWeightKg: number | null; rpe: number | null; notes: string | null; splitDayExercise: { id: string; exerciseName: string; targetSets: number | null; targetReps: number | null; targetWeightKg: number | null; splitDay: { dayNumber: number; focus: string; customFocus: string | null } } }>,
    strengthSeries,
    bodyCompositions,
    progressReviews,
  }
}

export async function getClientProfile(clientId: string): Promise<((import("@/lib/db/types").Client & { user: import("@/lib/db/types").User | null; subscriptions: Subscription[]; bodyCompositions: BodyComposition[] }) | null)> {
  const clientRes = await pool.query<import("@/lib/db/types").Client>(`SELECT * FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])
  if (!clientRes.rowCount || clientRes.rowCount === 0) return null
  const client = clientRes.rows[0] as import("@/lib/db/types").Client
  const [userRes, subscriptionsRes, bodyCompositionsRes] = await Promise.all([
    client.userId ? pool.query<import("@/lib/db/types").User>(`SELECT * FROM "User" WHERE "id" = $1 LIMIT 1`, [client.userId]) : Promise.resolve({ rows: [] as import("@/lib/db/types").User[], rowCount: 0 } as unknown as { rows: import("@/lib/db/types").User[] }),
    pool.query<Subscription>(`SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [clientId]),
    pool.query<BodyComposition>(`SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 1`, [clientId]),
  ])
  return {
    ...client,
    user: (userRes as { rows: import("@/lib/db/types").User[] }).rows[0] ?? null,
    subscriptions: (subscriptionsRes as { rows: Subscription[] }).rows,
    bodyCompositions: (bodyCompositionsRes as { rows: BodyComposition[] }).rows,
  } as import("@/lib/db/types").Client & { user: import("@/lib/db/types").User | null; subscriptions: Subscription[]; bodyCompositions: BodyComposition[] }
}

export async function saveWorkoutSession(
  clientId: string,
  data: {
    exerciseLogs: Array<{
      splitDayExerciseId: string
      actualSets: number
      actualReps: number
      actualWeightKg: number
      rpe?: number
      notes?: string
    }>
    dailyLog?: {
      weightKg?: number
      sleepHours?: number
      waterLiters?: number
      energyLevel?: number
      moodLevel?: number
      nutritionCompliant?: boolean
      notes?: string
    }
  }
) {
  return await withTransaction(async (tx) => {
    for (const log of data.exerciseLogs) {
      const id = generateId()
      const now = new Date()
      await tx.query(
        `INSERT INTO "ExerciseLog" ("id", "splitDayExerciseId", "clientId", "date", "actualSets", "actualReps", "actualWeightKg", "rpe", "notes", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
        [id, log.splitDayExerciseId, clientId, new Date(), log.actualSets, log.actualReps, log.actualWeightKg, log.rpe ?? null, log.notes ?? null, now]
      )
    }

    if (data.dailyLog) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

      const existingRes = await tx.query(
        `SELECT "id" FROM "DailyLog" WHERE "clientId" = $1 AND "date" >= $2 AND "date" < $3 LIMIT 1`,
        [clientId, today, tomorrow]
      )

      const payload = {
        weightKg: data.dailyLog.weightKg ?? null,
        sleepHours: data.dailyLog.sleepHours ?? null,
        waterLiters: data.dailyLog.waterLiters ?? null,
        energyLevel: data.dailyLog.energyLevel ?? null,
        moodLevel: data.dailyLog.moodLevel ?? null,
        nutritionCompliant: data.dailyLog.nutritionCompliant ?? null,
        notes: data.dailyLog.notes ?? null,
      }

      if (existingRes.rowCount && existingRes.rowCount > 0) {
        const existingId = (existingRes.rows[0] as { id: string }).id
        await tx.query(
          `UPDATE "DailyLog" SET "weightKg" = $1, "sleepHours" = $2, "waterLiters" = $3, "energyLevel" = $4, "moodLevel" = $5, "nutritionCompliant" = $6, "notes" = $7, "updatedAt" = NOW() WHERE "id" = $8`,
          [payload.weightKg, payload.sleepHours, payload.waterLiters, payload.energyLevel, payload.moodLevel, payload.nutritionCompliant, payload.notes, existingId]
        )
      } else {
        const id = generateId()
        const now = new Date()
        await tx.query(
          `INSERT INTO "DailyLog" ("id", "clientId", "date", "weightKg", "sleepHours", "waterLiters", "energyLevel", "moodLevel", "nutritionCompliant", "notes", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
          [id, clientId, today, payload.weightKg, payload.sleepHours, payload.waterLiters, payload.energyLevel, payload.moodLevel, payload.nutritionCompliant, payload.notes, now]
        )
      }
    }
  })
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
  return await saveWorkoutSession(clientId, {
    dailyLog: data,
    exerciseLogs: [],
  })
}
