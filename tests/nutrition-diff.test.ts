import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { diffPlans } from "../src/lib/nutrition-diff"

describe("nutrition diff calculation", () => {
  const basePlan = {
    calories: 2000,
    proteinGrams: 150,
    carbsGrams: 200,
    fatsGrams: 60,
    waterLiters: 3,
    coachMessage: "Stay hydrated and hit protein target.",
    meals: [
      {
        name: "Breakfast",
        order: 1,
        kind: "MAIN",
        isSpare: false,
        items: [
          { foodName: "Eggs", amount: 3, unit: "pcs", calories: 210 },
          { foodName: "Oats", amount: 60, unit: "g", calories: 230 },
        ],
      },
      {
        name: "Lunch",
        order: 2,
        kind: "MAIN",
        isSpare: false,
        items: [
          { foodName: "Chicken Breast", amount: 200, unit: "g", calories: 330 },
          { foodName: "Rice", amount: 150, unit: "g", calories: 195 },
        ],
      },
    ],
    supplementDefs: [
      { name: "Creatine", definition: "5g daily", importance: "High" },
    ],
  }

  it("detects no changes when plans are identical", () => {
    const diff = diffPlans(basePlan, basePlan)
    assert.strictEqual(diff.hasChanges, false)
    assert.strictEqual(diff.macros.every((m) => !m.changed), true)
    assert.strictEqual(diff.meals.every((m) => m.status === "UNCHANGED"), true)
    assert.strictEqual(
      diff.supplements.every((s) => s.status === "UNCHANGED"),
      true
    )
  })

  it("detects macro targets changes", () => {
    const updatedPlan = {
      ...basePlan,
      calories: 2200,
      proteinGrams: 175,
    }
    const diff = diffPlans(basePlan, updatedPlan)
    assert.strictEqual(diff.hasChanges, true)

    const calDiff = diff.macros.find((m) => m.key === "calories")
    assert.strictEqual(calDiff?.changed, true)
    assert.strictEqual(calDiff?.prev, 2000)
    assert.strictEqual(calDiff?.curr, 2200)

    const proDiff = diff.macros.find((m) => m.key === "proteinGrams")
    assert.strictEqual(proDiff?.changed, true)
    assert.strictEqual(proDiff?.prev, 150)
    assert.strictEqual(proDiff?.curr, 175)

    const fatDiff = diff.macros.find((m) => m.key === "fatsGrams")
    assert.strictEqual(fatDiff?.changed, false)
  })

  it("detects added and removed meals", () => {
    const updatedPlan = {
      ...basePlan,
      meals: [
        basePlan.meals[0], // Breakfast kept
        {
          name: "Post-workout Snack",
          order: 2,
          kind: "SNACK",
          isSpare: false,
          items: [
            { foodName: "Whey Protein", amount: 30, unit: "g", calories: 120 },
          ],
        },
      ], // Lunch removed
    }

    const diff = diffPlans(basePlan, updatedPlan)
    assert.strictEqual(diff.hasChanges, true)

    const breakfast = diff.meals.find((m) => m.name === "Breakfast")
    assert.strictEqual(breakfast?.status, "UNCHANGED")

    const snack = diff.meals.find((m) => m.name === "Post-workout Snack")
    assert.strictEqual(snack?.status, "ADDED")

    const lunch = diff.meals.find((m) => m.name === "Lunch")
    assert.strictEqual(lunch?.status, "REMOVED")
  })

  it("detects item modifications inside existing meals", () => {
    const updatedPlan = {
      ...basePlan,
      meals: [
        {
          ...basePlan.meals[0],
          items: [
            { foodName: "Eggs", amount: 4, unit: "pcs", calories: 280 }, // amount changed
            { foodName: "Oats", amount: 60, unit: "g", calories: 230 }, // unchanged
            { foodName: "Honey", amount: 15, unit: "g", calories: 45 }, // added item
          ],
        },
        basePlan.meals[1],
      ],
    }

    const diff = diffPlans(basePlan, updatedPlan)
    assert.strictEqual(diff.hasChanges, true)

    const breakfast = diff.meals.find((m) => m.name === "Breakfast")
    assert.strictEqual(breakfast?.status, "CHANGED")

    const eggDiff = breakfast?.items.find((i) => i.foodName === "Eggs")
    assert.strictEqual(eggDiff?.status, "CHANGED")
    assert.strictEqual(eggDiff?.prevAmount, 3)
    assert.strictEqual(eggDiff?.currAmount, 4)

    const honeyDiff = breakfast?.items.find((i) => i.foodName === "Honey")
    assert.strictEqual(honeyDiff?.status, "ADDED")
    assert.strictEqual(honeyDiff?.currAmount, 15)

    const oatsDiff = breakfast?.items.find((i) => i.foodName === "Oats")
    assert.strictEqual(oatsDiff?.status, "UNCHANGED")
  })

  it("detects supplement additions and changes", () => {
    const updatedPlan = {
      ...basePlan,
      supplementDefs: [
        { name: "Creatine", definition: "5g post-workout", importance: "High" },
        { name: "Vitamin D3", definition: "5000 IU daily", importance: "Medium" },
      ],
    }

    const diff = diffPlans(basePlan, updatedPlan)
    assert.strictEqual(diff.hasChanges, true)

    const creatine = diff.supplements.find((s) => s.name === "Creatine")
    assert.strictEqual(creatine?.status, "CHANGED")
    assert.strictEqual(creatine?.prevDefinition, "5g daily")
    assert.strictEqual(creatine?.currDefinition, "5g post-workout")

    const vitD = diff.supplements.find((s) => s.name === "Vitamin D3")
    assert.strictEqual(vitD?.status, "ADDED")
  })

  it("handles null or undefined plans gracefully", () => {
    const diffNull = diffPlans(null, null)
    assert.strictEqual(diffNull.hasChanges, false)

    const diffInitial = diffPlans(null, basePlan)
    assert.strictEqual(diffInitial.hasChanges, true)
    assert.strictEqual(diffInitial.meals.every((m) => m.status === "ADDED"), true)
  })
})
