import { pool, generateId, withTransaction, type PgClient } from "@/lib/db"
import { withCache, invalidate } from "@/lib/cache"
import { MUSCLE_GROUPS } from "@/lib/constants"
import type { LibraryExerciseInput } from "@/lib/validations/exercise"

export interface LibraryExercise {
  id: string
  name: string
  nameAr: string | null
  muscleGroup: string
  subMuscleGroup: string | null
  equipment: string | null
  tags: string[]
  defaultSets: number | null
  defaultReps: number | null
  defaultRestSeconds: number | null
  youtubeUrl: string | null
  isGlobal: boolean
  isCustomized: boolean
  hidden?: boolean
  usageCount: number
}

export async function listExercisesForTrainer(trainerId: string): Promise<LibraryExercise[]> {
  return withCache(
    async () => {
      const res = await pool.query(
        `WITH usage_counts AS (
           SELECT exercise_id, COUNT(*)::int AS cnt
           FROM (
             SELECT COALESCE(
               sde."exerciseId",
               (SELECT e2.id FROM "Exercise" e2
                WHERE (e2."trainerId" = $1 OR e2."trainerId" IS NULL)
                  AND LOWER(TRIM(e2.name)) = LOWER(TRIM(sde."exerciseName"))
                ORDER BY CASE WHEN e2."trainerId" = $1 THEN 0 ELSE 1 END LIMIT 1)
             ) AS exercise_id
             FROM "SplitDayExercise" sde
             JOIN "TrainingSplitDay" tsd ON tsd.id = sde."splitDayId"
             JOIN "TrainingSplit" ts ON ts.id = tsd."splitId"
             JOIN "Client" c ON c.id = ts."clientId"
             WHERE c."trainerId" = $1
             UNION ALL
             SELECT COALESCE(
               tde."exerciseId",
               (SELECT e2.id FROM "Exercise" e2
                WHERE (e2."trainerId" = $1 OR e2."trainerId" IS NULL)
                  AND LOWER(TRIM(e2.name)) = LOWER(TRIM(tde."exerciseName"))
                ORDER BY CASE WHEN e2."trainerId" = $1 THEN 0 ELSE 1 END LIMIT 1)
             ) AS exercise_id
             FROM "TemplateDayExercise" tde
             JOIN "TrainingSplitTemplateDay" tstd ON tstd.id = tde."templateDayId"
             JOIN "TrainingSplitTemplate" tst ON tst.id = tstd."templateId"
             WHERE tst."trainerId" = $1
           ) combined
           WHERE exercise_id IS NOT NULL
           GROUP BY exercise_id
         )
         SELECT e.id,
                COALESCE(o.name, e.name) AS name,
                COALESCE(o."nameAr", e."nameAr") AS "nameAr",
                COALESCE(o."muscleGroup", e."muscleGroup") AS "muscleGroup",
                COALESCE(o."subMuscleGroup", e."subMuscleGroup") AS "subMuscleGroup",
                e.equipment,
                e.tags,
                e."defaultSets",
                e."defaultReps",
                e."defaultRestSeconds",
                COALESCE(o."youtubeUrl", e."youtubeUrl") AS "youtubeUrl",
                (e."trainerId" IS NULL) AS "isGlobal",
                (o."exerciseId" IS NOT NULL) AS "isCustomized",
                COALESCE(o.hidden, false) AS "hidden",
                COALESCE(uc.cnt, 0)::int AS "usageCount"
         FROM "Exercise" e
         LEFT JOIN "ExerciseOverride" o ON o."exerciseId" = e.id AND o."trainerId" = $1
         LEFT JOIN usage_counts uc ON uc.exercise_id = e.id
         WHERE (e."trainerId" IS NULL AND COALESCE(o.hidden, false) = false) OR e."trainerId" = $1
         ORDER BY "usageCount" DESC, COALESCE(o."muscleGroup", e."muscleGroup") ASC, name ASC`,
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
    `SELECT e.id, e.name, e."nameAr", COALESCE(o."muscleGroup", e."muscleGroup") AS "muscleGroup", COALESCE(o."subMuscleGroup", e."subMuscleGroup") AS "subMuscleGroup", e.equipment, e."youtubeUrl"
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
    subMuscleGroup: string | null
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

  const rawMuscle = input.muscleGroup?.trim()
  const muscleGroup = rawMuscle || "chest"
  const subMuscleGroup = input.subMuscleGroup?.trim() || null

  const id = generateId()
  await pool.query(
    `INSERT INTO "Exercise" (
      "id", "trainerId", "name", "nameAr", "muscleGroup", "subMuscleGroup", "equipment", "youtubeUrl", "tags", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '{}', NOW(), NOW())`,
    [
      id,
      trainerId,
      name,
      input.nameAr?.trim() || null,
      muscleGroup,
      subMuscleGroup,
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
      subMuscleGroup,
      equipment: input.equipment?.trim() || null,
      tags: [],
      defaultSets: null,
      defaultReps: null,
      defaultRestSeconds: null,
      youtubeUrl: input.youtubeUrl?.trim() || null,
      isGlobal: false,
      isCustomized: false,
      usageCount: 0,
    },
  }
}

export async function updateExercise(
  trainerId: string,
  exerciseId: string,
  input: LibraryExerciseInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim()
  const rawMuscle = input.muscleGroup?.trim()
  const muscleGroup = rawMuscle || "chest"
  const subMuscleGroup = input.subMuscleGroup?.trim() || null
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
         SET "name" = $1, "nameAr" = $2, "muscleGroup" = $3, "subMuscleGroup" = $4, "equipment" = $5, "youtubeUrl" = $6, "updatedAt" = NOW()
         WHERE "id" = $7 AND "trainerId" = $8`,
        [
          name,
          input.nameAr?.trim() || null,
          muscleGroup,
          subMuscleGroup,
          input.equipment?.trim() || null,
          newUrl,
          exerciseId,
          trainerId,
        ]
      )
    } else if (ex.trainerId === null) {
      // Global exercise override
      await client.query(
        `INSERT INTO "ExerciseOverride" ("trainerId", "exerciseId", "name", "nameAr", "muscleGroup", "subMuscleGroup", "youtubeUrl", "hidden", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
         ON CONFLICT ("trainerId", "exerciseId")
         DO UPDATE SET "name" = EXCLUDED."name",
                       "nameAr" = EXCLUDED."nameAr",
                       "muscleGroup" = EXCLUDED."muscleGroup",
                       "subMuscleGroup" = EXCLUDED."subMuscleGroup",
                       "youtubeUrl" = EXCLUDED."youtubeUrl",
                       "hidden" = false,
                       "updatedAt" = NOW()`,
        [
          trainerId,
          exerciseId,
          name,
          input.nameAr?.trim() || null,
          muscleGroup,
          subMuscleGroup,
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
    `SELECT "id", "name", "nameAr", "muscleGroup", "subMuscleGroup", "equipment", "tags", "defaultSets", "defaultReps", "defaultRestSeconds", "youtubeUrl", 0::int AS "usageCount"
     FROM "Exercise"
     WHERE "trainerId" IS NULL
     ORDER BY "muscleGroup" ASC, "name" ASC`
  )
  return res.rows as LibraryExercise[]
}

export async function assignExercisesToSubMuscle(
  trainerId: string,
  exerciseIds: string[],
  subMuscleGroup: string,
  targetMuscleGroup?: string
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!exerciseIds.length) return { ok: true, count: 0 }
  const cleanSub = subMuscleGroup.trim()

  await withTransaction(async (client) => {
    for (const id of exerciseIds) {
      const exRes = await client.query(
        `SELECT id, "trainerId", "muscleGroup", "name", "nameAr", "youtubeUrl"
         FROM "Exercise"
         WHERE id = $1`,
        [id]
      )
      if (exRes.rowCount === 0) continue
      const ex = exRes.rows[0] as {
        id: string
        trainerId: string | null
        muscleGroup: string
        name: string
        nameAr: string | null
        youtubeUrl: string | null
      }

      if (ex.trainerId === trainerId) {
        // Coach's own exercise
        if (targetMuscleGroup) {
          await client.query(
            `UPDATE "Exercise"
             SET "subMuscleGroup" = $1, "muscleGroup" = $2, "updatedAt" = NOW()
             WHERE "id" = $3 AND "trainerId" = $4`,
            [cleanSub, targetMuscleGroup, id, trainerId]
          )
        } else {
          await client.query(
            `UPDATE "Exercise"
             SET "subMuscleGroup" = $1, "updatedAt" = NOW()
             WHERE "id" = $2 AND "trainerId" = $3`,
            [cleanSub, id, trainerId]
          )
        }
      } else if (ex.trainerId === null) {
        // Global exercise override
        const mGroup = targetMuscleGroup || ex.muscleGroup
        await client.query(
          `INSERT INTO "ExerciseOverride" ("trainerId", "exerciseId", "name", "nameAr", "muscleGroup", "subMuscleGroup", "youtubeUrl", "hidden", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
           ON CONFLICT ("trainerId", "exerciseId")
           DO UPDATE SET "subMuscleGroup" = EXCLUDED."subMuscleGroup",
                         "muscleGroup" = EXCLUDED."muscleGroup",
                         "hidden" = false,
                         "updatedAt" = NOW()`,
          [
            trainerId,
            id,
            ex.name,
            ex.nameAr,
            mGroup,
            cleanSub,
            ex.youtubeUrl,
          ]
        )
      }
    }
  })

  invalidate([`trainer:${trainerId}:exercises`])
  return { ok: true, count: exerciseIds.length }
}

export interface ExerciseVideoSyncItem {
  exerciseId?: string | null
  exerciseName?: string | null
  videoUrl?: string | null
}

export async function syncExerciseVideoUrls(
  client: PgClient | typeof pool,
  trainerId: string,
  exercises: ExerciseVideoSyncItem[]
): Promise<void> {
  if (!exercises.length) return

  const candidates = exercises.filter(
    (ex) => typeof ex.videoUrl === "string" && ex.videoUrl.trim().length > 0
  )
  if (!candidates.length) return

  const seen = new Map<
    string,
    { exerciseId?: string | null; exerciseName: string; videoUrl: string }
  >()
  for (const item of candidates) {
    const url = item.videoUrl!.trim()
    const name = item.exerciseName?.trim() ?? ""
    const key = item.exerciseId ? `id:${item.exerciseId}` : `name:${name.toLowerCase()}`
    seen.set(key, { exerciseId: item.exerciseId ?? null, exerciseName: name, videoUrl: url })
  }

  for (const item of seen.values()) {
    let targetExerciseId = item.exerciseId
    let isTrainerOwned = false
    let isGlobal = false
    let matchedName = item.exerciseName

    if (targetExerciseId) {
      const res = await client.query<{ id: string; trainerId: string | null; name: string }>(
        `SELECT id, "trainerId", name FROM "Exercise" WHERE id = $1 LIMIT 1`,
        [targetExerciseId]
      )
      if (res.rowCount && res.rows[0]) {
        const row = res.rows[0]
        isTrainerOwned = row.trainerId === trainerId
        isGlobal = row.trainerId === null
        matchedName = row.name
      }
    } else if (item.exerciseName) {
      const res = await client.query<{ id: string; trainerId: string | null; name: string }>(
        `SELECT id, "trainerId", name
         FROM "Exercise"
         WHERE (
           ("trainerId" = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)))
           OR
           ("trainerId" IS NULL AND LOWER(TRIM(name)) = LOWER(TRIM($2)))
         )
         ORDER BY CASE WHEN "trainerId" = $1 THEN 0 ELSE 1 END
         LIMIT 1`,
        [trainerId, item.exerciseName]
      )
      if (res.rowCount && res.rows[0]) {
        const row = res.rows[0]
        targetExerciseId = row.id
        isTrainerOwned = row.trainerId === trainerId
        isGlobal = row.trainerId === null
        matchedName = row.name
      }
    }

    if (!targetExerciseId) {
      continue
    }

    if (isTrainerOwned) {
      await client.query(
        `UPDATE "Exercise"
         SET "youtubeUrl" = $1, "updatedAt" = NOW()
         WHERE id = $2 AND "trainerId" = $3`,
        [item.videoUrl, targetExerciseId, trainerId]
      )
    } else if (isGlobal) {
      await client.query(
        `INSERT INTO "ExerciseOverride" ("trainerId", "exerciseId", "youtubeUrl", "hidden", "updatedAt")
         VALUES ($1, $2, $3, false, NOW())
         ON CONFLICT ("trainerId", "exerciseId")
         DO UPDATE SET "youtubeUrl" = EXCLUDED."youtubeUrl", "updatedAt" = NOW()`,
        [trainerId, targetExerciseId, item.videoUrl]
      )
    }

    // Link propagation: update SplitDayExercise in active client splits
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
         AND (sde."videoUrl" IS NULL OR sde."videoUrl" = '')`,
      [item.videoUrl, trainerId, targetExerciseId, matchedName]
    )

    // Link propagation: update TemplateDayExercise in coach's split templates
    await client.query(
      `UPDATE "TemplateDayExercise" tde
       SET "videoUrl" = $1
       FROM "TrainingSplitTemplateDay" tstd
       JOIN "TrainingSplitTemplate" tst ON tst.id = tstd."templateId"
       WHERE tde."templateDayId" = tstd.id
         AND tst."trainerId" = $2
         AND (tde."exerciseId" = $3 OR tde."exerciseName" = $4)
         AND (tde."videoUrl" IS NULL OR tde."videoUrl" = '')`,
      [item.videoUrl, trainerId, targetExerciseId, matchedName]
    )
  }

  invalidate([`trainer:${trainerId}:exercises`])
}


