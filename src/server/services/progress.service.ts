import { prisma } from "@/lib/prisma"
import { PlanStatus } from "@/generated/prisma/enums"
import { withCache } from "@/lib/cache"
import type {
  ProgressReviewInput,
  WorkoutLogInput,
} from "@/lib/validations/progress"

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
      const logs = await prisma.exerciseLog.findMany({
        where: { clientId },
        select: {
          actualWeightKg: true,
          date: true,
          splitDayExercise: {
            select: {
              id: true,
              exerciseName: true,
            },
          },
        },
        orderBy: { date: "asc" },
      })

      const byExercise = new Map<
        string,
        { name: string; points: StrengthSeriesPoint[] }
      >()

      for (const log of logs) {
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
  return prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerProfileId },
    select: { id: true, fullName: true },
  })
}

export async function getClientProgressData(
  clientId: string,
  trainerProfileId: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const [bodyCompositions, progressReviews, workoutLogs, exerciseLogs, activeSplit] =
    await Promise.all([
      prisma.bodyComposition.findMany({
        where: { clientId: client.id },
        orderBy: { date: "asc" },
      }),
      prisma.progressReview.findMany({
        where: { clientId: client.id },
        orderBy: { reviewDate: "desc" },
      }),
      prisma.workoutLog.findMany({
        where: { clientId: client.id },
        orderBy: { date: "desc" },
      }),
      prisma.exerciseLog.findMany({
        where: { clientId: client.id },
        include: {
          splitDayExercise: {
            include: {
              splitDay: {
                include: {
                  split: { select: { splitType: true, status: true } },
                },
              },
            },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.trainingSplit.findFirst({
        where: { clientId: client.id, status: PlanStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      }),
    ])

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

  return prisma.progressReview.create({
    data: {
      clientId: client.id,
      reviewDate,
      adherencePct:
        data.adherencePct === "" || data.adherencePct === undefined
          ? null
          : data.adherencePct,
      energyLevel:
        data.energyLevel === "" || data.energyLevel === undefined
          ? null
          : data.energyLevel,
      trainerNotes: data.trainerNotes?.trim() || null,
    },
  })
}

export async function createWorkoutLog(
  clientId: string,
  trainerProfileId: string,
  data: WorkoutLogInput
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const date = new Date(`${data.date}T00:00:00Z`)

  return prisma.workoutLog.create({
    data: {
      clientId: client.id,
      date,
      exerciseName: data.exerciseName.trim(),
      sets: data.sets === "" || data.sets === undefined ? null : data.sets,
      reps: data.reps === "" || data.reps === undefined ? null : data.reps,
      weightKg:
        data.weightKg === "" || data.weightKg === undefined
          ? null
          : data.weightKg,
      rpe: data.rpe === "" || data.rpe === undefined ? null : data.rpe,
      notes: data.notes?.trim() || null,
    },
  })
}

export async function deleteWorkoutLog(
  clientId: string,
  trainerProfileId: string,
  logId: string
): Promise<boolean> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return false

  const log = await prisma.workoutLog.findFirst({
    where: { id: logId, clientId: client.id },
    select: { id: true },
  })

  if (!log) return false

  await prisma.workoutLog.delete({ where: { id: log.id } })
  return true
}