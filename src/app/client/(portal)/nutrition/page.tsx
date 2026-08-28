import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import {
  getCachedActivePlanFull,
  getTodayMealChoices,
} from "@/server/services/nutrition.service"
import {
  ClientNutritionView,
  type ClientPlanView,
} from "@/components/features/nutrition/client-nutrition-view"
import { Card, CardContent } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"

export default async function ClientNutritionPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const [plan, chosenItemIds] = await Promise.all([
    getCachedActivePlanFull(clientId),
    getTodayMealChoices(clientId),
  ])

  if (!plan) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            {t.nutrition.emptyTitle}
          </CardContent>
        </Card>
      </div>
    )
  }

  const view: ClientPlanView = {
    coachMessage: plan.coachMessage ?? null,
    calories: plan.calories,
    proteinGrams: plan.proteinGrams,
    carbsGrams: plan.carbsGrams,
    fatsGrams: plan.fatsGrams,
    waterLiters: plan.waterLiters,
    guidelines: [...plan.guidelines],
    avoidFoods: [...plan.avoidFoods],
    recommendedFoods: [...plan.recommendedFoods],
    meals: plan.meals.map((meal) => ({
      id: meal.id,
      kind: meal.kind,
      name: meal.name,
      nameAr: meal.nameAr,
      items: meal.items.map((item) => ({
        id: item.id,
        foodName: item.foodName,
        foodNameAr: item.foodNameAr,
        amount: item.amount,
        unit: item.unit,
        groupNumber: item.groupNumber,
      })),
    })),
    supplementDefs: plan.supplementDefs.map((def) => ({
      id: def.id,
      name: def.name,
      nameAr: def.nameAr,
      definition: def.definition,
      definitionAr: def.definitionAr,
      importance: def.importance,
      importanceAr: def.importanceAr,
    })),
    substituteGroups: plan.substituteGroups.map((group) => ({
      id: group.id,
      category: group.category,
      caloriesLabel: group.caloriesLabel,
      items: group.items.map((item) => ({
        id: item.id,
        name: item.name,
        nameAr: item.nameAr,
        amount: item.amount,
        unit: item.unit,
      })),
    })),
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {t.nutrition.dailyPlan}
      </h1>
      <ClientNutritionView plan={view} chosenItemIds={chosenItemIds} />
    </div>
  )
}
