import { pool } from "@/lib/db"
import { ScheduleMode } from "@/lib/db/enums"
import { withCache } from "@/lib/cache"
import { parseSetData } from "@/lib/calculations/session-progress"
import {
  addDaysToDateKey,
  buildFixedBoard,
  buildSequentialBoard,
  summarizeBoard,
  toDateKey,
  weekStartDate,
  type BoardEntry,
  type BoardSplitDay,
  type WeekSummary,
} from "@/lib/calculations/week-schedule"

export interface ClientDayExercise {
  id: string
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  targetWeightKg: number | null
  restSeconds: number | null
  notes: string | null
  youtubeUrl: string | null
  videoUrl: string | null
  setData: Array<{ weightKg: number | null; reps: number | null }> | null
  actualSets: number | null
  actualReps: number | null
  actualWeightKg: number | null
  rpe: number | null
  notes_actual: string | null
  done: boolean
}

export interface DayDetail {
  dayId: string
  dayNumber: number
  focus: string
  customFocus: string | null
  status: BoardEntry["status"]
  dateKey: string | null
  weekday: string | null
  exercises: ClientDayExercise[]
  totalVolume: number | null
}

export interface ClientWeekBoard {
  mode: ScheduleMode
  weekStartDay: string
  board: BoardEntry[]
  summary: WeekSummary
  activeDayId: string | null
  rangeStartKey: string | null
  rangeEndKey: string | null
}

const EMPTY_BOARD: ClientWeekBoard = {
  mode: ScheduleMode.FIXED_WEEKDAYS,
  weekStartDay: "SAT",
  board: [],
  summary: { planned: 0, done: 0, streak: 0 },
  activeDayId: null,
  rangeStartKey: null,
  rangeEndKey: null,
}

export function getClientWeekBoard(clientId: string) {
  return withCache(
    () => getClientWeekBoardUncached(clientId),
    ["client-week-board", clientId],
    [`client:${clientId}:workout`],
    60
  )()
}

export async function getClientWeekBoardUncached(
  clientId: string
): Promise<ClientWeekBoard> {
  const clientRes = await pool.query(
    `SELECT c."id", tp."weekStartDay"
     FROM "Client" c
     LEFT JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
     WHERE c."id" = $1 LIMIT 1`,
    [clientId]
  )
  const clientRow = clientRes.rows[0] as { id: string; weekStartDay: string | null } | undefined
  if (!clientRow) return EMPTY_BOARD

  const splitRes = await pool.query(
    `SELECT "id", "scheduleMode" FROM "TrainingSplit" WHERE "clientId" = $1 AND "status" = 'ACTIVE'::"PlanStatus" ORDER BY "createdAt" DESC LIMIT 1`,
    [clientId]
  )
  const split = splitRes.rows[0] as { id: string; scheduleMode: string } | undefined
  if (!split) return EMPTY_BOARD

  const daysRes = await pool.query(
    `SELECT "id", "dayNumber", "focus", "customFocus", "weekday" FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC`,
    [split.id]
  )
  const days = daysRes.rows as BoardSplitDay[]
  if (days.length === 0) return EMPTY_BOARD

  const weekStartDay = (clientRow.weekStartDay ?? "SAT") as string
  const today = new Date()

  const exerciseCountByDayId = new Map<string, number>()
  if (days.length > 0) {
    const dayIds = days.map((day) => day.id)
    const countsRes = await pool.query(
      `SELECT "splitDayId", COUNT(*)::int AS "count" FROM "SplitDayExercise" WHERE "splitDayId" = ANY($1::text[]) GROUP BY "splitDayId"`,
      [dayIds]
    )
    for (const row of countsRes.rows as Array<{ splitDayId: string; count: number }>) {
      exerciseCountByDayId.set(row.splitDayId, row.count)
    }
  }

  function withExerciseCounts(board: BoardEntry[]): BoardEntry[] {
    return board.map((entry) => ({
      ...entry,
      exerciseCount:
        entry.dayId != null
          ? (exerciseCountByDayId.get(entry.dayId) ?? 0)
          : null,
    }))
  }

  if (split.scheduleMode === ScheduleMode.SEQUENTIAL) {
    const exerciseToDay = new Map<string, string>()
    const dayIds = days.map((d) => d.id)
    if (dayIds.length > 0) {
      const exRes = await pool.query(
        `SELECT "id", "splitDayId" FROM "SplitDayExercise" WHERE "splitDayId" = ANY($1::text[])`,
        [dayIds]
      )
      for (const row of exRes.rows as Array<{ id: string; splitDayId: string }>) {
        exerciseToDay.set(row.id, row.splitDayId)
      }
    }

    const logsRes = await pool.query(
      `SELECT DISTINCT "splitDayExerciseId" FROM "ExerciseLog" WHERE "clientId" = $1`,
      [clientId]
    )
    const logs = logsRes.rows as Array<{ splitDayExerciseId: string }>

    const loggedByDayId: Record<string, boolean> = {}
    for (const log of logs) {
      const dayId = exerciseToDay.get(log.splitDayExerciseId)
      if (dayId) loggedByDayId[dayId] = true
    }

    const board = withExerciseCounts(
      buildSequentialBoard(days, loggedByDayId, today)
    )
    return {
      mode: ScheduleMode.SEQUENTIAL,
      weekStartDay,
      board,
      summary: summarizeBoard(board, ScheduleMode.SEQUENTIAL),
      activeDayId:
        board.find((entry) => entry.status === "CURRENT")?.dayId ?? null,
      rangeStartKey: null,
      rangeEndKey: null,
    }
  }

  // FIXED_WEEKDAYS
  const rangeStartDate = weekStartDate(weekStartDay as unknown as import("@/lib/db/enums").WeekStartDay, today)
  const rangeStartKey = toDateKey(rangeStartDate)
  const rangeEndKey = addDaysToDateKey(rangeStartKey, 7)

  const logsRes = await pool.query(
    `SELECT "date" FROM "ExerciseLog" WHERE "clientId" = $1 AND "date" >= $2 AND "date" < $3`,
    [clientId, new Date(`${rangeStartKey}T00:00:00`), new Date(`${rangeEndKey}T00:00:00`)]
  )
  const logs = logsRes.rows as Array<{ date: Date }>

  const loggedDates = new Set(logs.map((log) => toDateKey(new Date(log.date))))

  const board = withExerciseCounts(
    buildFixedBoard(days, weekStartDay as unknown as import("@/lib/db/enums").WeekStartDay, today, loggedDates)
  )

  const todayEntry = board.find((entry) => entry.status === "TODAY")
  const upcomingEntry = board.find((entry) => entry.status === "UPCOMING")

  return {
    mode: ScheduleMode.FIXED_WEEKDAYS,
    weekStartDay,
    board,
    summary: summarizeBoard(board, ScheduleMode.FIXED_WEEKDAYS),
    activeDayId: todayEntry?.dayId ?? upcomingEntry?.dayId ?? null,
    rangeStartKey,
    rangeEndKey,
  }
}

function volumeOf(
  sets: number | null,
  reps: number | null,
  weight: number | null
): number {
  if (sets == null || reps == null || weight == null) return 0
  return sets * reps * weight
}

export async function getDayDetail(
  clientId: string,
  dayId: string
): Promise<DayDetail | null> {
  const [boardData, splitRes] = await Promise.all([
    getClientWeekBoardUncached(clientId),
    pool.query(
      `SELECT "id" FROM "TrainingSplit" WHERE "clientId" = $1 AND "status" = 'ACTIVE'::"PlanStatus" LIMIT 1`,
      [clientId]
    ),
  ])

  const splitRow = splitRes.rows[0] as { id: string } | undefined
  if (!splitRow) return null

  const dayRes = await pool.query(
    `SELECT * FROM "TrainingSplitDay" WHERE "id" = $1 AND "splitId" = $2 LIMIT 1`,
    [dayId, splitRow.id]
  )
  const day = dayRes.rows[0] as
    | {
        id: string
        dayNumber: number
        focus: string
        customFocus: string | null
        weekday: string | null
      }
    | undefined
  if (!day) return null

  const exercisesRes = await pool.query(
    `SELECT sde."id", sde."splitDayId", sde."order", sde."exerciseId", sde."exerciseName", sde."targetSets", sde."targetReps", sde."targetWeightKg", sde."restSeconds", sde."notes", sde."videoUrl",
            e."name" AS "exercise_name", e."youtubeUrl" AS "exercise_youtubeUrl"
     FROM "SplitDayExercise" sde
     LEFT JOIN "Exercise" e ON e."id" = sde."exerciseId"
     WHERE sde."splitDayId" = $1
     ORDER BY sde."order" ASC`,
    [day.id]
  )
  const exercises = exercisesRes.rows as Array<{
    id: string
    splitDayId: string
    order: number
    exerciseId: string | null
    exerciseName: string
    targetSets: number | null
    targetReps: number | null
    targetWeightKg: number | null
    restSeconds: number | null
    notes: string | null
    videoUrl: string | null
    exercise_name: string | null
    exercise_youtubeUrl: string | null
  }>

  const entry = boardData.board.find((item) => item.dayId === dayId) ?? null
  const status = entry?.status ?? "UPCOMING"

  let logsRes = await pool.query(
    `SELECT * FROM "ExerciseLog" WHERE "clientId" = $1 AND "splitDayExerciseId" = ANY($2::text[]) ORDER BY "date" DESC`,
    [clientId, exercises.map((ex) => ex.id)]
  )
  let logs = logsRes.rows as Array<{
    id: string
    splitDayExerciseId: string
    clientId: string
    date: Date
    actualSets: number | null
    actualReps: number | null
    actualWeightKg: number | null
    rpe: number | null
    notes: string | null
    setData: unknown | null
  }>

  if (entry?.dateKey && boardData.mode === ScheduleMode.FIXED_WEEKDAYS) {
    const dayStart = new Date(`${entry.dateKey}T00:00:00`)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    logs = logs.filter(
      (log) => log.date >= dayStart && log.date < dayEnd
    )
  }

  const latestByExercise = new Map<string, (typeof logs)[number]>()
  for (const log of logs) {
    if (!latestByExercise.has(log.splitDayExerciseId)) {
      latestByExercise.set(log.splitDayExerciseId, log)
    }
  }

  let totalVolume = 0
  const clientExercises: ClientDayExercise[] = exercises.map((ex) => {
    const log = latestByExercise.get(ex.id) ?? null
    if (log) {
      totalVolume += volumeOf(
        log.actualSets,
        log.actualReps,
        log.actualWeightKg
      )
    }
    return {
      id: ex.id,
      exerciseName: ex.exerciseName || ex.exercise_name || "Exercise",
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.targetWeightKg,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
      youtubeUrl: ex.exercise_youtubeUrl ?? null,
      videoUrl: ex.videoUrl ?? null,
      setData: parseSetData(log?.setData),
      actualSets: log?.actualSets ?? null,
      actualReps: log?.actualReps ?? null,
      actualWeightKg: log?.actualWeightKg ?? null,
      rpe: log?.rpe ?? null,
      notes_actual: log?.notes ?? null,
      done: Boolean(log),
    }
  })

  return {
    dayId: day.id,
    dayNumber: day.dayNumber,
    focus: day.focus,
    customFocus: day.customFocus,
    status,
    dateKey: entry?.dateKey ?? null,
    weekday: entry?.weekday ?? day.weekday ?? null,
    exercises: clientExercises,
    totalVolume: totalVolume > 0 ? totalVolume : null,
  }
}
