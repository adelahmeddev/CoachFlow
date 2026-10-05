"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CircleDashed,
  Sparkles,
  Calendar,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toDateKey, addDaysToDateKey } from "@/lib/calculations/week-schedule"
import type { DayMealLog, DayAdherence } from "@/server/services/nutrition.service"

interface CoachMealLogProps {
  clientId: string
  mealLog: DayMealLog
  adherence: DayAdherence[]
}

export function CoachMealLog({
  clientId,
  mealLog,
  adherence,
}: CoachMealLogProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const m = t.mealLog
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const todayStr = toDateKey(new Date())
  const isToday = mealLog.date === todayStr

  function navigateToDate(targetDate: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "nutrition")
    params.set("date", targetDate)
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}#meal-log`, { scroll: false })
    })
  }

  function handlePrevDay() {
    navigateToDate(addDaysToDateKey(mealLog.date, -1))
  }

  function handleNextDay() {
    if (isToday) return
    navigateToDate(addDaysToDateKey(mealLog.date, 1))
  }

  const completedMeals = mealLog.meals.filter((meal) => meal.isDone)
  const remainingMeals = mealLog.meals.filter((meal) => !meal.isDone)

  const formattedDate = new Date(mealLog.date).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  )

  return (
    <Card id="meal-log" className="glass-card scroll-mt-24 rounded-3xl overflow-hidden border">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-brand-300">
              <UtensilsCrossed className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>{m.title}</span>
                {isToday && (
                  <Badge variant="outline" className="border-brand-500/30 bg-brand-500/10 text-[10px] text-brand-600 dark:text-brand-300">
                    {m.today}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{m.subtitle}</p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-full border bg-muted/40 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              onClick={handlePrevDay}
              disabled={isPending}
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
            </Button>

            <span className="min-w-28 text-center text-xs font-bold tabular-nums">
              {isToday ? `${m.today} (${formattedDate})` : formattedDate}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              onClick={handleNextDay}
              disabled={isToday || isPending}
              aria-label="Next day"
            >
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Button>

            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2.5 text-[11px] font-bold"
                onClick={() => navigateToDate(todayStr)}
                disabled={isPending}
              >
                {m.today}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress & Adherence Overview */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border bg-muted/20 p-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {m.completed}
              </span>
              <span className="text-sm font-extrabold tabular-nums">
                {m.doneCount
                  .replace("{done}", String(mealLog.doneMeals))
                  .replace("{total}", String(mealLog.totalMeals))}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300"
                style={{
                  width: `${mealLog.totalMeals > 0 ? (mealLog.doneMeals / mealLog.totalMeals) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center sm:border-s sm:ps-6 border-border/60">
            <div className="text-center">
              <span className="text-2xl font-black tabular-nums tracking-tight">
                {mealLog.adherencePercent}%
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {m.adherenceTitle}
              </p>
            </div>
          </div>
        </div>

        {/* 7-Day Adherence Strip */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {m.adherenceTitle}
          </p>
          <div className="grid grid-cols-7 gap-2">
            {adherence.map((day) => {
              const isSelected = day.date === mealLog.date
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => navigateToDate(day.date)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all text-center",
                    isSelected
                      ? "border-brand-500 bg-brand-500/10 shadow-sm ring-1 ring-brand-500/30"
                      : "border-border/50 bg-background/50 hover:border-brand-500/40 hover:bg-muted/30"
                  )}
                >
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {day.dayLabel}
                  </span>
                  <div className="my-1.5 flex size-7 items-center justify-center rounded-full border text-[11px] font-extrabold tabular-nums">
                    {day.percent === 100 ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : day.percent > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        {day.doneMeals}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </div>
                  <span className="text-[10px] tabular-nums font-semibold text-muted-foreground">
                    {day.percent}%
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Meal breakdown */}
        {mealLog.meals.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            {m.noMealsLogged}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>
                  {m.completed} ({completedMeals.length})
                </span>
              </div>

              {completedMeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {m.noMealsLogged}
                </div>
              ) : (
                <div className="space-y-2">
                  {completedMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {isAr && meal.nameAr ? meal.nameAr : meal.name}
                        </span>
                        {meal.isSpare && (
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {m.spareMeal}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {meal.items
                          .filter((i) => i.isChosen)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-[11px] text-muted-foreground"
                            >
                              <span className="flex items-center gap-1.5 font-medium text-foreground">
                                <CheckCircle2 className="size-3 text-emerald-500" />
                                {isAr && item.foodNameAr ? item.foodNameAr : item.foodName}
                              </span>
                              <span className="tabular-nums">
                                {item.amount} {item.unit}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Remaining */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <CircleDashed className="size-4 text-amber-500" />
                <span>
                  {m.remaining} ({remainingMeals.length})
                </span>
              </div>

              {remainingMeals.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  🎉 {m.allMealsDone}
                </div>
              ) : (
                <div className="space-y-2">
                  {remainingMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="rounded-2xl border border-border/50 bg-muted/10 p-3.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {isAr && meal.nameAr ? meal.nameAr : meal.name}
                        </span>
                        {meal.isSpare && (
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {m.spareMeal}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {meal.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-[11px] text-muted-foreground"
                          >
                            <span className="font-medium">
                              {isAr && item.foodNameAr ? item.foodNameAr : item.foodName}
                            </span>
                            <span className="tabular-nums">
                              {item.amount} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
