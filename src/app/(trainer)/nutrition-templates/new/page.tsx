import { NutritionBuilder } from "@/components/features/nutrition/nutrition-builder"
import {
  SUPPLEMENT_DEFS_SEED,
  SUBSTITUTE_GROUPS_SEED,
} from "@/lib/nutrition-fixed"
import { getI18n } from "@/lib/i18n"

export default async function NewNutritionTemplatePage() {
  const { t } = await getI18n()

  const initial = {
    name: "",
    calories: null,
    proteinGrams: null,
    carbsGrams: null,
    fatsGrams: null,
    waterLiters: null,
    coachMessage: "",
    guidelines: [],
    avoidFoods: [],
    recommendedFoods: [],
    supplementDefs: SUPPLEMENT_DEFS_SEED.map((def) => ({
      ...def,
      nameAr: def.nameAr ?? "",
      definition: def.definition ?? "",
      definitionAr: def.definitionAr ?? "",
      importance: def.importance ?? "",
      importanceAr: def.importanceAr ?? "",
    })),
    substituteGroups: SUBSTITUTE_GROUPS_SEED.map((group) => ({
      category: group.category,
      caloriesLabel: group.caloriesLabel ?? null,
      items: group.items.map((item) => ({ ...item, nameAr: item.nameAr ?? "" })),
    })),
    meals: [],
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {t.nutrition.newTemplate}
      </h1>
      <NutritionBuilder mode="template" initial={initial} />
    </div>
  )
}
