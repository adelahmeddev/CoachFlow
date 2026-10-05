"use client"

import { useMemo } from "react"
import { ArrowRight, Check, Plus, Minus, RefreshCw, AlertCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { diffPlans, type PlanDiff, type PlanDiffInput, type DiffStatus } from "@/lib/nutrition-diff"

interface PlanCompareViewProps {
  prevPlan: PlanDiffInput | null
  currPlan: PlanDiffInput
  className?: string
}

export function PlanCompareView({
  prevPlan,
  currPlan,
  className,
}: PlanCompareViewProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const v = t.nutritionVersions

  const diff: PlanDiff = useMemo(() => {
    return diffPlans(prevPlan, currPlan)
  }, [prevPlan, currPlan])

  function statusBadge(status: DiffStatus) {
    switch (status) {
      case "ADDED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
            <Plus className="me-1 size-3" />
            {v.statusAdded}
          </Badge>
        )
      case "REMOVED":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30">
            <Minus className="me-1 size-3" />
            {v.statusRemoved}
          </Badge>
        )
      case "CHANGED":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
            <RefreshCw className="me-1 size-3" />
            {v.statusChanged}
          </Badge>
        )
      case "UNCHANGED":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-border/50">
            {v.statusSame}
          </Badge>
        )
    }
  }

  const macroLabels: Record<string, string> = {
    calories: isAr ? "السعرات الحرارية" : "Calories",
    proteinGrams: isAr ? "البروتين" : "Protein",
    carbsGrams: isAr ? "الكاربوهيدرات" : "Carbohydrates",
    fatsGrams: isAr ? "الدهون" : "Fats",
    waterLiters: isAr ? "الماء" : "Water",
  }

  const macroUnits: Record<string, string> = {
    calories: "kcal",
    proteinGrams: "g",
    carbsGrams: "g",
    fatsGrams: "g",
    waterLiters: "L",
  }

  return (
    <div className={cn("space-y-6", className)}>
      {!diff.hasChanges ? (
        <Card className="rounded-3xl border-dashed p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
            <Check className="size-6 text-emerald-500" />
          </div>
          <h3 className="mt-4 font-bold">{v.noChanges}</h3>
        </Card>
      ) : null}

      {/* 1. Macro Targets Diff */}
      <Card className="glass-card rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>{v.macroTargets}</span>
            {diff.macros.some((m) => m.changed) && (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {diff.macros.filter((m) => m.changed).length} {v.statusChanged.toLowerCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {diff.macros.map((m) => {
              const unit = macroUnits[m.key] ?? ""
              const label = macroLabels[m.key] ?? m.key
              return (
                <div
                  key={m.key}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border p-3 transition-colors",
                    m.changed
                      ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                      : "border-border/40 bg-muted/20"
                  )}
                >
                  <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    {m.changed ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums">
                        <span className="line-through text-muted-foreground">
                          {m.prev ?? "—"} {unit}
                        </span>
                        <ArrowRight className="size-3 text-amber-500 rtl:rotate-180" />
                        <span className="text-amber-600 dark:text-amber-400">
                          {m.curr ?? "—"} {unit}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold tabular-nums">
                        {m.curr ?? "—"} {unit}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Meals & Items Diff */}
      <Card className="glass-card rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span>{v.mealsAndItems}</span>
            <span className="text-xs text-muted-foreground font-normal">
              {diff.meals.length} {isAr ? "وجبات" : "meals"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diff.meals.map((meal, mIdx) => (
            <div
              key={`${meal.name}-${mIdx}`}
              className={cn(
                "rounded-2xl border p-4 transition-all",
                meal.status === "ADDED" && "border-emerald-500/30 bg-emerald-500/5",
                meal.status === "REMOVED" && "border-rose-500/30 bg-rose-500/5 opacity-75",
                meal.status === "CHANGED" && "border-amber-500/30 bg-amber-500/5",
                meal.status === "UNCHANGED" && "border-border/40 bg-muted/10"
              )}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {isAr && meal.nameAr ? meal.nameAr : meal.name}
                  </span>
                  {meal.isSpare && (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {isAr ? "بديل" : "Spare"}
                    </Badge>
                  )}
                </div>
                {statusBadge(meal.status)}
              </div>

              {/* Meal Items */}
              <div className="mt-3 space-y-1.5">
                {meal.items.map((item, iIdx) => (
                  <div
                    key={`${item.foodName}-${iIdx}`}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        item.status === "REMOVED" && "line-through text-muted-foreground"
                      )}>
                        {isAr && item.foodNameAr ? item.foodNameAr : item.foodName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 tabular-nums">
                      {item.status === "CHANGED" ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                          <span className="line-through text-muted-foreground">
                            {item.prevAmount} {item.prevUnit}
                          </span>
                          <ArrowRight className="size-3 rtl:rotate-180" />
                          <span>
                            {item.currAmount} {item.currUnit}
                          </span>
                        </div>
                      ) : item.status === "ADDED" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{item.currAmount} {item.currUnit}
                        </span>
                      ) : item.status === "REMOVED" ? (
                        <span className="text-rose-600 dark:text-rose-400 line-through">
                          {item.prevAmount} {item.prevUnit}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {item.currAmount} {item.currUnit}
                        </span>
                      )}

                      <span className="text-[10px] text-muted-foreground">
                        {statusBadge(item.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 3. Supplements Diff */}
      {diff.supplements.length > 0 && (
        <Card className="glass-card rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>{v.supplements}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diff.supplements.map((sup, sIdx) => (
              <div
                key={`${sup.name}-${sIdx}`}
                className={cn(
                  "flex items-start justify-between rounded-2xl border p-3.5 text-xs transition-all",
                  sup.status === "ADDED" && "border-emerald-500/30 bg-emerald-500/5",
                  sup.status === "REMOVED" && "border-rose-500/30 bg-rose-500/5 opacity-75",
                  sup.status === "CHANGED" && "border-amber-500/30 bg-amber-500/5",
                  sup.status === "UNCHANGED" && "border-border/40 bg-muted/10"
                )}
              >
                <div>
                  <span className="font-bold text-sm">
                    {isAr && sup.nameAr ? sup.nameAr : sup.name}
                  </span>
                  {sup.currDefinition && (
                    <p className="mt-1 text-muted-foreground">
                      {sup.status === "CHANGED" && sup.prevDefinition ? (
                        <span>
                          <span className="line-through">{sup.prevDefinition}</span>{" "}
                          <ArrowRight className="inline size-3 text-amber-500 rtl:rotate-180" />{" "}
                          <span className="text-foreground font-medium">{sup.currDefinition}</span>
                        </span>
                      ) : (
                        sup.currDefinition
                      )}
                    </p>
                  )}
                </div>
                {statusBadge(sup.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
