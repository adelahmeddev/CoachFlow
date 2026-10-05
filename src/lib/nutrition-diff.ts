export type DiffStatus = "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED"

export interface MacroDiffItem {
  key: "calories" | "proteinGrams" | "carbsGrams" | "fatsGrams" | "waterLiters"
  prev: number | null
  curr: number | null
  changed: boolean
}

export interface MealItemDiff {
  status: DiffStatus
  foodName: string
  foodNameAr?: string | null
  prevAmount?: number | null
  currAmount?: number | null
  prevUnit?: string
  currUnit?: string
  prevCalories?: number | null
  currCalories?: number | null
}

export interface MealDiff {
  status: DiffStatus
  name: string
  nameAr?: string | null
  order: number
  kind: string
  isSpare: boolean
  items: MealItemDiff[]
}

export interface SupplementDiff {
  status: DiffStatus
  name: string
  nameAr?: string | null
  prevDefinition?: string | null
  currDefinition?: string | null
  prevImportance?: string | null
  currImportance?: string | null
}

export interface PlanDiff {
  hasChanges: boolean
  macros: MacroDiffItem[]
  meals: MealDiff[]
  supplements: SupplementDiff[]
  coachMessage?: {
    prev: string | null
    curr: string | null
    changed: boolean
  }
}

interface PlanDiffInputMealItem {
  foodName: string
  foodNameAr?: string | null
  amount?: number | null
  unit: string
  calories?: number | null
}

interface PlanDiffInputMeal {
  name: string
  nameAr?: string | null
  order?: number
  kind?: string
  isSpare?: boolean
  items?: PlanDiffInputMealItem[]
}

interface PlanDiffInputSupplement {
  name: string
  nameAr?: string | null
  definition?: string | null
  definitionAr?: string | null
  importance?: string | null
  importanceAr?: string | null
}

export interface PlanDiffInput {
  calories?: number | null
  proteinGrams?: number | null
  carbsGrams?: number | null
  fatsGrams?: number | null
  waterLiters?: number | null
  coachMessage?: string | null
  meals?: PlanDiffInputMeal[]
  supplementDefs?: PlanDiffInputSupplement[]
}

export function diffPlans(
  prev: PlanDiffInput | null | undefined,
  curr: PlanDiffInput | null | undefined
): PlanDiff {
  if (!curr && !prev) {
    return {
      hasChanges: false,
      macros: [],
      meals: [],
      supplements: [],
    }
  }

  // 1. Macros
  const macroKeys: Array<MacroDiffItem["key"]> = [
    "calories",
    "proteinGrams",
    "carbsGrams",
    "fatsGrams",
    "waterLiters",
  ]

  const macros: MacroDiffItem[] = macroKeys.map((key) => {
    const prevVal = prev ? (prev[key] ?? null) : null
    const currVal = curr ? (curr[key] ?? null) : null
    return {
      key,
      prev: prevVal,
      curr: currVal,
      changed: prevVal !== currVal,
    }
  })

  // Coach message
  const prevMsg = prev?.coachMessage ?? null
  const currMsg = curr?.coachMessage ?? null
  const coachMessage = {
    prev: prevMsg,
    curr: currMsg,
    changed: prevMsg !== currMsg,
  }

  // 2. Meals & Items
  const prevMeals = prev?.meals ?? []
  const currMeals = curr?.meals ?? []

  const meals: MealDiff[] = []
  const usedPrevMealIndices = new Set<number>()

  currMeals.forEach((cMeal, cIdx) => {
    // Match by meal name (case-insensitive)
    const pIdx = prevMeals.findIndex(
      (m, idx) =>
        !usedPrevMealIndices.has(idx) &&
        m.name.trim().toLowerCase() === cMeal.name.trim().toLowerCase()
    )

    if (pIdx !== -1 && prevMeals[pIdx]) {
      usedPrevMealIndices.add(pIdx)
      const pMeal = prevMeals[pIdx]

      // Compare items
      const pItems = pMeal.items ?? []
      const cItems = cMeal.items ?? []
      const itemDiffs: MealItemDiff[] = []
      const usedPrevItemIndices = new Set<number>()

      cItems.forEach((cItem) => {
        const piIdx = pItems.findIndex(
          (item, idx) =>
            !usedPrevItemIndices.has(idx) &&
            item.foodName.trim().toLowerCase() ===
              cItem.foodName.trim().toLowerCase()
        )

        if (piIdx !== -1 && pItems[piIdx]) {
          usedPrevItemIndices.add(piIdx)
          const pItem = pItems[piIdx]
          const isChanged =
            pItem.amount !== cItem.amount ||
            pItem.unit !== cItem.unit ||
            pItem.calories !== cItem.calories ||
            pItem.foodName.trim() !== cItem.foodName.trim()

          itemDiffs.push({
            status: isChanged ? "CHANGED" : "UNCHANGED",
            foodName: cItem.foodName,
            foodNameAr: cItem.foodNameAr ?? pItem.foodNameAr,
            prevAmount: pItem.amount ?? null,
            currAmount: cItem.amount ?? null,
            prevUnit: pItem.unit,
            currUnit: cItem.unit,
            prevCalories: pItem.calories ?? null,
            currCalories: cItem.calories ?? null,
          })
        } else {
          itemDiffs.push({
            status: "ADDED",
            foodName: cItem.foodName,
            foodNameAr: cItem.foodNameAr,
            currAmount: cItem.amount ?? null,
            currUnit: cItem.unit,
            currCalories: cItem.calories ?? null,
          })
        }
      })

      // Items in prev but not curr
      pItems.forEach((pItem, idx) => {
        if (!usedPrevItemIndices.has(idx)) {
          itemDiffs.push({
            status: "REMOVED",
            foodName: pItem.foodName,
            foodNameAr: pItem.foodNameAr,
            prevAmount: pItem.amount ?? null,
            prevUnit: pItem.unit,
            prevCalories: pItem.calories ?? null,
          })
        }
      })

      const hasItemChanges = itemDiffs.some((d) => d.status !== "UNCHANGED")
      const mealMetaChanged =
        pMeal.name.trim() !== cMeal.name.trim() ||
        pMeal.kind !== cMeal.kind ||
        Boolean(pMeal.isSpare) !== Boolean(cMeal.isSpare)

      meals.push({
        status: hasItemChanges || mealMetaChanged ? "CHANGED" : "UNCHANGED",
        name: cMeal.name,
        nameAr: cMeal.nameAr ?? pMeal.nameAr,
        order: cMeal.order ?? cIdx + 1,
        kind: cMeal.kind ?? "MAIN",
        isSpare: Boolean(cMeal.isSpare),
        items: itemDiffs,
      })
    } else {
      // Added meal
      meals.push({
        status: "ADDED",
        name: cMeal.name,
        nameAr: cMeal.nameAr,
        order: cMeal.order ?? cIdx + 1,
        kind: cMeal.kind ?? "MAIN",
        isSpare: Boolean(cMeal.isSpare),
        items: (cMeal.items ?? []).map((item) => ({
          status: "ADDED",
          foodName: item.foodName,
          foodNameAr: item.foodNameAr,
          currAmount: item.amount ?? null,
          currUnit: item.unit,
          currCalories: item.calories ?? null,
        })),
      })
    }
  })

  // Removed meals
  prevMeals.forEach((pMeal, pIdx) => {
    if (!usedPrevMealIndices.has(pIdx)) {
      meals.push({
        status: "REMOVED",
        name: pMeal.name,
        nameAr: pMeal.nameAr,
        order: pMeal.order ?? pIdx + 1,
        kind: pMeal.kind ?? "MAIN",
        isSpare: Boolean(pMeal.isSpare),
        items: (pMeal.items ?? []).map((item) => ({
          status: "REMOVED",
          foodName: item.foodName,
          foodNameAr: item.foodNameAr,
          prevAmount: item.amount ?? null,
          prevUnit: item.unit,
          prevCalories: item.calories ?? null,
        })),
      })
    }
  })

  // 3. Supplements
  const prevDefs = prev?.supplementDefs ?? []
  const currDefs = curr?.supplementDefs ?? []
  const supplements: SupplementDiff[] = []
  const usedPrevDefIndices = new Set<number>()

  currDefs.forEach((cDef) => {
    const pIdx = prevDefs.findIndex(
      (d, idx) =>
        !usedPrevDefIndices.has(idx) &&
        d.name.trim().toLowerCase() === cDef.name.trim().toLowerCase()
    )

    if (pIdx !== -1 && prevDefs[pIdx]) {
      usedPrevDefIndices.add(pIdx)
      const pDef = prevDefs[pIdx]
      const changed =
        pDef.definition !== cDef.definition ||
        pDef.importance !== cDef.importance

      supplements.push({
        status: changed ? "CHANGED" : "UNCHANGED",
        name: cDef.name,
        nameAr: cDef.nameAr ?? pDef.nameAr,
        prevDefinition: pDef.definition ?? null,
        currDefinition: cDef.definition ?? null,
        prevImportance: pDef.importance ?? null,
        currImportance: cDef.importance ?? null,
      })
    } else {
      supplements.push({
        status: "ADDED",
        name: cDef.name,
        nameAr: cDef.nameAr,
        currDefinition: cDef.definition ?? null,
        currImportance: cDef.importance ?? null,
      })
    }
  })

  prevDefs.forEach((pDef, pIdx) => {
    if (!usedPrevDefIndices.has(pIdx)) {
      supplements.push({
        status: "REMOVED",
        name: pDef.name,
        nameAr: pDef.nameAr,
        prevDefinition: pDef.definition ?? null,
        prevImportance: pDef.importance ?? null,
      })
    }
  })

  const hasChanges =
    macros.some((m) => m.changed) ||
    coachMessage.changed ||
    meals.some((m) => m.status !== "UNCHANGED") ||
    supplements.some((s) => s.status !== "UNCHANGED")

  return {
    hasChanges,
    macros,
    meals,
    supplements,
    coachMessage,
  }
}
