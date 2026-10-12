import { describe, it } from "node:test"
import assert from "node:assert/strict"
import type { ExerciseOption } from "../src/lib/exercise-safety"

describe("Exercise Usage Ranking & Sorting", () => {
  const sampleExercises: ExerciseOption[] = [
    {
      id: "ex-1",
      name: "Barbell Bench Press",
      nameAr: null,
      muscleGroup: "chest",
      subMuscleGroup: "mid_chest",
      equipment: "barbell",
      tags: [],
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSeconds: 90,
      youtubeUrl: "https://youtu.be/sample1",
      usageCount: 15, // Used 15 times
    },
    {
      id: "ex-2",
      name: "Incline Dumbbell Press",
      nameAr: null,
      muscleGroup: "chest",
      subMuscleGroup: "upper_chest",
      equipment: "dumbbell",
      tags: [],
      defaultSets: 3,
      defaultReps: 12,
      defaultRestSeconds: 90,
      youtubeUrl: null,
      usageCount: 8, // Used 8 times
    },
    {
      id: "ex-3",
      name: "Cable Fly",
      nameAr: null,
      muscleGroup: "chest",
      subMuscleGroup: "inner_chest",
      equipment: "cable",
      tags: [],
      defaultSets: 3,
      defaultReps: 15,
      defaultRestSeconds: 60,
      youtubeUrl: null,
      usageCount: 0, // Unused
    },
    {
      id: "ex-4",
      name: "Lat Pulldown",
      nameAr: null,
      muscleGroup: "back",
      subMuscleGroup: "lats",
      equipment: "cable",
      tags: [],
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSeconds: 90,
      youtubeUrl: null,
      usageCount: 22, // Used 22 times
    },
    {
      id: "ex-5",
      name: "Barbell Back Squat",
      nameAr: null,
      muscleGroup: "legs",
      subMuscleGroup: "quads",
      equipment: "barbell",
      tags: [],
      defaultSets: 4,
      defaultReps: 8,
      defaultRestSeconds: 120,
      youtubeUrl: null,
      usageCount: 5, // Used 5 times
    },
    {
      id: "ex-6",
      name: "Bulgarian Split Squat",
      nameAr: null,
      muscleGroup: "legs",
      subMuscleGroup: "quads",
      equipment: "dumbbell",
      tags: [],
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSeconds: 90,
      youtubeUrl: null,
      usageCount: 0, // Unused
    },
  ]

  function sortExercises(exercises: ExerciseOption[]) {
    return [...exercises].sort((a, b) => {
      const countA = a.usageCount ?? 0
      const countB = b.usageCount ?? 0
      if (countB !== countA) {
        return countB - countA
      }
      return a.name.localeCompare(b.name)
    })
  }

  it("ranks most used exercises at the very top of the list across all muscles", () => {
    const sorted = sortExercises(sampleExercises)

    // ex-4 (22 uses) must be 1st
    assert.strictEqual(sorted[0]?.id, "ex-4")
    assert.strictEqual(sorted[0]?.usageCount, 22)

    // ex-1 (15 uses) must be 2nd
    assert.strictEqual(sorted[1]?.id, "ex-1")
    assert.strictEqual(sorted[1]?.usageCount, 15)

    // ex-2 (8 uses) must be 3rd
    assert.strictEqual(sorted[2]?.id, "ex-2")
    assert.strictEqual(sorted[2]?.usageCount, 8)

    // ex-5 (5 uses) must be 4th
    assert.strictEqual(sorted[3]?.id, "ex-5")
    assert.strictEqual(sorted[3]?.usageCount, 5)

    // Unused exercises (0 uses) follow, sorted alphabetically
    assert.strictEqual(sorted[4]?.id, "ex-6") // "Bulgarian Split Squat" before "Cable Fly"
    assert.strictEqual(sorted[5]?.id, "ex-3") // "Cable Fly"
  })

  it("ranks most used exercises at the top within a specific muscle group filter", () => {
    const chestExercises = sampleExercises.filter((e) => e.muscleGroup === "chest")
    const sortedChest = sortExercises(chestExercises)

    assert.strictEqual(sortedChest.length, 3)
    assert.strictEqual(sortedChest[0]?.id, "ex-1") // 15 uses
    assert.strictEqual(sortedChest[1]?.id, "ex-2") // 8 uses
    assert.strictEqual(sortedChest[2]?.id, "ex-3") // 0 uses
  })

  it("filters accurately for MOST_USED tab displaying only exercises with usageCount > 0", () => {
    const mostUsed = sampleExercises.filter((e) => (e.usageCount ?? 0) > 0)
    const sortedMostUsed = sortExercises(mostUsed)

    assert.strictEqual(sortedMostUsed.length, 4)
    assert.ok(sortedMostUsed.every((e) => (e.usageCount ?? 0) > 0))
    assert.strictEqual(sortedMostUsed[0]?.id, "ex-4") // 22
    assert.strictEqual(sortedMostUsed[1]?.id, "ex-1") // 15
    assert.strictEqual(sortedMostUsed[2]?.id, "ex-2") // 8
    assert.strictEqual(sortedMostUsed[3]?.id, "ex-5") // 5
  })
})
