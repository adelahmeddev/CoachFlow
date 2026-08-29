import { pool, generateId, withTransaction, type PgClient } from "@/lib/db"
import type {
  TrainingSplitTemplate,
  TrainingSplitTemplateDay,
  TemplateDayExercise,
} from "@/lib/db/types"
import type { TrainingSplitTemplateInput } from "@/lib/validations/training-split-template"
import {
  toIntOrNull,
  toNumberOrNull,
} from "@/lib/validations/exercise"
import { withCache } from "@/lib/cache"

type TemplateWithDays = TrainingSplitTemplate & {
  days: (TrainingSplitTemplateDay & { exercises: TemplateDayExercise[] })[]
}

async function hydrateTemplateDays(
  templateId: string,
  exec: typeof pool | PgClient
): Promise<(TrainingSplitTemplateDay & { exercises: TemplateDayExercise[] })[]> {
  const daysRes = await exec.query<TrainingSplitTemplateDay>(
    `SELECT * FROM "TrainingSplitTemplateDay" WHERE "templateId" = $1 ORDER BY "dayNumber" ASC`,
    [templateId]
  )
  const days = daysRes.rows as TrainingSplitTemplateDay[]
  const out: (TrainingSplitTemplateDay & { exercises: TemplateDayExercise[] })[] = []
  for (const day of days) {
    const exRes = await exec.query<TemplateDayExercise>(
      `SELECT * FROM "TemplateDayExercise" WHERE "templateDayId" = $1 ORDER BY "order" ASC`,
      [day.id]
    )
    out.push({ ...day, exercises: exRes.rows as TemplateDayExercise[] })
  }
  return out
}

async function hydrateTemplates(
  rows: TrainingSplitTemplate[],
  exec: typeof pool | PgClient
): Promise<TemplateWithDays[]> {
  const out: TemplateWithDays[] = []
  for (const row of rows) {
    const days = await hydrateTemplateDays(row.id, exec)
    out.push({ ...row, days })
  }
  return out
}

const getGlobalSplitTemplatesCached = withCache(
  async () => {
    const res = await pool.query<TrainingSplitTemplate>(
      `SELECT * FROM "TrainingSplitTemplate" WHERE "isGlobal" = true ORDER BY "name" ASC`
    )
    return hydrateTemplates(res.rows as TrainingSplitTemplate[], pool)
  },
  ["split-templates-global"],
  ["templates"],
  3600
)

export async function getTrainerTemplateData(trainerProfileId: string) {
  const [ownRows, global] = await Promise.all([
    (async () => {
      const res = await pool.query<TrainingSplitTemplate>(
        `SELECT * FROM "TrainingSplitTemplate" WHERE "trainerId" = $1 ORDER BY "updatedAt" DESC`,
        [trainerProfileId]
      )
      return hydrateTemplates(res.rows as TrainingSplitTemplate[], pool)
    })(),
    getGlobalSplitTemplatesCached(),
  ])

  return { own: ownRows, global }
}

export async function getTemplatesForForm(trainerProfileId?: string) {
  if (!trainerProfileId) {
    return getGlobalSplitTemplatesCached()
  }

  const [ownRows, global] = await Promise.all([
    (async () => {
      const res = await pool.query<TrainingSplitTemplate>(
        `SELECT * FROM "TrainingSplitTemplate" WHERE "trainerId" = $1 ORDER BY "name" ASC`,
        [trainerProfileId]
      )
      return hydrateTemplates(res.rows as TrainingSplitTemplate[], pool)
    })(),
    getGlobalSplitTemplatesCached(),
  ])

  return [...ownRows, ...global].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getTemplateForEdit(
  templateId: string,
  trainerProfileId: string
) {
  const res = await pool.query<TrainingSplitTemplate>(
    `SELECT * FROM "TrainingSplitTemplate" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [templateId, trainerProfileId]
  )
  const template = res.rows[0] as TrainingSplitTemplate | undefined
  if (!template) return null
  const days = await hydrateTemplateDays(template.id, pool)
  return { ...template, days }
}

export async function createTrainingSplitTemplate(
  trainerProfileId: string,
  data: TrainingSplitTemplateInput
) {
  return withTransaction(async (tx) => {
    const templateId = generateId()
    await tx.query(
      `INSERT INTO "TrainingSplitTemplate" ("id", "trainerId", "name", "goal", "level", "splitType", "daysPerWeek", "description", "isGlobal", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::"Goal", $5, $6::"SplitType", $7, $8, $9, NOW(), NOW())`,
      [
        templateId,
        trainerProfileId,
        data.name.trim(),
        data.goal ?? null,
        data.level?.trim() || null,
        data.splitType,
        data.daysPerWeek,
        data.description?.trim() || null,
        false,
      ]
    )

    for (let index = 0; index < data.days.length; index++) {
      const day = data.days[index]!
      const dayId = generateId()
      await tx.query(
        `INSERT INTO "TrainingSplitTemplateDay" ("id", "templateId", "dayNumber", "focus", "customFocus", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4::"TrainingDayFocus", $5, NOW(), NOW())`,
        [dayId, templateId, index + 1, day.focus, day.customFocus?.trim() || null]
      )
      const exercises = day.exercises ?? []
      for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
        const exercise = exercises[exIndex]!
        const exId = generateId()
        await tx.query(
          `INSERT INTO "TemplateDayExercise" ("id", "templateDayId", "order", "exerciseId", "exerciseName", "targetSets", "targetReps", "targetWeightKg", "restSeconds", "notes", "videoUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            exId,
            dayId,
            exIndex + 1,
            exercise.exerciseId ?? null,
            exercise.exerciseName.trim(),
            toIntOrNull(exercise.targetSets),
            toIntOrNull(exercise.targetReps),
            toNumberOrNull(exercise.targetWeightKg),
            toIntOrNull(exercise.restSeconds),
            exercise.notes?.trim() || null,
            exercise.videoUrl?.trim() || null,
          ]
        )
      }
    }

    const res = await tx.query<TrainingSplitTemplate>(
      `SELECT * FROM "TrainingSplitTemplate" WHERE "id" = $1 LIMIT 1`,
      [templateId]
    )
    return res.rows[0] as TrainingSplitTemplate
  })
}

export async function updateTrainingSplitTemplate(
  templateId: string,
  trainerProfileId: string,
  data: TrainingSplitTemplateInput
) {
  const checkRes = await pool.query(
    `SELECT "id" FROM "TrainingSplitTemplate" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [templateId, trainerProfileId]
  )
  if (!checkRes.rows[0]) return null

  return withTransaction(async (tx) => {
    const updatedRes = await tx.query<TrainingSplitTemplate>(
      `UPDATE "TrainingSplitTemplate" SET "name" = $1, "goal" = $2::"Goal", "level" = $3, "splitType" = $4::"SplitType", "daysPerWeek" = $5, "description" = $6, "updatedAt" = NOW() WHERE "id" = $7 RETURNING *`,
      [
        data.name.trim(),
        data.goal ?? null,
        data.level?.trim() || null,
        data.splitType,
        data.daysPerWeek,
        data.description?.trim() || null,
        templateId,
      ]
    )
    const updated = updatedRes.rows[0] as TrainingSplitTemplate

    await tx.query(`DELETE FROM "TrainingSplitTemplateDay" WHERE "templateId" = $1`, [templateId])

    const createdDayIds: string[] = []
    for (let index = 0; index < data.days.length; index++) {
      const day = data.days[index]!
      const dayId = generateId()
      createdDayIds.push(dayId)
      await tx.query(
        `INSERT INTO "TrainingSplitTemplateDay" ("id", "templateId", "dayNumber", "focus", "customFocus", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4::"TrainingDayFocus", $5, NOW(), NOW())`,
        [dayId, templateId, index + 1, day.focus, day.customFocus?.trim() || null]
      )
    }

    for (let index = 0; index < data.days.length; index++) {
      const day = data.days[index]!
      const dayId = createdDayIds[index]!
      const exercises = day.exercises ?? []
      for (let exIndex = 0; exIndex < exercises.length; exIndex++) {
        const exercise = exercises[exIndex]!
        const exId = generateId()
        await tx.query(
          `INSERT INTO "TemplateDayExercise" ("id", "templateDayId", "order", "exerciseId", "exerciseName", "targetSets", "targetReps", "targetWeightKg", "restSeconds", "notes", "videoUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            exId,
            dayId,
            exIndex + 1,
            exercise.exerciseId ?? null,
            exercise.exerciseName.trim(),
            toIntOrNull(exercise.targetSets),
            toIntOrNull(exercise.targetReps),
            toNumberOrNull(exercise.targetWeightKg),
            toIntOrNull(exercise.restSeconds),
            exercise.notes?.trim() || null,
            exercise.videoUrl?.trim() || null,
          ]
        )
      }
    }

    return updated
  })
}

export async function duplicateTrainingSplitTemplate(
  templateId: string,
  trainerProfileId: string
) {
  const res = await pool.query<TrainingSplitTemplate>(
    `SELECT * FROM "TrainingSplitTemplate" WHERE "id" = $1 AND ("trainerId" = $2 OR "isGlobal" = true) LIMIT 1`,
    [templateId, trainerProfileId]
  )
  const template = res.rows[0] as TrainingSplitTemplate | undefined
  if (!template) return null

  const days = await hydrateTemplateDays(template.id, pool)

  return withTransaction(async (tx) => {
    const newTemplateId = generateId()
    await tx.query(
      `INSERT INTO "TrainingSplitTemplate" ("id", "trainerId", "name", "goal", "level", "splitType", "daysPerWeek", "description", "isGlobal", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4::"Goal", $5, $6::"SplitType", $7, $8, $9, NOW(), NOW())`,
      [
        newTemplateId,
        trainerProfileId,
        `${template.name} (Copy)`,
        template.goal,
        template.level,
        template.splitType,
        template.daysPerWeek,
        template.description,
        false,
      ]
    )

    for (const day of days) {
      const newDayId = generateId()
      await tx.query(
        `INSERT INTO "TrainingSplitTemplateDay" ("id", "templateId", "dayNumber", "focus", "customFocus", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4::"TrainingDayFocus", $5, NOW(), NOW())`,
        [newDayId, newTemplateId, day.dayNumber, day.focus, day.customFocus]
      )
      for (const exercise of day.exercises) {
        const newExId = generateId()
        await tx.query(
          `INSERT INTO "TemplateDayExercise" ("id", "templateDayId", "order", "exerciseId", "exerciseName", "targetSets", "targetReps", "targetWeightKg", "restSeconds", "notes", "videoUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          [
            newExId,
            newDayId,
            exercise.order,
            exercise.exerciseId,
            exercise.exerciseName,
            exercise.targetSets,
            exercise.targetReps,
            exercise.targetWeightKg,
            exercise.restSeconds,
            exercise.notes,
            exercise.videoUrl,
          ]
        )
      }
    }

    const newRes = await tx.query<TrainingSplitTemplate>(
      `SELECT * FROM "TrainingSplitTemplate" WHERE "id" = $1 LIMIT 1`,
      [newTemplateId]
    )
    return newRes.rows[0] as TrainingSplitTemplate
  })
}

export async function deleteTrainingSplitTemplate(
  templateId: string,
  trainerProfileId: string
): Promise<boolean> {
  const checkRes = await pool.query(
    `SELECT "id" FROM "TrainingSplitTemplate" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
    [templateId, trainerProfileId]
  )
  if (!checkRes.rows[0]) return false

  await pool.query(`DELETE FROM "TrainingSplitTemplate" WHERE "id" = $1`, [templateId])
  return true
}
