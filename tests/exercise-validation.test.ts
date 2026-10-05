import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { libraryExerciseSchema } from "../src/lib/validations/exercise"

describe("libraryExerciseSchema validation", () => {
  const baseValid = {
    name: "Barbell Bench Press",
    muscleGroup: "CHEST",
  }

  it("succeeds with minimal valid exercise", () => {
    const res = libraryExerciseSchema.safeParse(baseValid)
    assert.strictEqual(res.success, true)
    if (res.success) {
      assert.strictEqual(res.data.name, "Barbell Bench Press")
      assert.strictEqual(res.data.muscleGroup, "CHEST")
    }
  })

  it("succeeds with standard YouTube watch URL", () => {
    const res = libraryExerciseSchema.safeParse({
      ...baseValid,
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    })
    assert.strictEqual(res.success, true)
  })

  it("succeeds with youtu.be short link", () => {
    const res = libraryExerciseSchema.safeParse({
      ...baseValid,
      youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
    })
    assert.strictEqual(res.success, true)
  })

  it("succeeds with YouTube shorts link", () => {
    const res = libraryExerciseSchema.safeParse({
      ...baseValid,
      youtubeUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    })
    assert.strictEqual(res.success, true)
  })

  it("succeeds with empty or omitted youtubeUrl", () => {
    const resEmpty = libraryExerciseSchema.safeParse({
      ...baseValid,
      youtubeUrl: "",
    })
    assert.strictEqual(resEmpty.success, true)

    const resOmitted = libraryExerciseSchema.safeParse(baseValid)
    assert.strictEqual(resOmitted.success, true)
  })

  it("fails with invalid non-YouTube URL", () => {
    const res = libraryExerciseSchema.safeParse({
      ...baseValid,
      youtubeUrl: "https://vimeo.com/12345678",
    })
    assert.strictEqual(res.success, false)
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes("youtubeUrl"))
      assert.ok(issue, "Expected youtubeUrl validation error")
    }
  })

  it("fails with arbitrary garbage string for youtubeUrl", () => {
    const res = libraryExerciseSchema.safeParse({
      ...baseValid,
      youtubeUrl: "not-a-url-at-all",
    })
    assert.strictEqual(res.success, false)
  })

  it("fails when name is missing or whitespace", () => {
    const resMissing = libraryExerciseSchema.safeParse({
      muscleGroup: "CHEST",
    })
    assert.strictEqual(resMissing.success, false)

    const resWhitespace = libraryExerciseSchema.safeParse({
      name: "   ",
      muscleGroup: "CHEST",
    })
    assert.strictEqual(resWhitespace.success, false)
  })

  it("allows missing or optional muscleGroup", () => {
    const resMissing = libraryExerciseSchema.safeParse({
      name: "Squats",
    })
    assert.strictEqual(resMissing.success, true)

    const resWhitespace = libraryExerciseSchema.safeParse({
      name: "Squats",
      muscleGroup: "   ",
    })
    assert.strictEqual(resWhitespace.success, true)
  })
})

describe("toExerciseDraft workout builder auto-fill", async () => {
  const { toExerciseDraft } = await import(
    "../src/components/features/training-split/days-editor"
  )

  const library = [
    {
      id: "ex-1",
      name: "Bench Press",
      nameAr: "ضغط الصدر بالبار",
      muscleGroup: "chest",
      equipment: "barbell",
      tags: [],
      defaultSets: null,
      defaultReps: null,
      defaultRestSeconds: null,
      youtubeUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
      isGlobal: true,
    },
    {
      id: "ex-2",
      name: "Incline Dumbbell Press",
      nameAr: "ضغط مائل بالدمبلز",
      muscleGroup: "chest",
      equipment: "dumbbell",
      tags: [],
      defaultSets: null,
      defaultReps: null,
      defaultRestSeconds: null,
      youtubeUrl: "https://youtu.be/0G2_XX7nuAG",
      isGlobal: false,
    },
  ]

  it("auto-populates YouTube video URL when matching by exerciseId", () => {
    const draft = toExerciseDraft(
      { exerciseId: "ex-1", exerciseName: "Bench Press" },
      library
    )
    assert.strictEqual(draft.videoUrl, "https://www.youtube.com/watch?v=rT7DgCr-3pg")
    assert.strictEqual(draft.exerciseId, "ex-1")
  })

  it("auto-populates YouTube video URL when matching by exerciseName case-insensitively", () => {
    const draft = toExerciseDraft(
      { exerciseName: "incline dumbbell press" },
      library
    )
    assert.strictEqual(draft.videoUrl, "https://youtu.be/0G2_XX7nuAG")
    assert.strictEqual(draft.exerciseId, "ex-2")
  })

  it("preserves custom videoUrl if already provided on the exercise", () => {
    const draft = toExerciseDraft(
      {
        exerciseId: "ex-1",
        exerciseName: "Bench Press",
        videoUrl: "https://youtu.be/customLink123",
      },
      library
    )
    assert.strictEqual(draft.videoUrl, "https://youtu.be/customLink123")
  })

  it("safely handles null or undefined exerciseName without throwing TypeError", () => {
    const draftNull = toExerciseDraft(
      { exerciseName: null as any },
      library
    )
    assert.strictEqual(draftNull.exerciseName, "")
    assert.strictEqual(draftNull.videoUrl, "")

    const draftUndefined = toExerciseDraft(
      { exerciseName: undefined as any },
      library
    )
    assert.strictEqual(draftUndefined.exerciseName, "")
    assert.strictEqual(draftUndefined.videoUrl, "")
  })
})
