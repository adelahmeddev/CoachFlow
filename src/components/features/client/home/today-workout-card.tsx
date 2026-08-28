"use client"

import Link from "next/link"
import { Dumbbell, MoonStar } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import type { TodayWorkoutResult } from "@/server/services/client-portal.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

export function TodayWorkoutCard({ workout }: { workout: TodayWorkoutResult }) {
  const { t } = useI18n()

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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MoonStar className="size-5 text-brand-600 dark:text-brand-400" />
            <CardTitle>{t.client.week.restDay} 💤</CardTitle>
          </div>
          {nextLabel ? (
            <CardDescription>
              {t.client.week.nextTrainingDay}: {nextLabel}
            </CardDescription>
          ) : (
            <CardDescription>{t.client.week.noWorkoutPlanned}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/client/week">{t.client.week.myWeek}</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!workout.day) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lookup(t, "client.home.noWorkout")}</CardTitle>
          <CardDescription>
            {lookup(t, "client.home.noWorkoutDescription")}
          </CardDescription>
        </CardHeader>
      </Card>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dumbbell className="size-5 text-brand-600 dark:text-brand-400" />
          <CardTitle>{workout.day.dayName}</CardTitle>
        </div>
        {focusLabel ? (
          <CardDescription>
            {lookup(t, "client.home.focus")}: {focusLabel}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {workout.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {lookup(t, "client.common.noWorkout")}
          </p>
        ) : (
          <>
            <Button asChild size="lg" className="w-full min-h-[48px] text-base sm:w-auto">
              <Link href={startHref}>
                {lookup(t, "client.common.startWorkout")}
              </Link>
            </Button>
            {workout.exercises.slice(0, 4).map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{ex.exerciseName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">
                      {ex.sets} x {ex.reps}
                      {ex.targetWeight ? ` · ${ex.targetWeight}kg` : ""}
                    </span>
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={startHref}>
                    {lookup(t, "client.common.startWorkout")}
                  </Link>
                </Button>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
