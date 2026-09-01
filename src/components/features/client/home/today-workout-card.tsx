"use client"

import Link from "next/link"
import { Dumbbell, MoonStar, Flame, ArrowLeft, Clock, Target, Zap, Play, Trophy } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import type { TodayWorkoutResult } from "@/server/services/client-portal.service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const FOCUS_LABEL_KEYS: Record<string, string> = {
  REST: "rest",
  UPPER: "upper",
  LOWER: "lower",
  FULL_BODY: "fullBody",
  PUSH: "push",
  PULL: "pull",
  LEGS: "legs",
  SHOULDERS_ARMS: "shouldersArms",
  CARDIO: "cardio",
  MOBILITY: "mobility",
}

const focusMeta: Record<string, { emoji: string; color: string }> = {
  CHEST: { emoji: "💪", color: "from-muscle-500 to-brand-500" },
  BACK: { emoji: "🦾", color: "from-brand-600 to-brand-500" },
  PUSH: { emoji: "🔥", color: "from-energy-500 to-brand-500" },
  PULL: { emoji: "🦍", color: "from-muscle-500 to-performance-600" },
  LEGS: { emoji: "🦵", color: "from-performance-600 to-performance-500" },
  UPPER: { emoji: "💥", color: "from-brand-500 to-energy-500" },
  LOWER: { emoji: "🏋️", color: "from-performance-500 to-brand-500" },
  FULL_BODY: { emoji: "⚡", color: "from-brand-600 via-energy-500 to-performance-500" },
  SHOULDERS_ARMS: { emoji: "💪", color: "from-energy-500 to-muscle-400" },
  CARDIO: { emoji: "❤️", color: "from-sky-500 to-performance-500" },
  REST: { emoji: "😴", color: "from-muted to-muted" },
}

export function TodayWorkoutCard({ workout }: { workout: TodayWorkoutResult }) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"

  if (!workout.day && workout.status === "REST") {
    const nextLabel = workout.nextTrainingDay
      ? (workout.nextTrainingDay.customFocus ||
        lookup(
          t,
          `trainingSplit.dayFocus.${
            FOCUS_LABEL_KEYS[workout.nextTrainingDay.focus] ??
            workout.nextTrainingDay.focus.toLowerCase()
          }`
        ))
      : null

    return (
      <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.06] via-performance-500/[0.03] to-transparent" aria-hidden="true" />
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-performance-500 text-white shadow-soft">
              <MoonStar className="size-6" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-lg font-extrabold tracking-tight">{t.client.week.restDay} 💤</h3>
              {nextLabel ? (
                <p className="text-sm text-muted-foreground">
                  {t.client.week.nextTrainingDay}: <span className="font-semibold text-foreground">{nextLabel}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{t.client.week.noWorkoutPlanned}</p>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isAr ? "يوم راحة مهم للاستشفاء — نام كويس واشرب مياه 💧" : "Recovery day — sleep well, hydrate 💧"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/client/week">{t.client.week.myWeek}</Link>
            </Button>
            {nextLabel && (
              <Badge variant="outline" className="gap-1 px-2.5 bg-performance-500/10 text-performance-700 border-performance-200">
                <Trophy className="size-3" />
                {isAr ? "القادم:" : "Next:"} {nextLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!workout.day) {
    return (
      <div className="relative overflow-hidden rounded-[20px] border border-dashed bg-muted/30 p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Dumbbell className="size-6" />
        </span>
        <h3 className="mt-3 text-sm font-bold">{lookup(t, "client.home.noWorkout")}</h3>
        <p className="mx-auto mt-1 max-w-[32ch] text-xs leading-relaxed text-muted-foreground">
          {lookup(t, "client.home.noWorkoutDescription")}
        </p>
      </div>
    )
  }

  const focusLabel =
    workout.day.customFocus ??
    lookup(
      t,
      `trainingSplit.dayFocus.${
        FOCUS_LABEL_KEYS[workout.day.focus as string] ??
        String(workout.day.focus).toLowerCase()
      }`
    )

  const startHref = `/client/workout/today?dayId=${workout.day.id}`
  const meta = focusMeta[workout.day.focus] ?? focusMeta.FULL_BODY
  const totalVolume = workout.exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * (ex.targetWeight ?? 0)), 0)

  return (
    <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-energy-500/[0.03] to-transparent" aria-hidden="true" />
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-brand-500/15 to-energy-500/10 blur-2xl" aria-hidden="true" />
      <div className="relative">
        {/* HEADER */}
        <div className="p-5 sm:p-6 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4 min-w-0 flex-1">
              <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.color} text-white text-xl shadow-soft ring-1 ring-white/20`}>
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
                  <Flame className="size-3" />
                  {isAr ? "تمرين النهاردة" : "Today's Session"}
                </div>
                <h3 className="text-xl font-extrabold tracking-tight leading-none">
                  {workout.day.dayName}
                  <span className="mx-2 text-muted-foreground/30">•</span>
                  <span className="bg-gradient-to-r from-brand-600 to-energy-600 bg-clip-text text-transparent">
                    {focusLabel}
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">
                    <Dumbbell className="size-3 text-brand-600" />
                    {workout.exercises.length} {isAr ? "تمارين" : "exercises"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium">
                    <Clock className="size-3 text-muted-foreground" />
                    ~{Math.round(workout.exercises.length * 3.5)} {isAr ? "دقيقة" : "min"}
                  </span>
                  {totalVolume > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-performance-500/10 px-2.5 py-1 font-medium text-performance-700 ring-1 ring-performance-500/15">
                      <Target className="size-3" />
                      {totalVolume.toLocaleString()} {isAr ? "كجم" : "kg vol"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-brand-600 to-energy-500 shadow-soft hover:brightness-110 gap-2 shrink-0">
              <Link href={startHref}>
                <Play className="size-5 fill-white" />
                {lookup(t, "client.common.startWorkout")}
              </Link>
            </Button>
          </div>
        </div>

        {/* EXERCISES PREVIEW */}
        {workout.exercises.length > 0 && (
          <div className="border-t bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {isAr ? "الخطة" : "Lineup"}
              </p>
              <span className="text-xs text-muted-foreground">{workout.exercises.length} {isAr ? "تمارين" : "exercises"}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {workout.exercises.slice(0, 4).map((ex, i) => (
                <div
                  key={ex.id}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-3 shadow-soft transition-all hover:shadow-medium hover:border-brand-200"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white shadow-soft">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-none">{ex.exerciseName}</p>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      <span dir="ltr">
                        {ex.sets} × {ex.reps}
                        {ex.targetWeight ? ` · ${ex.targetWeight}kg` : ""}
                      </span>
                    </p>
                  </div>
                  <Zap className="size-4 shrink-0 text-brand-500/40 group-hover:text-brand-500 transition-colors" />
                </div>
              ))}
            </div>
            {workout.exercises.length > 4 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                +{workout.exercises.length - 4} {isAr ? "تمارين كمان" : "more exercises"} — {isAr ? "ابدأ وشوف الباقي" : "start to see all"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
