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

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientNutritionPage() {
  const { t, locale } = await getI18n()
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
      <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-energy-500/[0.03] to-transparent" aria-hidden="true" />
        <div className="absolute -right-10 -top-10 size-24 rounded-full bg-gradient-to-br from-brand-500/15 to-energy-500/10 blur-xl" aria-hidden="true" />
        <div className="relative p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15">
            <span aria-hidden="true">🍽️</span>
            {t.nutrition.dailyPlan}
          </div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">
            {t.nutrition.dailyPlan}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "ar" ? "اضغط على الأكلة اللي كلتها النهاردة — التزامك بيفرق" : "Tap what you ate today — adherence matters"}
          </p>
        </div>
      </div>
      <ClientNutritionView plan={view} chosenItemIds={chosenItemIds} />
    </div>
  )
}
