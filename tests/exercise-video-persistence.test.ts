import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { syncExerciseVideoUrls, type ExerciseVideoSyncItem } from "../src/server/services/exercise.service"

interface ExecutedQuery {
  sql: string
  params: any[]
}

function createMockClient() {
  const queries: ExecutedQuery[] = []
  const exercisesTable = new Map<string, { id: string; trainerId: string | null; name: string; youtubeUrl: string | null }>()
  const overridesTable = new Map<string, { trainerId: string; exerciseId: string; youtubeUrl: string | null }>()
  const splitDayExercises: Array<{ id: string; splitDayId: string; exerciseId: string; exerciseName: string; videoUrl: string | null }> = []
  const templateDayExercises: Array<{ id: string; templateDayId: string; exerciseId: string; exerciseName: string; videoUrl: string | null }> = []

  const mock = {
    queries,
    exercisesTable,
    overridesTable,
    splitDayExercises,
    templateDayExercises,
    async query(sql: string, params: any[] = []) {
      queries.push({ sql, params })

      // Mock Exercise select by id
      if (sql.includes('SELECT id, "trainerId", name FROM "Exercise" WHERE id = $1')) {
        const ex = exercisesTable.get(params[0])
        return {
          rowCount: ex ? 1 : 0,
          rows: ex ? [{ id: ex.id, trainerId: ex.trainerId, name: ex.name }] : [],
        }
      }

      // Mock Exercise select by name
      if (sql.includes('FROM "Exercise"') && sql.includes('LOWER(TRIM(name)) = LOWER(TRIM($2))')) {
        const trainerId = params[0]
        const searchName = String(params[1]).trim().toLowerCase()
        const all = Array.from(exercisesTable.values())
        // Match trainer-owned first, then global
        const match = all.find((e) => e.trainerId === trainerId && e.name.trim().toLowerCase() === searchName)
          || all.find((e) => e.trainerId === null && e.name.trim().toLowerCase() === searchName)

        return {
          rowCount: match ? 1 : 0,
          rows: match ? [{ id: match.id, trainerId: match.trainerId, name: match.name }] : [],
        }
      }

      // Mock Exercise update
      if (sql.includes('UPDATE "Exercise"') && sql.includes('SET "youtubeUrl" = $1')) {
        const [youtubeUrl, exerciseId, trainerId] = params
        const ex = exercisesTable.get(exerciseId)
        if (ex && ex.trainerId === trainerId) {
          ex.youtubeUrl = youtubeUrl
        }
        return { rowCount: 1, rows: [] }
      }

      // Mock ExerciseOverride upsert
      if (sql.includes('INSERT INTO "ExerciseOverride"') && sql.includes('ON CONFLICT ("trainerId", "exerciseId")')) {
        const [trainerId, exerciseId, youtubeUrl] = params
        const key = `${trainerId}:${exerciseId}`
        overridesTable.set(key, { trainerId, exerciseId, youtubeUrl })
        return { rowCount: 1, rows: [] }
      }

      // Mock SplitDayExercise / TemplateDayExercise propagation updates
      if (sql.includes('UPDATE "SplitDayExercise"') || sql.includes('UPDATE "TemplateDayExercise"')) {
        return { rowCount: 1, rows: [] }
      }

      return { rowCount: 0, rows: [] }
    },
  }

  return mock
}

describe("syncExerciseVideoUrls permanent persistence", () => {
  it("persists videoUrl to custom trainer-owned exercise in Exercise table", async () => {
    const mock = createMockClient()
    mock.exercisesTable.set("custom-1", {
      id: "custom-1",
      trainerId: "trainer-alpha",
      name: "Custom Incline Press",
      youtubeUrl: null,
    })

    const items: ExerciseVideoSyncItem[] = [
      {
        exerciseId: "custom-1",
        exerciseName: "Custom Incline Press",
        videoUrl: "https://www.youtube.com/watch?v=customVideo123",
      },
    ]

    await syncExerciseVideoUrls(mock as any, "trainer-alpha", items)

    const ex = mock.exercisesTable.get("custom-1")
    assert.ok(ex)
    assert.strictEqual(ex?.youtubeUrl, "https://www.youtube.com/watch?v=customVideo123")
  })

  it("persists videoUrl to global exercise via ExerciseOverride scoped to the trainer", async () => {
    const mock = createMockClient()
    mock.exercisesTable.set("global-1", {
      id: "global-1",
      trainerId: null,
      name: "Barbell Bench Press",
      youtubeUrl: null, // Global has no default or system video
    })

    const items: ExerciseVideoSyncItem[] = [
      {
        exerciseId: "global-1",
        exerciseName: "Barbell Bench Press",
        videoUrl: "https://youtu.be/globalBenchVideo456",
      },
    ]

    await syncExerciseVideoUrls(mock as any, "trainer-alpha", items)

    // Global Exercise row remains unchanged (unpolluted for other trainers)
    const globalEx = mock.exercisesTable.get("global-1")
    assert.strictEqual(globalEx?.youtubeUrl, null)

    // ExerciseOverride row created for trainer-alpha
    const overrideAlpha = mock.overridesTable.get("trainer-alpha:global-1")
    assert.ok(overrideAlpha)
    assert.strictEqual(overrideAlpha?.youtubeUrl, "https://youtu.be/globalBenchVideo456")

    // Trainer-beta has no override
    const overrideBeta = mock.overridesTable.get("trainer-beta:global-1")
    assert.strictEqual(overrideBeta, undefined)
  })

  it("resolves and persists exercise by name if exerciseId is not set", async () => {
    const mock = createMockClient()
    mock.exercisesTable.set("global-2", {
      id: "global-2",
      trainerId: null,
      name: "Dumbbell Lateral Raise",
      youtubeUrl: null,
    })

    const items: ExerciseVideoSyncItem[] = [
      {
        exerciseId: null,
        exerciseName: "dumbbell lateral raise", // Case-insensitive match
        videoUrl: "https://youtu.be/lateralRaise789",
      },
    ]

    await syncExerciseVideoUrls(mock as any, "trainer-alpha", items)

    const override = mock.overridesTable.get("trainer-alpha:global-2")
    assert.ok(override)
    assert.strictEqual(override?.youtubeUrl, "https://youtu.be/lateralRaise789")
  })

  it("skips and never clears existing library link when videoUrl is empty or whitespace", async () => {
    const mock = createMockClient()
    mock.exercisesTable.set("custom-2", {
      id: "custom-2",
      trainerId: "trainer-alpha",
      name: "Barbell Curl",
      youtubeUrl: "https://youtu.be/existingCurlLink",
    })

    const items: ExerciseVideoSyncItem[] = [
      {
        exerciseId: "custom-2",
        exerciseName: "Barbell Curl",
        videoUrl: "   ", // Blank in template
      },
      {
        exerciseId: "custom-2",
        exerciseName: "Barbell Curl",
        videoUrl: "",
      },
      {
        exerciseId: "custom-2",
        exerciseName: "Barbell Curl",
        videoUrl: null,
      },
    ]

    await syncExerciseVideoUrls(mock as any, "trainer-alpha", items)

    // Existing URL remains intact
    const ex = mock.exercisesTable.get("custom-2")
    assert.strictEqual(ex?.youtubeUrl, "https://youtu.be/existingCurlLink")
    // No update query executed
    const updateQueries = mock.queries.filter((q) => q.sql.includes('UPDATE "Exercise"'))
    assert.strictEqual(updateQueries.length, 0)
  })

  it("deduplicates multiple entries of the same exercise and uses latest non-empty videoUrl", async () => {
    const mock = createMockClient()
    mock.exercisesTable.set("custom-3", {
      id: "custom-3",
      trainerId: "trainer-alpha",
      name: "Squats",
      youtubeUrl: null,
    })

    const items: ExerciseVideoSyncItem[] = [
      {
        exerciseId: "custom-3",
        exerciseName: "Squats",
        videoUrl: "https://youtu.be/firstLink",
      },
      {
        exerciseId: "custom-3",
        exerciseName: "Squats",
        videoUrl: "https://youtu.be/latestLink",
      },
    ]

    await syncExerciseVideoUrls(mock as any, "trainer-alpha", items)

    const ex = mock.exercisesTable.get("custom-3")
    assert.strictEqual(ex?.youtubeUrl, "https://youtu.be/latestLink")
  })
})
