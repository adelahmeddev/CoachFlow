import Link from "next/link"
import { redirect } from "next/navigation"
import { EyeOff } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import {
  getTodayWorkout,
  type TodayWorkoutResult,
} from "@/server/services/client-portal.service"
import { getDayDetail, type DayDetail } from "@/server/services/week.service"
import { TodayWorkoutCard } from "@/components/features/client/home/today-workout-card"
import { TodayWorkoutClient } from "@/components/features/client/workout/today-workout-client"
import { getI18n } from "@/lib/i18n"
import { lookup } from "@/lib/i18n/lookup"

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

function detailToWorkout(detail: DayDetail): TodayWorkoutResult {
  return {
    day: {
      id: detail.dayId,
      dayName: `Day ${detail.dayNumber}`,
      focus: detail.focus,
      customFocus: detail.customFocus,
    },
    exercises: detail.exercises.map((ex) => ({
      id: ex.id,
      exerciseName: ex.exerciseName,
      sets: ex.targetSets ?? 3,
      reps: ex.targetReps ?? 10,
      targetWeight: ex.targetWeightKg ?? null,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
      youtubeUrl: ex.youtubeUrl,
      videoUrl: ex.videoUrl,
      log:
        ex.actualSets != null ||
        ex.actualReps != null ||
        ex.actualWeightKg != null
          ? {
              actualSets: ex.actualSets,
              actualReps: ex.actualReps,
              actualWeightKg: ex.actualWeightKg,
              rpe: null,
              notes: null,
              setData: ex.setData,
            }
          : null,
    })),
    status: detail.status === "CURRENT" ? "CURRENT" : "TODAY",
    nextTrainingDay: null,
    workoutDisplayMode: detail.workoutDisplayMode,
  }
}

export default async function ClientWorkoutTodayPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string }>
}) {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const { t, locale } = await getI18n()
  const { dayId } = await searchParams

  // DAY_NAME_ONLY clients get a locked day-name view — never exercise
  // details, and never a route into execution mode.
  let lockedDay: { dayName: string; focus: string; customFocus: string | null } | null = null
  let workout: TodayWorkoutResult | null = null
  if (dayId) {
    const detail = await getDayDetail(clientId, dayId)
    if (detail && detail.status !== "REST") {
      if (detail.workoutDisplayMode === "DAY_NAME_ONLY") {
        lockedDay = {
          dayName: `Day ${detail.dayNumber}`,
          focus: detail.focus,
          customFocus: detail.customFocus,
        }
      } else if (detail.exercises.length > 0) {
        workout = detailToWorkout(detail)
      }
    }
  }
  if (!workout && !lockedDay) {
    workout = await getTodayWorkout(clientId)
    if (workout.workoutDisplayMode === "DAY_NAME_ONLY" && workout.day) {
      lockedDay = {
        dayName: workout.day.dayName,
        focus: workout.day.focus,
        customFocus: workout.day.customFocus,
      }
      workout = null
    }
  }

  const finalWorkout = workout

  if (lockedDay) {
    const focusLabel =
      lockedDay.customFocus ??
      lookup(
        t,
        `trainingSplit.dayFocus.${
          FOCUS_LABEL_KEYS[lockedDay.focus] ??
          lockedDay.focus.toLowerCase()
        }`
      )
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <div className="relative overflow-hidden rounded-[20px] border bg-card p-6 text-center shadow-soft">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/10 text-muted-foreground">
            <EyeOff className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {lockedDay.dayName}
          </p>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight">
            {focusLabel}
          </h1>
          <p className="mx-auto mt-2 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
            {locale === "ar"
              ? "عرض اسم اليوم فقط بناءً على إعدادات الخطة التدريبية."
              : "Showing the day name only, per your training plan settings."}
          </p>
          <Link
            href="/client/week"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold"
          >
            {locale === "ar" ? "عودة إلى الأسبوع" : "Back to week"}
          </Link>
        </div>
      </div>
    )
  }

  if (!finalWorkout) {
    redirect("/client/week")
    return null
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <TodayWorkoutCard
        workout={finalWorkout}
        displayMode={finalWorkout.workoutDisplayMode}
      />
      {finalWorkout.day && finalWorkout.exercises.length > 0 ? (
        <TodayWorkoutClient exercises={finalWorkout.exercises} dayId={finalWorkout.day.id} />
      ) : null}
    </div>
  )
}
