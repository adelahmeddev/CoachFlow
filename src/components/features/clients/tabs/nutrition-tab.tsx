import Link from "next/link"
import { getCurrentSession } from "@/server/auth"
import {
  getCachedActivePlanFull,
  getPlanHistory,
  getTemplatesForTrainer,
  getTodayMealChoices,
} from "@/server/services/nutrition.service"
import { NutritionBuilder } from "@/components/features/nutrition/nutrition-builder"
import { RefreshFromTemplateButton } from "@/components/features/nutrition/refresh-plan-button"
import { AssignTemplateFromClient } from "@/components/features/nutrition/assign-template-from-client"
import { ChangePlanDialog } from "@/components/features/nutrition/change-plan-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"

export async function NutritionTab({ clientId }: { clientId: string }) {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return <p className="text-destructive">{t.toasts.unauthorized}</p>
  }

  const trainerProfileId = session.user.trainerProfileId
  const [plan, todayChoices, history, templates] = await Promise.all([
    getCachedActivePlanFull(clientId),
    getTodayMealChoices(clientId),
    getPlanHistory(clientId),
    getTemplatesForTrainer(trainerProfileId),
  ])

  const choiceSet = new Set(todayChoices)
  const itemLabels = new Map<string, string>()
  for (const meal of plan?.meals ?? []) {
    for (const item of meal.items) {
      itemLabels.set(item.id, `${meal.name} · ${item.foodName}`)
    }
  }

  const initial = plan
    ? {
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
        supplementDefs: plan.supplementDefs.map((def) => ({
          name: def.name,
          nameAr: def.nameAr ?? "",
          definition: def.definition ?? "",
          definitionAr: def.definitionAr ?? "",
          importance: def.importance ?? "",
          importanceAr: def.importanceAr ?? "",
        })),
        substituteGroups: plan.substituteGroups.map((group) => ({
          category: group.category,
          caloriesLabel: group.caloriesLabel ?? "",
          items: group.items.map((item) => ({
            name: item.name,
            nameAr: item.nameAr ?? "",
            amount: item.amount,
            unit: item.unit,
          })),
        })),
        meals: plan.meals.map((meal) => ({
          kind: meal.kind,
          name: meal.name,
          nameAr: meal.nameAr ?? "",
          items: meal.items.map((item) => ({
            foodName: item.foodName,
            foodNameAr: item.foodNameAr ?? "",
            amount: item.amount,
            unit: item.unit,
            calories: item.calories,
            groupNumber: item.groupNumber,
          })),
        })),
      }
    : null

  return (
    <div className="space-y-6">
      {!initial ? (
        <AssignTemplateFromClient
          clientId={clientId}
          templates={templates.map(tpl => ({
            id: tpl.id,
            name: tpl.name,
            calories: tpl.calories,
            mealsCount: tpl._count.meals,
            isGlobal: tpl.isGlobal,
          }))}
        />
      ) : (
        <>
          {/* KPI summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">{t.nutrition.calories}</p>
                <p className="mt-1 text-2xl font-semibold">{plan.calories ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="mt-1 text-2xl font-semibold">{plan.proteinGrams ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">g</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="mt-1 text-2xl font-semibold">{plan.carbsGrams ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">g</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="mt-1 text-2xl font-semibold">{plan.fatsGrams ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">g</p>
              </CardContent>
            </Card>
            <Card className="p-4">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Water</p>
                <p className="mt-1 text-2xl font-semibold">{plan.waterLiters ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">L</p>
              </CardContent>
            </Card>
          </div>

          {/* Meal overview */}
          <Card>
            <CardHeader>
              <CardTitle>Meals Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {plan.meals.map((meal) => (
                  <div key={meal.id} className="rounded-xl border bg-card p-4">
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{meal.items.length} items</p>
                    <ul className="space-y-1 text-sm">
                      {meal.items.slice(0,3).map((item) => (
                        <li key={item.id} className="truncate text-muted-foreground">
                          {item.foodName} {item.amount ? `${item.amount}${item.unit}` : ""}
                        </li>
                      ))}
                      {meal.items.length > 3 && (
                        <li className="text-xs text-muted-foreground">+{meal.items.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <CardTitle>Basic Info</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {t.nutrition.planFromTemplate.replace(
                    "{name}",
                    plan?.template?.name ?? t.nutrition.customPlanBadge
                  )}
                </Badge>
                <RefreshFromTemplateButton planId={plan.id} clientId={clientId} />
                <ChangePlanDialog clientId={clientId} templates={templates.map(tpl => ({ id: tpl.id, name: tpl.name, calories: tpl.calories, mealsCount: tpl._count.meals, isGlobal: tpl.isGlobal }))} />
                <a href={`/clients/${clientId}/nutrition/edit?section=basic`} target="_blank" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Edit</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><p className="text-muted-foreground">Calories</p><p className="font-medium">{plan.calories} kcal</p></div>
                <div><p className="text-muted-foreground">Protein</p><p className="font-medium">{plan.proteinGrams} g</p></div>
                <div><p className="text-muted-foreground">Carbs</p><p className="font-medium">{plan.carbsGrams} g</p></div>
                <div><p className="text-muted-foreground">Fats</p><p className="font-medium">{plan.fatsGrams} g</p></div>
              </div>
              {plan.coachMessage && <p className="text-sm whitespace-pre-wrap">{plan.coachMessage}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Supplements Definitions</CardTitle>
              <a href={`/clients/${clientId}/nutrition/edit?section=supplements`} target="_blank" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Edit</a>
            </CardHeader>
            <CardContent>
              {plan.supplementDefs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No supplements defined</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.supplementDefs.map((def) => (
                    <div key={def.id} className="rounded-lg border p-3">
                      <p className="font-medium">{def.name}</p>
                      <p className="text-xs text-muted-foreground">{def.importance}</p>
                      <p className="text-sm mt-1">{def.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Substitutes</CardTitle>
              <a href={`/clients/${clientId}/nutrition/edit?section=substitutes`} target="_blank" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Edit</a>
            </CardHeader>
            <CardContent>
              {plan.substituteGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No substitutes defined</p>
              ) : (
                <div className="space-y-3">
                  {plan.substituteGroups.map((g) => (
                    <div key={g.id} className="rounded-lg border p-3">
                      <p className="font-medium">{g.category}</p>
                      <ul className="list-disc pl-5 text-sm mt-1">
                        {g.items.map((it) => <li key={it.id}>{it.name} {it.amount && `${it.amount}${it.unit}`}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Meals & Snacks</CardTitle>
              <a href={`/clients/${clientId}/nutrition/edit?section=meals`} target="_blank" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Edit</a>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.meals.map((meal) => (
                  <div key={meal.id} className="rounded-lg border p-3">
                    <p className="font-medium">{meal.name}</p>
                    <ul className="text-sm mt-1 list-disc pl-5">
                      {meal.items.map((it) => <li key={it.id}>{it.foodName} {it.amount && `${it.amount}${it.unit}`}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.nutrition.todayChoices}</CardTitle>
            </CardHeader>
            <CardContent>
              {todayChoices.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t.nutrition.noChoicesYet}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {todayChoices.map((itemId) => (
                    <div key={itemId} className="flex min-h-[44px] items-center gap-3 rounded-lg border bg-card px-3">
                      <Badge variant="default" className="min-w-[28px] justify-center">✓</Badge>
                      <span className="text-sm break-words">{itemLabels.get(itemId) ?? itemId}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.nutrition.historyTable}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t.profile.overview.noNutritionYet}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.common.date}</TableHead>
                  <TableHead>{t.nutrition.plan}</TableHead>
                  <TableHead>{t.admin.subscriptions.columns.status}</TableHead>
                  <TableHead>{t.nutrition.calories}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.startDate ?? row.createdAt, locale)}</TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {row.template?.name ?? t.nutrition.customPlanBadge}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.calories ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
