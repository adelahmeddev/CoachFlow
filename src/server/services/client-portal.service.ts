import { prisma } from "@/lib/prisma"
import { ClientStatus, PlanStatus, ScheduleMode, TrainingDayFocus } from "@/generated/prisma/enums"
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
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: true,
      dailyLogs: {
        orderBy: { date: "desc" },
        take: 1,
      },
      progressReviews: {
        orderBy: { reviewDate: "desc" },
        take: 1,
      },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      bodyCompositions: {
        orderBy: { date: "desc" },
        take: 1,
      },
      trainingSplits: {
        where: { status: PlanStatus.ACTIVE },
        include: {
          days: {
            include: {
              exercises: {
                include: { exercise: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  })

  if (!client) return null

  const [todayWorkout, weekBoard] = await Promise.all([
    getTodayWorkout(clientId),
    getClientWeekBoard(clientId),
  ])

  return {
    client: {
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      goal: client.goal,
      status: client.status,
      streak: client.dailyLogs.length > 0 ? 1 : 0,
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
    latestDailyLog: client.dailyLogs[0] ?? null,
    latestTrainerNotes: client.progressReviews[0]?.trainerNotes ?? null,
    subscription: client.subscriptions[0] ?? null,
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

  const todayDay = await prisma.trainingSplitDay.findFirst({
    where: {
      id: activeEntry.dayId,
      split: { clientId, status: PlanStatus.ACTIVE },
    },
    include: {
      exercises: {
        orderBy: { order: "asc" as const },
        include: { exercise: true },
      },
    },
  })

  if (!todayDay) {
    return {
      day: null,
      exercises: [],
      status: activeEntry.status === "CURRENT" ? "CURRENT" : "TODAY",
      nextTrainingDay: null,
    }
  }

  const exercises = todayDay.exercises.map((ex) => ({
    id: ex.id,
    exerciseName: ex.exerciseName || ex.exercise?.name || "Exercise",
    sets: ex.targetSets ?? 3,
    reps: ex.targetReps ?? 10,
    targetWeight: ex.targetWeightKg ?? null,
    restSeconds: ex.restSeconds ?? null,
    notes: ex.notes ?? null,
    youtubeUrl: ex.exercise?.youtubeUrl ?? null,
    videoUrl: ex.videoUrl ?? null,
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
  const todaysLogs = await prisma.exerciseLog.findMany({
    where: {
      clientId,
      date: {
        gte: dayStart,
        lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
      },
      splitDayExerciseId: { in: todayDay.exercises.map((ex) => ex.id) },
    },
    orderBy: { createdAt: "desc" as const },
  })

  for (const log of todaysLogs) {
    const exercise = exercises.find((ex) => ex.id === log.splitDayExerciseId)
    if (exercise && !exercise.log) {
      exercise.log = {
        actualSets: log.actualSets,
        actualReps: log.actualReps,
        actualWeightKg: log.actualWeightKg,
        rpe: log.rpe,
        notes: log.notes,
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

  const rows = await prisma.splitDayExercise.findMany({
    where: { id: { in: workout.exercises.map((ex) => ex.id) } },
    select: { id: true, exerciseId: true },
  })
  const sdeToExercise = new Map<string, string>()
  for (const row of rows) {
    if (row.exerciseId) sdeToExercise.set(row.id, row.exerciseId)
  }
  const masterIds = [...new Set(sdeToExercise.values())]
  const lastTime: Record<string, SessionLastTime> = {}

  if (masterIds.length > 0) {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const logs = await prisma.exerciseLog.findMany({
      where: {
        clientId,
        date: { lt: dayStart },
        splitDayExercise: { exerciseId: { in: masterIds } },
      },
      orderBy: { date: "desc" as const },
      select: {
        date: true,
        actualWeightKg: true,
        actualReps: true,
        splitDayExercise: { select: { exerciseId: true } },
      },
      take: 200,
    })

    const latestByMaster = new Map<string, (typeof logs)[number]>()
    for (const log of logs) {
      const key = log.splitDayExercise.exerciseId
      if (!key || latestByMaster.has(key)) continue
      latestByMaster.set(key, log)
    }

    for (const ex of workout.exercises) {
      const masterId = sdeToExercise.get(ex.id)
      const log = masterId ? latestByMaster.get(masterId) : undefined
      if (log && (log.actualWeightKg != null || log.actualReps != null)) {
        lastTime[ex.id] = {
          weightKg: log.actualWeightKg,
          reps: log.actualReps,
          date: log.date.toISOString(),
        }
      }
    }
  }

  return { workout, lastTime }
}

export async function getClientProgressData(clientId: string) {
  const [client, dailyLogs, exerciseLogs] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        bodyCompositions: { orderBy: { date: "asc" } },
        progressReviews: { orderBy: { reviewDate: "desc" } },
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.dailyLog.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
      take: 90,
    }),
    prisma.exerciseLog.findMany({
      where: { clientId },
      select: {
        id: true,
        date: true,
        actualSets: true,
        actualReps: true,
        actualWeightKg: true,
        rpe: true,
        notes: true,
        splitDayExercise: {
          select: {
            id: true,
            exerciseName: true,
            targetSets: true,
            targetReps: true,
            targetWeightKg: true,
            splitDay: {
              select: {
                dayNumber: true,
                focus: true,
                customFocus: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
  ])

  if (!client) return null

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
      date: log.date.toISOString(),
      weightKg: log.actualWeightKg,
    })
    byExercise.set(key, entry)
  }
  const strengthSeries = [...byExercise.entries()].map(
    ([exerciseId, entry]) => ({ exerciseId, name: entry.name, points: entry.points })
  )

  return {
    client,
    dailyLogs,
    workoutCount: exerciseLogs.length,
    exerciseLogs,
    strengthSeries,
    bodyCompositions: client.bodyCompositions,
    progressReviews: client.progressReviews,
  }
}

export async function getClientProfile(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      bodyCompositions: { orderBy: { date: "desc" }, take: 1 },
    },
  })
  return client
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
  return await prisma.$transaction(async (tx) => {
    for (const log of data.exerciseLogs) {
      await tx.exerciseLog.create({
        data: {
          splitDayExerciseId: log.splitDayExerciseId,
          clientId,
          actualSets: log.actualSets,
          actualReps: log.actualReps,
          actualWeightKg: log.actualWeightKg,
          rpe: log.rpe,
          notes: log.notes,
          date: new Date(),
        },
      })
    }

    if (data.dailyLog) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingLog = await tx.dailyLog.findFirst({
        where: {
          clientId,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      })

      const payload = {
        weightKg: data.dailyLog.weightKg,
        sleepHours: data.dailyLog.sleepHours,
        waterLiters: data.dailyLog.waterLiters,
        energyLevel: data.dailyLog.energyLevel,
        moodLevel: data.dailyLog.moodLevel,
        nutritionCompliant: data.dailyLog.nutritionCompliant,
        notes: data.dailyLog.notes,
      }

      if (existingLog) {
        await tx.dailyLog.update({
          where: { id: existingLog.id },
          data: { ...payload, updatedAt: new Date() },
        })
      } else {
        await tx.dailyLog.create({
          data: { clientId, date: today, ...payload },
        })
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
