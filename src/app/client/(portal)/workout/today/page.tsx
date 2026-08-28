import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import {
  getTodayWorkout,
  type TodayWorkoutResult,
} from "@/server/services/client-portal.service"
import { getDayDetail, type DayDetail } from "@/server/services/week.service"
import { TodayWorkoutCard } from "@/components/features/client/home/today-workout-card"
import { TodayWorkoutClient } from "@/components/features/client/workout/today-workout-client"

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

  const { dayId } = await searchParams

  let workout: TodayWorkoutResult | null = null
  if (dayId) {
    const detail = await getDayDetail(clientId, dayId)
    if (detail && detail.exercises.length > 0 && detail.status !== "REST") {
      workout = detailToWorkout(detail)
    }
  }
  if (!workout) {
    workout = await getTodayWorkout(clientId)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <TodayWorkoutCard workout={workout} />
      {workout.day ? (
        <TodayWorkoutClient exercises={workout.exercises} dayId={workout.day.id} />
      ) : null}
    </div>
  )
}
