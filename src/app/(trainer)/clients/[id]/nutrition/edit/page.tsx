import { notFound } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientProfile } from "@/server/services/client-profile.service"
import { getCachedActivePlanFull } from "@/server/services/nutrition.service"
import { NutritionBuilder } from "@/components/features/nutrition/nutrition-builder"
import { getI18n } from "@/lib/i18n"

export default async function NutritionEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getCurrentSession()
  const { t } = await getI18n()

  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    notFound()
  }

  const profile = await getClientProfile(id, session.user.trainerProfileId)
  if (!profile) notFound()

  const plan = await getCachedActivePlanFull(id)
  if (!plan) notFound()

  const initial = {
    name: plan.template?.name ?? t.nutrition.customPlanBadge,
    calories: plan.calories,
    proteinGrams: plan.proteinGrams,
    carbsGrams: plan.carbsGrams,
    fatsGrams: plan.fatsGrams,
    waterLiters: plan.waterLiters,
    coachMessage: plan.coachMessage ?? "",
    guidelines: [...plan.guidelines],
    avoidFoods: [...plan.avoidFoods],
    recommendedFoods: [...plan.recommendedFoods],
    supplementDefs: plan.supplementDefs.map(def => ({
      name: def.name,
      nameAr: def.nameAr ?? "",
      definition: def.definition ?? "",
      definitionAr: def.definitionAr ?? "",
      importance: def.importance ?? "",
      importanceAr: def.importanceAr ?? "",
    })),
    substituteGroups: plan.substituteGroups.map(group => ({
      category: group.category,
      caloriesLabel: group.caloriesLabel ?? "",
      items: group.items.map(item => ({
        name: item.name,
        nameAr: item.nameAr ?? "",
        amount: item.amount,
        unit: item.unit,
      })),
    })),
    meals: plan.meals.map(meal => ({
      kind: meal.kind,
      name: meal.name,
      nameAr: meal.nameAr ?? "",
      items: meal.items.map(item => ({
        foodName: item.foodName,
        foodNameAr: item.foodNameAr ?? "",
        amount: item.amount,
        unit: item.unit,
        calories: item.calories,
        groupNumber: item.groupNumber,
      })),
    })),
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.nutrition.planEditorTitle}</h1>
      <NutritionBuilder mode="plan" initial={initial} planId={plan.id} clientId={id} />
    </div>
  )
}
