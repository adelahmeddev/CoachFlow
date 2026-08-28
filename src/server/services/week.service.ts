import { prisma } from "@/lib/prisma"
import { PlanStatus, ScheduleMode } from "@/generated/prisma/enums"
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
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      trainer: { select: { weekStartDay: true } },
      trainingSplits: {
        where: { status: PlanStatus.ACTIVE },
        take: 1,
        select: {
          id: true,
          scheduleMode: true,
          days: {
            orderBy: { dayNumber: "asc" as const },
            select: {
              id: true,
              dayNumber: true,
              focus: true,
              customFocus: true,
              weekday: true,
            },
          },
        },
      },
    },
  })

  const split = client?.trainingSplits[0]
  if (!client || !split || split.days.length === 0) {
    return EMPTY_BOARD
  }

  const weekStartDay = client.trainer?.weekStartDay ?? "SAT"
  const today = new Date()
  const days: BoardSplitDay[] = split.days

  const exerciseCountByDayId = new Map<string, number>()
  const counts = await prisma.splitDayExercise.groupBy({
    by: ["splitDayId"],
    _count: { _all: true },
    where: { splitDayId: { in: days.map((day) => day.id) } },
  })
  for (const row of counts) {
    exerciseCountByDayId.set(row.splitDayId, row._count._all)
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
    const fullSplit = await prisma.trainingSplit.findUnique({
      where: { id: split.id },
      select: {
        days: {
          select: {
            id: true,
            exercises: { select: { id: true } },
          },
        },
      },
    })
    for (const day of fullSplit?.days ?? []) {
      for (const exercise of day.exercises) {
        exerciseToDay.set(exercise.id, day.id)
      }
    }

    const logs = await prisma.exerciseLog.findMany({
      where: { clientId },
      select: { splitDayExerciseId: true },
      distinct: ["splitDayExerciseId"],
    })

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
  const rangeStartDate = weekStartDate(weekStartDay, today)
  const rangeStartKey = toDateKey(rangeStartDate)
  const rangeEndKey = addDaysToDateKey(rangeStartKey, 7)

  const logs = await prisma.exerciseLog.findMany({
    where: {
      clientId,
      date: {
        gte: new Date(`${rangeStartKey}T00:00:00`),
        lt: new Date(`${rangeEndKey}T00:00:00`),
      },
    },
    select: { date: true },
  })

  const loggedDates = new Set(logs.map((log) => toDateKey(new Date(log.date))))

  const board = withExerciseCounts(
    buildFixedBoard(days, weekStartDay, today, loggedDates)
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
  const [boardData, split] = await Promise.all([
    getClientWeekBoardUncached(clientId),
    prisma.trainingSplit.findFirst({
      where: { clientId, status: PlanStatus.ACTIVE },
      include: {
        days: {
          where: { id: dayId },
          include: {
            exercises: {
              orderBy: { order: "asc" as const },
              include: { exercise: true },
            },
          },
        },
      },
    }),
  ])

  const day = split?.days[0]
  if (!day) return null

  const entry = boardData.board.find((item) => item.dayId === dayId) ?? null
  const status = entry?.status ?? "UPCOMING"

  let logs = await prisma.exerciseLog.findMany({
    where: { clientId, splitDayExerciseId: { in: day.exercises.map((ex) => ex.id) } },
    orderBy: { date: "desc" as const },
  })

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
  const exercises: ClientDayExercise[] = day.exercises.map((ex) => {
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
      exerciseName: ex.exerciseName || ex.exercise?.name || "Exercise",
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.targetWeightKg,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
      youtubeUrl: ex.exercise?.youtubeUrl ?? null,
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
    exercises,
    totalVolume: totalVolume > 0 ? totalVolume : null,
  }
}
