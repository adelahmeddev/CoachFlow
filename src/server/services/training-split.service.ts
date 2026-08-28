import { prisma } from "@/lib/prisma"
import { PlanStatus, ScheduleMode } from "@/generated/prisma/enums"
import type {
  TrainingSplit,
  TrainingSplitDay,
  SplitDayExercise,
} from "@/generated/prisma/client"
import type { TrainingSplitInput } from "@/lib/validations/training-split"
import {
  toIntOrNull,
  toNumberOrNull,
} from "@/lib/validations/exercise"

export interface TrainingSplitWithDays extends TrainingSplit {
  days: (TrainingSplitDay & { exercises: SplitDayExercise[] })[]
}

const includeDays = {
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: {
      exercises: { orderBy: { order: "asc" as const } },
    },
  },
}

async function getOwnedClient(clientId: string, trainerProfileId?: string) {
  const where = trainerProfileId
    ? { id: clientId, trainerId: trainerProfileId }
    : { id: clientId }

  return prisma.client.findFirst({
    where,
    select: { id: true, fullName: true },
  })
}

export async function getOwnedClientForForm(
  clientId: string,
  trainerProfileId?: string
) {
  const where = trainerProfileId
    ? { id: clientId, trainerId: trainerProfileId }
    : { id: clientId }

  return prisma.client.findFirst({
    where,
    select: { id: true, fullName: true, goal: true },
  })
}

export async function getClientTrainingSplitData(
  clientId: string,
  trainerProfileId?: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  const splits = await prisma.trainingSplit.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
    include: includeDays,
  })

  return { client, splits }
}

export async function getTrainerWeekStartDay(
  trainerProfileId?: string
): Promise<"SAT" | "SUN" | "MON"> {
  if (!trainerProfileId) return "SAT"
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { weekStartDay: true },
  })
  return profile?.weekStartDay ?? "SAT"
}

export async function getActiveTrainingSplit(
  clientId: string,
  trainerProfileId?: string
): Promise<TrainingSplitWithDays | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  return prisma.trainingSplit.findFirst({
    where: { clientId: client.id, status: PlanStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    include: includeDays,
  })
}

export async function getTrainingSplitForEdit(
  clientId: string,
  trainerProfileId: string | undefined,
  splitId: string
): Promise<TrainingSplitWithDays | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  return prisma.trainingSplit.findFirst({
    where: { id: splitId, clientId: client.id },
    include: includeDays,
  })
}

export async function createTrainingSplit(
  clientId: string,
  trainerProfileId: string,
  data: TrainingSplitInput
): Promise<TrainingSplit | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)

  if (!client) return null

  return prisma.$transaction(async (tx) => {
    if (data.status === PlanStatus.ACTIVE) {
      await tx.trainingSplit.updateMany({
        where: { clientId: client.id, status: PlanStatus.ACTIVE },
        data: { status: PlanStatus.COMPLETED },
      })
    }

    return tx.trainingSplit.create({
      data: {
        clientId: client.id,
        splitType: data.splitType,
        daysPerWeek: data.days.length,
        scheduleMode: data.scheduleMode,
        notes: data.notes || null,
        status: data.status,
        days: {
          create: data.days.map((day, index) => ({
            dayNumber: index + 1,
            focus: day.focus,
            customFocus: day.customFocus?.trim() || null,
            weekday:
              data.scheduleMode === ScheduleMode.FIXED_WEEKDAYS
                ? day.weekday ?? null
                : null,
            notes: day.notes?.trim() || null,
            exercises: {
              create: (day.exercises ?? []).map((exercise, exIndex) => ({
                order: exIndex + 1,
                exerciseId: exercise.exerciseId ?? null,
                exerciseName: exercise.exerciseName.trim(),
                targetSets: toIntOrNull(exercise.targetSets),
                targetReps: toIntOrNull(exercise.targetReps),
                targetWeightKg: toNumberOrNull(exercise.targetWeightKg),
                restSeconds: toIntOrNull(exercise.restSeconds),
                notes: exercise.notes?.trim() || null,
                videoUrl: exercise.videoUrl?.trim() || null,
              })),
            },
          })),
        },
      },
    })
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

  const split = await prisma.trainingSplit.findFirst({
    where: { id: splitId, clientId: client.id },
    select: { id: true, status: true },
  })

  if (!split) return null

  return prisma.$transaction(async (tx) => {
    if (data.status === PlanStatus.ACTIVE && split.status !== PlanStatus.ACTIVE) {
      await tx.trainingSplit.updateMany({
        where: { clientId: client.id, status: PlanStatus.ACTIVE },
        data: { status: PlanStatus.COMPLETED },
      })
    }

    const updated = await tx.trainingSplit.update({
      where: { id: splitId },
      data: {
        splitType: data.splitType,
        daysPerWeek: data.days.length,
        scheduleMode: data.scheduleMode,
        notes: data.notes || null,
        status: data.status,
      },
    })

    await tx.trainingSplitDay.deleteMany({
      where: { splitId },
    })

    await tx.trainingSplitDay.createMany({
      data: data.days.map((day, index) => ({
        splitId,
        dayNumber: index + 1,
        focus: day.focus,
        customFocus: day.customFocus?.trim() || null,
        weekday:
          data.scheduleMode === ScheduleMode.FIXED_WEEKDAYS
            ? day.weekday ?? null
            : null,
        notes: day.notes?.trim() || null,
      })),
    })

    const createdDays = await tx.trainingSplitDay.findMany({
      where: { splitId },
      orderBy: { dayNumber: "asc" },
    })

    await tx.splitDayExercise.createMany({
      data: data.days.flatMap((day, index) =>
        (day.exercises ?? []).map((exercise, exIndex) => ({
          splitDayId: createdDays[index].id,
          order: exIndex + 1,
          exerciseId: exercise.exerciseId ?? null,
          exerciseName: exercise.exerciseName.trim(),
          targetSets: toIntOrNull(exercise.targetSets),
          targetReps: toIntOrNull(exercise.targetReps),
          targetWeightKg: toNumberOrNull(exercise.targetWeightKg),
          restSeconds: toIntOrNull(exercise.restSeconds),
          notes: exercise.notes?.trim() || null,
          videoUrl: exercise.videoUrl?.trim() || null,
        }))
      ),
    })

    return updated
  })
}

export async function getOtherClientsSplits(
  clientId: string,
  trainerProfileId?: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return []

  const where = trainerProfileId
    ? { client: { trainerId: trainerProfileId }, clientId: { not: client.id } }
    : { clientId: { not: client.id } }

  return prisma.trainingSplit.findMany({
    where: {
      ...where,
      status: {
        in: [
          PlanStatus.ACTIVE,
          PlanStatus.DRAFT,
          PlanStatus.PAUSED,
        ],
      },
    },
    include: {
      ...includeDays,
      client: { select: { fullName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  })
}

export async function getClientPainFlags(
  clientId: string,
  trainerProfileId?: string
) {
  const where = trainerProfileId
    ? { id: clientId, trainerId: trainerProfileId }
    : { id: clientId }

  const client = await prisma.client.findFirst({
    where,
    select: {
      neckPain: true,
      shoulderPain: true,
      backPain: true,
      kneePain: true,
    },
  })

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

  const split = await prisma.trainingSplit.findFirst({
    where: { id: splitId, clientId: client.id },
    select: { id: true },
  })

  if (!split) return null

  return prisma.trainingSplit.update({
    where: { id: splitId },
    data: { status },
  })
}