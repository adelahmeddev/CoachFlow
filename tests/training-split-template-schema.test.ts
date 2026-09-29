import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { trainingSplitTemplateSchema } from "../src/lib/validations/training-split-template"
import { SplitType, TrainingDayFocus } from "../src/lib/db/enums"

describe("trainingSplitTemplateSchema customSplitName validation", () => {
  const baseDay = {
    focus: TrainingDayFocus.FULL_BODY,
    exercises: [],
  }

  it("fails when splitType is CUSTOM and customSplitName is missing or whitespace", () => {
    const resultMissing = trainingSplitTemplateSchema.safeParse({
      name: "My Custom Template",
      splitType: SplitType.CUSTOM,
      daysPerWeek: 3,
      days: [baseDay],
    })
    assert.strictEqual(resultMissing.success, false)
    if (!resultMissing.success) {
      const error = resultMissing.error.issues.find(
        (issue) => issue.path.includes("customSplitName")
      )
      assert.ok(error, "Expected customSplitName error")
      assert.strictEqual(
        error?.message,
        "Custom split name is required when split type is Custom"
      )
    }

    const resultWhitespace = trainingSplitTemplateSchema.safeParse({
      name: "My Custom Template",
      splitType: SplitType.CUSTOM,
      customSplitName: "   ",
      daysPerWeek: 3,
      days: [baseDay],
    })
    assert.strictEqual(resultWhitespace.success, false)
  })

  it("succeeds when splitType is CUSTOM and customSplitName is provided", () => {
    const result = trainingSplitTemplateSchema.safeParse({
      name: "My Custom Template",
      splitType: SplitType.CUSTOM,
      customSplitName: "Arnold 6-Day Split",
      daysPerWeek: 3,
      days: [baseDay],
    })
    assert.strictEqual(result.success, true)
    if (result.success) {
      assert.strictEqual(result.data.customSplitName, "Arnold 6-Day Split")
    }
  })

  it("succeeds when splitType is standard (e.g. FULL_BODY) without customSplitName", () => {
    const result = trainingSplitTemplateSchema.safeParse({
      name: "Full Body Template",
      splitType: SplitType.FULL_BODY,
      daysPerWeek: 3,
      days: [baseDay],
    })
    assert.strictEqual(result.success, true)
  })

  it("fails when customSplitName exceeds 80 characters", () => {
    const result = trainingSplitTemplateSchema.safeParse({
      name: "My Custom Template",
      splitType: SplitType.CUSTOM,
      customSplitName: "a".repeat(81),
      daysPerWeek: 3,
      days: [baseDay],
    })
    assert.strictEqual(result.success, false)
  })
})
