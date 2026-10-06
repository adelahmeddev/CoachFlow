import { pool, generateId, withTransaction } from "@/lib/db"
import { withCache, invalidate } from "@/lib/cache"
import { MUSCLE_GROUPS } from "@/lib/constants"
import type { LibraryExerciseInput } from "@/lib/validations/exercise"

export interface LibraryExercise {
  id: string
  name: string
  nameAr: string | null
  muscleGroup: string
  equipment: string | null
  tags: string[]
  defaultSets: number | null
  defaultReps: number | null
  defaultRestSeconds: number | null
  youtubeUrl: string | null
  isGlobal: boolean
  isCustomized: boolean
  hidden?: boolean
}

export async function listExercisesForTrainer(trainerId: string): Promise<LibraryExercise[]> {
  return withCache(
    async () => {
      const res = await pool.query(
        `SELECT e.id,
                COALESCE(o.name, e.name) AS name,
                COALESCE(o."nameAr", e."nameAr") AS "nameAr",
                COALESCE(o."muscleGroup", e."muscleGroup") AS "muscleGroup",
                e.equipment,
                e.tags,
                e."defaultSets",
                e."defaultReps",
                e."defaultRestSeconds",
                COALESCE(o."youtubeUrl", e."youtubeUrl") AS "youtubeUrl",
                (e."trainerId" IS NULL) AS "isGlobal",
                (o."exerciseId" IS NOT NULL) AS "isCustomized",
                COALESCE(o.hidden, false) AS "hidden"
         FROM "Exercise" e
         LEFT JOIN "ExerciseOverride" o ON o."exerciseId" = e.id AND o."trainerId" = $1
         WHERE (e."trainerId" IS NULL AND COALESCE(o.hidden, false) = false) OR e."trainerId" = $1
         ORDER BY COALESCE(o."muscleGroup", e."muscleGroup") ASC, name ASC`,
        [trainerId]
      )
      return res.rows as LibraryExercise[]
    },
    ["trainer-exercises", trainerId],
    [`trainer:${trainerId}:exercises`],
    3600
  )()
}

export async function listHiddenExercises(trainerId: string) {
  const res = await pool.query(
    `SELECT e.id, e.name, e."nameAr", COALESCE(o."muscleGroup", e."muscleGroup") AS "muscleGroup", e.equipment, e."youtubeUrl"
     FROM "Exercise" e
     JOIN "ExerciseOverride" o ON o."exerciseId" = e.id AND o."trainerId" = $1
     WHERE o.hidden = true
     ORDER BY COALESCE(o."muscleGroup", e."muscleGroup") ASC, e.name ASC`,
    [trainerId]
  )
  return res.rows as {
    id: string
    name: string
    nameAr: string | null
    muscleGroup: string
    equipment: string | null
    youtubeUrl: string | null
  }[]
}

export async function createExercise(
  trainerId: string,
  input: LibraryExerciseInput
): Promise<{ ok: true; exercise: LibraryExercise } | { ok: false; error: string }> {
  const name = input.name.trim()

  // Check collision in effective library
  const existing = await pool.query(
    `SELECT e.id FROM "Exercise" e
     LEFT JOIN "ExerciseOverride" o ON o."exerciseId" = e.id AND o."trainerId" = $1
     WHERE (
       (e."trainerId" = $1 AND LOWER(e.name) = LOWER($2))
       OR
       (e."trainerId" IS NULL AND LOWER(COALESCE(o.name, e.name)) = LOWER($2) AND COALESCE(o.hidden, false) = false)
     )
     LIMIT 1`,
    [trainerId, name]
  )
  if (existing.rowCount && existing.rowCount > 0) {
    return { ok: false, error: "NAME_TAKEN" }
  }

  const rawMuscle = input.muscleGroup?.trim().toLowerCase()
  const muscleGroup =
    rawMuscle && (MUSCLE_GROUPS as readonly string[]).includes(rawMuscle)
      ? rawMuscle
      : "chest"

  const id = generateId()
  await pool.query(
    `INSERT INTO "Exercise" (
      "id", "trainerId", "name", "nameAr", "muscleGroup", "equipment", "youtubeUrl", "tags", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, '{}', NOW(), NOW())`,
    [
      id,
      trainerId,
      name,
      input.nameAr?.trim() || null,
      muscleGroup,
      input.equipment?.trim() || null,
      input.youtubeUrl?.trim() || null,
    ]
  )

  invalidate([`trainer:${trainerId}:exercises`])

  return {
    ok: true,
    exercise: {
      id,
      name,
      nameAr: input.nameAr?.trim() || null,
      muscleGroup,
      equipment: input.equipment?.trim() || null,
      tags: [],
      defaultSets: null,
      defaultReps: null,
      defaultRestSeconds: null,
      youtubeUrl: input.youtubeUrl?.trim() || null,
      isGlobal: false,
      isCustomized: false,
    },
  }
}

export async function updateExercise(
  trainerId: string,
  exerciseId: string,
  input: LibraryExerciseInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim()
  const rawMuscle = input.muscleGroup?.trim().toLowerCase()
  const muscleGroup =
    rawMuscle && (MUSCLE_GROUPS as readonly string[]).includes(rawMuscle)
      ? rawMuscle
      : "chest"
  const exRes = await pool.query(
    `SELECT e.id, e."trainerId", e.name, e."youtubeUrl"
     FROM "Exercise" e
     WHERE e.id = $1`,
    [exerciseId]
  )
  if (exRes.rowCount === 0) {
    return { ok: false, error: "EXERCISE_NOT_FOUND" }
  }
  const ex = exRes.rows[0] as { id: string; trainerId: string | null; name: string; youtubeUrl: string | null }

  // Check collision with another exercise
  const collision = await pool.query(
    `SELECT e.id FROM "Exercise" e
     LEFT JOIN "ExerciseOverride" o ON o."exerciseId" = e.id AND o."trainerId" = $1
     WHERE e.id <> $2 AND (
       (e."trainerId" = $1 AND LOWER(e.name) = LOWER($3))
       OR
       (e."trainerId" IS NULL AND LOWER(COALESCE(o.name, e.name)) = LOWER($3) AND COALESCE(o.hidden, false) = false)
     )
     LIMIT 1`,
    [trainerId, exerciseId, name]
  )
  if (collision.rowCount && collision.rowCount > 0) {
    return { ok: false, error: "NAME_TAKEN" }
  }

  const oldUrl = ex.youtubeUrl ?? ""
  const newUrl = input.youtubeUrl?.trim() || null

  await withTransaction(async (client) => {
    if (ex.trainerId === trainerId) {
      // Coach's own exercise
      await client.query(
        `UPDATE "Exercise"
         SET "name" = $1, "nameAr" = $2, "muscleGroup" = $3, "equipment" = $4, "youtubeUrl" = $5, "updatedAt" = NOW()
         WHERE "id" = $6 AND "trainerId" = $7`,
        [
          name,
          input.nameAr?.trim() || null,
          muscleGroup,
          input.equipment?.trim() || null,
          newUrl,
          exerciseId,
          trainerId,
        ]
      )
    } else if (ex.trainerId === null) {
      // Global exercise override
      await client.query(
        `INSERT INTO "ExerciseOverride" ("trainerId", "exerciseId", "name", "nameAr", "muscleGroup", "youtubeUrl", "hidden", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
         ON CONFLICT ("trainerId", "exerciseId")
         DO UPDATE SET "name" = EXCLUDED."name",
                       "nameAr" = EXCLUDED."nameAr",
                       "muscleGroup" = EXCLUDED."muscleGroup",
                       "youtubeUrl" = EXCLUDED."youtubeUrl",
                       "hidden" = false,
                       "updatedAt" = NOW()`,
        [
          trainerId,
          exerciseId,
          name,
          input.nameAr?.trim() || null,
          muscleGroup,
          newUrl,
        ]
      )
    } else {
      throw new Error("UNAUTHORIZED")
    }

    // Link propagation (Q1):
    // Update SplitDayExercise in ACTIVE client splits and coach's split templates
    // where videoUrl IS NULL or videoUrl = '' or videoUrl = oldUrl
    if (newUrl) {
      await client.query(
        `UPDATE "SplitDayExercise" sde
         SET "videoUrl" = $1
         FROM "TrainingSplitDay" tsd
         JOIN "TrainingSplit" ts ON ts.id = tsd."splitId"
         JOIN "Client" c ON c.id = ts."clientId"
         WHERE sde."splitDayId" = tsd.id
           AND c."trainerId" = $2
           AND ts."status" = 'ACTIVE'
           AND (sde."exerciseId" = $3 OR sde."exerciseName" = $4)
           AND (sde."videoUrl" IS NULL OR sde."videoUrl" = '' OR sde."videoUrl" = $5)`,
        [newUrl, trainerId, exerciseId, ex.name, oldUrl]
      )

      await client.query(
        `UPDATE "TemplateDayExercise" tde
         SET "videoUrl" = $1
         FROM "TrainingSplitTemplateDay" tstd
         JOIN "TrainingSplitTemplate" tst ON tst.id = tstd."templateId"
         WHERE tde."templateDayId" = tstd.id
           AND tst."trainerId" = $2
           AND (tde."exerciseId" = $3 OR tde."exerciseName" = $4)
           AND (tde."videoUrl" IS NULL OR tde."videoUrl" = '' OR tde."videoUrl" = $5)`,
        [newUrl, trainerId, exerciseId, ex.name, oldUrl]
      )
    }
  })

  invalidate([`trainer:${trainerId}:exercises`])
  return { ok: true }
}

export async function removeExercise(
  trainerId: string,
  exerciseId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const exRes = await pool.query(
    `SELECT "trainerId" FROM "Exercise" WHERE id = $1`,
    [exerciseId]
  )
  if (exRes.rowCount === 0) return { ok: false, error: "EXERCISE_NOT_FOUND" }
  const ex = exRes.rows[0] as { trainerId: string | null }

  if (ex.trainerId === trainerId) {
    await pool.query(
      `DELETE FROM "Exercise" WHERE id = $1 AND "trainerId" = $2`,
      [exerciseId, trainerId]
    )
  } else if (ex.trainerId === null) {
    await pool.query(
      `INSERT INTO "ExerciseOverride" ("trainerId", "exerciseId", "hidden", "updatedAt")
       VALUES ($1, $2, true, NOW())
       ON CONFLICT ("trainerId", "exerciseId")
       DO UPDATE SET "hidden" = true, "updatedAt" = NOW()`,
      [trainerId, exerciseId]
    )
  } else {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  invalidate([`trainer:${trainerId}:exercises`])
  return { ok: true }
}

export async function resetExercise(
  trainerId: string,
  exerciseId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await pool.query(
    `DELETE FROM "ExerciseOverride" WHERE "trainerId" = $1 AND "exerciseId" = $2`,
    [trainerId, exerciseId]
  )
  invalidate([`trainer:${trainerId}:exercises`])
  return { ok: true }
}

export async function listGlobalExercises() {
  const res = await pool.query(
    `SELECT "id", "name", "nameAr", "muscleGroup", "equipment", "tags", "defaultSets", "defaultReps", "defaultRestSeconds", "youtubeUrl"
     FROM "Exercise"
     WHERE "trainerId" IS NULL
     ORDER BY "muscleGroup" ASC, "name" ASC`
  )
  return res.rows as LibraryExercise[]
}
