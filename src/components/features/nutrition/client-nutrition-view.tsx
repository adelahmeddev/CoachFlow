"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, ChevronDown, Info, Pill, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import type { QuantityUnit, SubstituteCategory } from "@/generated/prisma/enums"
import { toggleMealChoiceAction } from "@/server/actions/nutrition"
import { cn } from "@/lib/utils"

export interface ClientMealView {
  id: string
  kind: "MEAL" | "SNACK"
  name: string
  nameAr: string | null
  items: {
    id: string
    foodName: string
    foodNameAr: string | null
    amount: number | null
    unit: QuantityUnit
    groupNumber: number
  }[]
}

export interface ClientPlanView {
  coachMessage: string | null
  calories: number | null
  proteinGrams: number | null
  carbsGrams: number | null
  fatsGrams: number | null
  waterLiters: number | null
  guidelines: string[]
  avoidFoods: string[]
  recommendedFoods: string[]
  meals: ClientMealView[]
  supplementDefs: {
    id: string
    name: string
    nameAr: string | null
    definition: string | null
    definitionAr: string | null
    importance: string | null
    importanceAr: string | null
  }[]
  substituteGroups: {
    id: string
    category: SubstituteCategory
    caloriesLabel: string | null
    items: {
      id: string
      name: string
      nameAr: string | null
      amount: number | null
      unit: QuantityUnit
    }[]
  }[]
}

const CATEGORY_ORDER: SubstituteCategory[] = ["CARB", "PROTEIN", "FAT", "FRUIT"]

export function ClientNutritionView({
  plan,
  chosenItemIds,
}: {
  plan: ClientPlanView
  chosenItemIds: string[]
}) {
  const { t, locale } = useI18n()
  const n = t.nutrition
  const isAr = locale === "ar"
  const [pending, startTransition] = useTransition()
  const [chosen, setChosen] = useState<Set<string>>(new Set(chosenItemIds))
  const [openSupplementId, setOpenSupplementId] = useState<string | null>(null)

  const unitLabel = (unit: QuantityUnit) =>
    unit === "G" ? "g" : unit === "ML" ? "ml" : "pcs"

  function formatAmount(amount: number | null, unit: QuantityUnit) {
    if (amount === null) return ""
    return `${amount} ${unitLabel(unit)}`
  }

  function toggle(itemId: string) {
    if (pending) return
    startTransition(async () => {
      const result = await toggleMealChoiceAction(itemId)
      if (!result.ok) {
        toast.error(t.toasts.unauthorized)
        return
      }
      setChosen((prev) => {
        const next = new Set(prev)
        if (result.chosen) next.add(itemId)
        else next.delete(itemId)
        return next
      })
    })
  }

  const groupsByMeal = useMemo(() => {
    return plan.meals.map((meal) => {
      const counts = new Map<number, number>()
      for (const item of meal.items) {
        counts.set(item.groupNumber, (counts.get(item.groupNumber) ?? 0) + 1)
      }
      return counts
    })
  }, [plan.meals])

  return (
    <div className="space-y-6">
      {/* Coach message */}
      {plan.coachMessage ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">{n.coachMessage}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isAr ? "font-[var(--font-arabic)]" : ""}`}>
              {plan.coachMessage}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* 1 Supplements Definitions */}
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Pill className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{n.supplementsDefinitions}</CardTitle>
          </div>
          {plan.supplementDefs.length > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {plan.supplementDefs.length}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-2.5 md:grid-cols-2">
          {plan.supplementDefs.map((def, index) => {
            const name = isAr && def.nameAr ? def.nameAr : def.name
            const definition =
              isAr && def.definitionAr ? def.definitionAr : def.definition
            const importance =
              isAr && def.importanceAr ? def.importanceAr : def.importance
            const isOpen = openSupplementId === def.id
            const hasDetails = Boolean(definition || importance)
            return (
              <div
                key={def.id}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors md:self-start",
                  isOpen &&
                    "border-brand-500/40 bg-brand-500/[0.03] md:col-span-full dark:border-brand-400/30"
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    hasDetails &&
                    setOpenSupplementId((prev) => (prev === def.id ? null : def.id))
                  }
                  aria-expanded={isOpen}
                  disabled={!hasDetails}
                  className={cn(
                    "flex w-full items-center gap-3 p-3.5 text-start",
                    hasDetails && "cursor-pointer hover:bg-accent/50"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
                      isOpen
                        ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name}</span>
                    {!isOpen && definition ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {definition}
                      </span>
                    ) : null}
                  </span>
                  {hasDetails ? (
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  ) : (
                    <Pill className="size-4 shrink-0 text-muted-foreground/50" />
                  )}
                </button>

                {isOpen ? (
                  <div className="space-y-2.5 border-t px-3.5 pb-3.5 pt-3">
                    {definition ? (
                      <div className="rounded-lg bg-muted/60 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          <Info className="size-3.5 shrink-0" />
                          {n.definition}
                        </p>
                        <p className="break-words text-sm leading-relaxed">
                          {definition}
                        </p>
                      </div>
                    ) : null}
                    {importance ? (
                      <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brand-700 dark:text-brand-300">
                          <Sparkles className="size-3.5 shrink-0" />
                          {n.importance}
                        </p>
                        <p className="break-words text-sm leading-relaxed">
                          {importance}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 2 Meals */}
      {plan.meals.map((meal, mealIndex) => {
        const counts = groupsByMeal[mealIndex]
        const mealName = isAr && meal.nameAr ? meal.nameAr : meal.name
        return (
          <Card key={meal.id}>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Badge variant={meal.kind === "SNACK" ? "secondary" : "default"}>
                {meal.kind === "SNACK" ? n.snack : n.meal}
              </Badge>
              <CardTitle className="text-base">{mealName}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {meal.items.map((item) => {
                  const count = counts.get(item.groupNumber) ?? 0
                  const isChosen = chosen.has(item.id)
                  const label =
                    isAr && item.foodNameAr ? item.foodNameAr : item.foodName
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        disabled={pending}
                        className={`flex min-h-[48px] w-full items-center gap-2 rounded-xl border p-3 text-start transition-colors ${
                          isChosen
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            isChosen ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40"
                          }`}
                        >
                          {isChosen && <Check className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm">
                          {label}
                          {item.amount !== null && (
                            <span className="ms-1 text-muted-foreground">
                              ({formatAmount(item.amount, item.unit)})
                            </span>
                          )}
                        </span>
                        {count > 1 && (
                          <Badge variant="outline" className="shrink-0">{n.chooseOne}</Badge>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )
      })}

      {/* 3 Macros: Calories — Protein — Carbs — Fat — Water */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {([
          [n.calories, plan.calories, ""],
          [n.protein, plan.proteinGrams, "g"],
          [n.carbs, plan.carbsGrams, "g"],
          [n.fat, plan.fatsGrams, "g"],
          [n.water, plan.waterLiters, "L"],
        ] as const).map(([label, value, unit]) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-semibold">
              {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ""}` : "—"}
            </p>
          </Card>
        ))}
      </div>

      {/* 4 Substitutes (collapsible) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{n.substitutes}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...plan.substituteGroups]
            .sort(
              (a, b) =>
                CATEGORY_ORDER.indexOf(a.category) -
                CATEGORY_ORDER.indexOf(b.category)
            )
            .map((group) => (
              <details key={group.id} className="rounded-xl border">
                <summary className="flex min-h-[48px] cursor-pointer items-center gap-2 p-3 text-sm font-medium">
                  <ChevronDown className="size-4" />
                  <Badge variant="outline">{group.category}</Badge>
                  <span className="text-muted-foreground">{group.caloriesLabel}</span>
                </summary>
                <ul className="grid grid-cols-1 gap-x-4 border-t px-3 py-2 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={item.id} className="min-h-[32px] py-1 text-sm">
                      {isAr && item.nameAr ? item.nameAr : item.name}
                      {item.amount !== null && (
                        <span className="ms-1 text-muted-foreground">
                          · {formatAmount(item.amount, item.unit)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
        </CardContent>
      </Card>

      {/* Guidelines */}
      {plan.guidelines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{n.guidelines}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.guidelines.map((line, index) => (
                <li key={index} className="flex min-h-[36px] items-start gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Avoid / Recommended */}
      {(plan.avoidFoods.length > 0 || plan.recommendedFoods.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plan.avoidFoods.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-destructive">⚠ {n.avoidFoods}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {plan.avoidFoods.map((food, i) => (
                  <Badge key={i} variant="destructive" className="break-words">{food}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
          {plan.recommendedFoods.length > 0 && (
            <Card className="border-emerald-500/40 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-emerald-600 dark:text-emerald-400">
                  ✓ {n.recommendedFoods}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {plan.recommendedFoods.map((food, i) => (
                  <Badge key={i} variant="secondary" className="break-words">{food}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Button variant="outline" className="w-full min-h-[44px] md:hidden" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        ↑
      </Button>
    </div>
  )
}
