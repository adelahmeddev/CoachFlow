"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, ChevronDown, Info, Pill, Sparkles, TriangleAlert, CheckCircle2, ArrowUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"
import type { QuantityUnit, SubstituteCategory } from "@/lib/db/enums"
import { toggleMealChoiceAction } from "@/server/actions/nutrition"
import { cn } from "@/lib/utils"
import { MacroConcentricRing } from "@/components/features/nutrition/macro-concentric-ring"
import { MealOverviewCard } from "@/components/features/nutrition/meal-overview-card"
import { MealDetailDrawer } from "@/components/features/nutrition/meal-detail-drawer"

export interface ClientMealView {
  id: string
  kind: "MEAL" | "SNACK"
  name: string
  nameAr: string | null
  isSpare?: boolean
  replacesMealId?: string | null
  items: {
    id: string
    foodName: string
    foodNameAr: string | null
    amount: number | null
    unit: QuantityUnit
    calories: number | null
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
  // Per-group displayed option (main or one spare) + open detail drawer.
  // Display-only — checking an item still flows through toggle() so mutual
  // exclusivity is enforced server-side exactly as before.
  const [activeId, setActiveId] = useState<Record<string, string>>({})
  const [detailMainId, setDetailMainId] = useState<string | null>(null)

  const unitLabel = (unit: QuantityUnit) =>
    unit === "G" ? "g" : unit === "ML" ? "ml" : "pcs"

  function formatAmount(amount: number | null, unit: QuantityUnit) {
    if (amount === null) return ""
    return `${amount} ${unitLabel(unit)}`
  }

  function toggle(itemId: string) {
    if (pending) return
    startTransition(async () => {
      // Find the meal this item belongs to
      let foundMeal: ClientMealView | undefined
      for (const m of plan.meals) {
        if (m.items.some(i => i.id === itemId)) {
          foundMeal = m
          break
        }
      }

      // If we are checking the item
      const willBeChosen = !chosen.has(itemId)
      const itemsToUnselect: string[] = []

      if (willBeChosen && foundMeal) {
        const mainMealId = foundMeal.isSpare ? foundMeal.replacesMealId : foundMeal.id
        const groupMeals = plan.meals.filter(m =>
          m.id === mainMealId || (m.isSpare && m.replacesMealId === mainMealId)
        )

        for (const m of groupMeals) {
          if (m.id !== foundMeal.id) {
            for (const i of m.items) {
              itemsToUnselect.push(i.id)
            }
          }
        }
      }

      setChosen((prev) => {
        const next = new Set(prev)
        if (willBeChosen) {
           next.add(itemId)
           itemsToUnselect.forEach(id => next.delete(id))
        } else {
           next.delete(itemId)
        }
        return next
      })

      const result = await toggleMealChoiceAction(itemId)
      if (!result.ok) {
        toast.error(t.toasts.unauthorized)
        // Note: Ideally revert state here on error
      }
    })
  }

  const mains = useMemo(() => plan.meals.filter((m) => !m.isSpare), [plan.meals])
  const sparesOf = (mainId: string) => plan.meals.filter((m) => m.isSpare && m.replacesMealId === mainId)

  const allItems = useMemo(() => plan.meals.flatMap((m) => m.items), [plan.meals])
  const chosenItems = useMemo(() => allItems.filter((i) => chosen.has(i.id)), [allItems, chosen])
  const consumedKcal = chosenItems.reduce((s, i) => s + (i.calories ?? 0), 0)
  const consumedEstimated = chosenItems.some((i) => i.calories == null)
  const itemsPct = allItems.length > 0 ? chosenItems.length / allItems.length : 0

  const fullyChosen = (m: ClientMealView) => m.items.length > 0 && m.items.every((i) => chosen.has(i.id))
  const completedMains = mains.filter((m) => fullyChosen(m) || sparesOf(m.id).some(fullyChosen))
  const mealsPct = mains.length > 0 ? completedMains.length / mains.length : 0
  const completedIds = useMemo(() => new Set(completedMains.map((m) => m.id)), [completedMains])

  const mealName = (m: ClientMealView) => (isAr && m.nameAr ? m.nameAr : m.name)

  function mealKcalLabel(m: ClientMealView): string {
    if (m.items.length === 0) return "— kcal"
    const known = m.items.filter((i) => i.calories != null)
    if (known.length === 0) return "— kcal"
    const sum = known.reduce((s, i) => s + (i.calories ?? 0), 0)
    return `${known.length < m.items.length ? "~" : ""}${sum} kcal`
  }

  function altCountLabel(count: number): string | null {
    if (count === 0) return null
    if (isAr) {
      if (count === 1) return "يتوفر بديل واحد"
      if (count === 2) return "يتوفر بديلان"
      return `يتوفر ${count} بدائل`
    }
    return count === 1 ? "1 alternative available" : `${count} alternatives available`
  }

  const detailMain = mains.find((m) => m.id === detailMainId) ?? null

  const currentIndex = mains.findIndex((m) => !completedIds.has(m.id))
  const statusFor = (index: number, mainId: string) => {
    if (completedIds.has(mainId)) return "completed" as const
    if (index === currentIndex) return "current" as const
    return "upcoming" as const
  }

  function mealKcalValue(m: ClientMealView): {
    value: number | null
    estimated: boolean
  } {
    if (m.items.length === 0) return { value: null, estimated: false }
    const known = m.items.filter((i) => i.calories != null)
    if (known.length === 0) return { value: null, estimated: false }
    const sum = known.reduce((s, i) => s + (i.calories ?? 0), 0)
    return { value: sum, estimated: known.length < m.items.length }
  }

  return (
    <div className={cn("space-y-6", isAr && "font-[var(--font-arabic)]")}>
      {/* Premium nutrition overview HUD */}
      <MacroConcentricRing
        consumedKcal={consumedKcal}
        consumedEstimated={consumedEstimated}
        targetKcal={plan.calories}
        proteinTarget={plan.proteinGrams}
        carbsTarget={plan.carbsGrams}
        fatsTarget={plan.fatsGrams}
        itemsPct={itemsPct}
        mealsPct={mealsPct}
      />

      {/* Coach message */}
      {plan.coachMessage ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/35 p-5 shadow-glass backdrop-blur-xl transform-gpu dark:bg-neutral-900/40">
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                <Sparkles className="size-4" />
              </span>
              {n.coachMessage}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {plan.coachMessage}
            </p>
          </div>
        </div>
      ) : null}

      {/* Meal cards — responsive premium grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold tracking-tight">
            {isAr ? "وجبات اليوم" : "Today's meals"}
          </h2>
          <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-brand-700 ring-1 ring-brand-500/20 dark:text-brand-300">
            {completedMains.length}/{mains.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mains.map((mainMeal, groupIndex) => {
            const alternatives = sparesOf(mainMeal.id)
            const kcal = mealKcalValue(mainMeal)
            const doneCount = mainMeal.items.filter((i) =>
              chosen.has(i.id)
            ).length
            return (
              <MealOverviewCard
                key={mainMeal.id}
                order={groupIndex + 1}
                title={mealName(mainMeal)}
                kindLabel={mainMeal.kind === "SNACK" ? n.snack : n.meal}
                kcalLabel={mealKcalLabel(mainMeal)}
                kcalValue={kcal.value}
                kcalEstimated={kcal.estimated}
                altCountLabel={altCountLabel(alternatives.length)}
                complete={completedIds.has(mainMeal.id)}
                status={statusFor(groupIndex, mainMeal.id)}
                itemsDone={doneCount}
                itemsTotal={mainMeal.items.length}
                onOpen={() => setDetailMainId(mainMeal.id)}
              />
            )
          })}
        </div>
      </div>

      {/* Detail drawer */}
      <MealDetailDrawer
        open={detailMain !== null}
        onOpenChange={(o) => {
          if (!o) setDetailMainId(null)
        }}
        main={detailMain}
        alternatives={detailMain ? sparesOf(detailMain.id) : []}
        activeId={detailMain ? (activeId[detailMain.id] ?? detailMain.id) : null}
        onActivate={(mealId) => {
          if (detailMain) setActiveId((prev) => ({ ...prev, [detailMain.id]: mealId }))
        }}
        chosen={chosen}
        pending={pending}
        onToggle={toggle}
        formatAmount={formatAmount}
      />

      {/* Substitutes (anchor target for hero deep-link) */}
      <Card id="substitutes" className="glass-card scroll-mt-24 rounded-3xl">
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
                  <ChevronDown className="size-4 shrink-0" />
                  <Badge variant="outline" className="shrink-0">{group.category}</Badge>
                  <span className="text-muted-foreground min-w-0 flex-1">{group.caloriesLabel}</span>
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

      {/* Supplements Definitions */}
      <Card className="glass-card overflow-hidden rounded-3xl">
        <CardHeader className="flex-row items-center gap-3 space-y-0 border-b bg-muted/20">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-performance-500 to-performance-600 text-white shadow-soft">
            <Pill className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{n.supplementsDefinitions}</CardTitle>
          </div>
          {plan.supplementDefs.length > 0 ? (
            <Badge variant="secondary" className="tabular-nums rounded-full shrink-0">
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
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    hasDetails &&
                    setOpenSupplementId((prev) => (prev === def.id ? null : def.id))
                  }
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center gap-3 p-3.5 text-start",
                    hasDetails ? "cursor-pointer hover:bg-accent/50" : "opacity-90"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
                      isOpen
                        ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 py-1">
                    <span className="block font-medium">{name}</span>
                    {!isOpen && definition ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
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
                </div>

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

      {/* Guidelines */}
      {plan.guidelines.length > 0 && (
        <Card className="glass-card rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">{n.guidelines}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.guidelines.map((line, index) => (
                <li key={index} className="flex min-h-[36px] items-start gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="break-words min-w-0 flex-1">{line}</span>
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
                <CardTitle className="text-base text-destructive flex items-center gap-2"><TriangleAlert className="size-4 shrink-0" /> {n.avoidFoods}</CardTitle>
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
                <CardTitle className="text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" /> {n.recommendedFoods}
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
        <ArrowUp className="size-4" />
      </Button>
    </div>
  )
}
