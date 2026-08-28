"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword, comparePassword } from "@/lib/auth"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { PlanStatus } from "@/generated/prisma/enums"
import { getDayDetail } from "@/server/services/week.service"

async function invalidateClientWorkoutTags(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { trainerId: true },
  })
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

  const existingLog = await prisma.dailyLog.findFirst({
    where: {
      clientId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })

  if (existingLog) {
    await prisma.dailyLog.update({
      where: { id: existingLog.id },
      data: {
        weightKg: data.weightKg,
        sleepHours: data.sleepHours,
        waterLiters: data.waterLiters,
        energyLevel: data.energyLevel,
        moodLevel: data.moodLevel,
        nutritionCompliant: data.nutritionCompliant ?? false,
        notes: data.notes,
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.dailyLog.create({
      data: {
        clientId,
        date: today,
        weightKg: data.weightKg,
        sleepHours: data.sleepHours,
        waterLiters: data.waterLiters,
        energyLevel: data.energyLevel,
        moodLevel: data.moodLevel,
        nutritionCompliant: data.nutritionCompliant ?? false,
        notes: data.notes,
      },
    })
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

  const owned = await prisma.splitDayExercise.findFirst({
    where: {
      id: splitDayExerciseId,
      splitDay: {
        split: { clientId, status: PlanStatus.ACTIVE },
      },
    },
    select: { id: true },
  })
  if (!owned) return { ok: false, error: "NOT_FOUND" }

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)

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

  const existing = await prisma.exerciseLog.findFirst({
    where: {
      clientId,
      splitDayExerciseId,
      date: {
        gte: dayStart,
        lt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    select: { id: true },
  })

  const { setData, ...scalars } = payload

  if (existing) {
    await prisma.exerciseLog.update({
      where: { id: existing.id },
      data: setData !== undefined ? { ...scalars, setData } : scalars,
    })
  } else {
    await prisma.exerciseLog.create({
      data: {
        clientId,
        splitDayExerciseId,
        date: new Date(),
        ...scalars,
        ...(setData !== undefined ? { setData } : {}),
      },
    })
  }

  await invalidateClientWorkoutTags(clientId)
  return { ok: true }
}
