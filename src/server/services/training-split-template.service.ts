import { prisma } from "@/lib/prisma"
import type { TrainingSplitTemplateInput } from "@/lib/validations/training-split-template"
import {
  toIntOrNull,
  toNumberOrNull,
} from "@/lib/validations/exercise"
import { withCache } from "@/lib/cache"

const includeTemplate = {
  days: {
    orderBy: { dayNumber: "asc" as const },
    include: {
      exercises: { orderBy: { order: "asc" as const } },
    },
  },
}

const getGlobalSplitTemplatesCached = withCache(
  () =>
    prisma.trainingSplitTemplate.findMany({
      where: { isGlobal: true },
      orderBy: { name: "asc" },
      include: includeTemplate,
    }),
  ["split-templates-global"],
  ["templates"],
  3600
)

export async function getTrainerTemplateData(trainerProfileId: string) {
  const [own, global] = await Promise.all([
    prisma.trainingSplitTemplate.findMany({
      where: { trainerId: trainerProfileId },
      orderBy: { updatedAt: "desc" },
      include: includeTemplate,
    }),
    getGlobalSplitTemplatesCached(),
  ])

  return { own, global }
}

export async function getTemplatesForForm(trainerProfileId?: string) {
  if (!trainerProfileId) {
    return getGlobalSplitTemplatesCached()
  }

  const [own, global] = await Promise.all([
    prisma.trainingSplitTemplate.findMany({
      where: { trainerId: trainerProfileId },
      orderBy: { name: "asc" },
      include: includeTemplate,
    }),
    getGlobalSplitTemplatesCached(),
  ])

  return [...own, ...global].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getTemplateForEdit(
  templateId: string,
  trainerProfileId: string
) {
  return prisma.trainingSplitTemplate.findFirst({
    where: { id: templateId, trainerId: trainerProfileId },
    include: includeTemplate,
  })
}

export async function createTrainingSplitTemplate(
  trainerProfileId: string,
  data: TrainingSplitTemplateInput
) {
  return prisma.trainingSplitTemplate.create({
    data: {
      trainerId: trainerProfileId,
      name: data.name.trim(),
      goal: data.goal ?? null,
      level: data.level?.trim() || null,
      splitType: data.splitType,
      daysPerWeek: data.daysPerWeek,
      description: data.description?.trim() || null,
      days: {
        create: data.days.map((day, index) => ({
          dayNumber: index + 1,
          focus: day.focus,
          customFocus: day.customFocus?.trim() || null,
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
}

export async function updateTrainingSplitTemplate(
  templateId: string,
  trainerProfileId: string,
  data: TrainingSplitTemplateInput
) {
  const template = await prisma.trainingSplitTemplate.findFirst({
    where: { id: templateId, trainerId: trainerProfileId },
    select: { id: true },
  })
  if (!template) return null

  return prisma.$transaction(async (tx) => {
    const updated = await tx.trainingSplitTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name.trim(),
        goal: data.goal ?? null,
        level: data.level?.trim() || null,
        splitType: data.splitType,
        daysPerWeek: data.daysPerWeek,
        description: data.description?.trim() || null,
      },
    })

    await tx.trainingSplitTemplateDay.deleteMany({
      where: { templateId },
    })

    await tx.trainingSplitTemplateDay.createMany({
      data: data.days.map((day, index) => ({
        templateId,
        dayNumber: index + 1,
        focus: day.focus,
        customFocus: day.customFocus?.trim() || null,
      })),
    })

    const createdDays = await tx.trainingSplitTemplateDay.findMany({
      where: { templateId },
      orderBy: { dayNumber: "asc" },
    })

    await tx.templateDayExercise.createMany({
      data: data.days.flatMap((day, index) =>
        (day.exercises ?? []).map((exercise, exIndex) => ({
          templateDayId: createdDays[index].id,
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

export async function duplicateTrainingSplitTemplate(
  templateId: string,
  trainerProfileId: string
) {
  const template = await prisma.trainingSplitTemplate.findFirst({
    where: {
      id: templateId,
      OR: [{ trainerId: trainerProfileId }, { isGlobal: true }],
    },
    include: includeTemplate,
  })
  if (!template) return null

  return prisma.trainingSplitTemplate.create({
    data: {
      trainerId: trainerProfileId,
      name: `${template.name} (Copy)`,
      goal: template.goal,
      level: template.level,
      splitType: template.splitType,
      daysPerWeek: template.daysPerWeek,
      description: template.description,
      days: {
        create: template.days.map((day) => ({
          dayNumber: day.dayNumber,
          focus: day.focus,
          customFocus: day.customFocus,
          exercises: {
            create: day.exercises.map((exercise) => ({
              order: exercise.order,
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              targetSets: exercise.targetSets,
              targetReps: exercise.targetReps,
              targetWeightKg: exercise.targetWeightKg,
              restSeconds: exercise.restSeconds,
              notes: exercise.notes,
              videoUrl: exercise.videoUrl,
            })),
          },
        })),
      },
    },
  })
}

export async function deleteTrainingSplitTemplate(
  templateId: string,
  trainerProfileId: string
): Promise<boolean> {
  const template = await prisma.trainingSplitTemplate.findFirst({
    where: { id: templateId, trainerId: trainerProfileId },
    select: { id: true },
  })
  if (!template) return false

  await prisma.trainingSplitTemplate.delete({ where: { id: template.id } })
  return true
}
