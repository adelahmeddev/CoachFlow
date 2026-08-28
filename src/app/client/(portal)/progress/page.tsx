import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientProgressData } from "@/server/services/client-portal.service"
import { GoalProjectionCard } from "@/components/features/client/progress/goal-projection-card"
import { AchievementBadges } from "@/components/features/client/progress/achievement-badges"
import { ClientWeightChart } from "@/components/features/client/progress/client-weight-chart"
import { ClientWellnessChart } from "@/components/features/client/progress/client-wellness-chart"
import { ClientSessionLog } from "@/components/features/client/progress/client-session-log"
import { ExerciseStrengthChartLazy } from "@/components/features/progress/charts-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { groupSessionsByDate } from "@/lib/calculations/session-progress"
import type { ClientSessionView } from "@/components/features/client/progress/client-session-log"
import type { WeightDataPoint } from "@/components/features/client/progress/client-weight-chart"
import type { DailyLogPoint } from "@/components/features/client/progress/client-wellness-chart"
import { getI18n } from "@/lib/i18n"

export default async function ClientProgressPage() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const data = await getClientProgressData(clientId)

  if (!data) {
    redirect("/client/login")
  }

  const { t } = await getI18n()

  const { bodyCompositions, dailyLogs, exerciseLogs, strengthSeries, progressReviews } = data

  // Goal progress: BodyComposition has no targetWeight; keep 0 (PENDING_ASSESSMENT workflow unchanged)
  const latestBodyComposition = bodyCompositions[bodyCompositions.length - 1] ?? null
  const baselineBodyComposition = bodyCompositions[0] ?? null
  const goalProgress = 0

  // Weight chart: merge bodyComposition weights + daily log weights, dedup by date
  const weightPoints: WeightDataPoint[] = []
  const seenDates = new Set<string>()

  for (const b of bodyCompositions) {
    if (b.weightKg == null) continue
    const key = b.date.toISOString().slice(0, 10)
    if (!seenDates.has(key)) {
      seenDates.add(key)
      weightPoints.push({
        date: b.date.toISOString(),
        weightKg: b.weightKg,
        source: "body-composition",
      })
    }
  }

  for (const log of dailyLogs) {
    if (log.weightKg == null) continue
    const key = log.date.toISOString().slice(0, 10)
    if (!seenDates.has(key)) {
      seenDates.add(key)
      weightPoints.push({
        date: log.date.toISOString(),
        weightKg: log.weightKg,
        source: "daily-log",
      })
    }
  }

  weightPoints.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Wellness chart: daily logs
  const wellnessPoints: DailyLogPoint[] = dailyLogs.map((log) => ({
    date: log.date.toISOString(),
    energyLevel: log.energyLevel,
    moodLevel: log.moodLevel,
    sleepHours: log.sleepHours,
  }))

  // Session log: group exercise logs by date
  const sessionExerciseLogs = exerciseLogs.map((log) => ({
    id: log.id,
    date: log.date,
    actualSets: log.actualSets,
    actualReps: log.actualReps,
    actualWeightKg: log.actualWeightKg,
    rpe: log.rpe,
    target: {
      id: log.splitDayExercise.id,
      name: log.splitDayExercise.exerciseName,
      targetSets: log.splitDayExercise.targetSets,
      targetReps: log.splitDayExercise.targetReps,
      targetWeightKg: log.splitDayExercise.targetWeightKg,
    },
  }))

  const grouped = groupSessionsByDate(sessionExerciseLogs)

  const sessionViews: ClientSessionView[] = grouped.map((sg) => {
    const firstLog = exerciseLogs.find((l) => l.id === sg.logs[0].id)
    const day = firstLog?.splitDayExercise.splitDay
    const dayLabel = day
      ? `Day ${day.dayNumber}${day.customFocus ? ` · ${day.customFocus}` : ""}`
      : ""
    return {
      date: sg.date,
      dayLabel,
      adherencePct: sg.adherencePct,
      rows: sg.logs.map((log) => ({
        exerciseName: log.target.name,
        targetSets: log.target.targetSets,
        targetReps: log.target.targetReps,
        actualSets: log.actualSets,
        actualReps: log.actualReps,
        weightKg: log.actualWeightKg,
        rpe: log.rpe,
        notes:
          exerciseLogs.find((l) => l.id === log.id)?.notes ?? null,
      })),
    }
  })

  // Summary stats
  const currentWeight = latestBodyComposition?.weightKg ?? null
  const baselineWeight = baselineBodyComposition?.weightKg ?? null
  const weightChange =
    currentWeight !== null && baselineWeight !== null && baselineBodyComposition?.id !== latestBodyComposition?.id
      ? +(currentWeight - baselineWeight).toFixed(1)
      : null

  const latestAdherence =
    progressReviews[0]?.adherencePct != null
      ? `${progressReviews[0].adherencePct}%`
      : null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.client.progress.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.client.progress.subtitle}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>{t.client.progress.currentWeight}</CardDescription>
            <CardTitle className="text-xl">
              {currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>{t.client.progress.weightChange}</CardDescription>
            <CardTitle
              className={
                weightChange === null
                  ? "text-xl"
                  : weightChange < 0
                    ? "text-xl text-emerald-600"
                    : weightChange > 0
                      ? "text-xl text-destructive"
                      : "text-xl"
              }
            >
              {weightChange === null
                ? "—"
                : `${weightChange > 0 ? "+" : ""}${weightChange} kg`}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>{t.client.progress.totalWorkouts}</CardDescription>
            <CardTitle className="text-xl">{data.workoutCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>{t.client.progress.latestAdherence}</CardDescription>
            <CardTitle className="text-xl">{latestAdherence ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Goal + Achievements */}
      <GoalProjectionCard progress={goalProgress} />
      <AchievementBadges
        streak={progressReviews.length}
        workoutCount={data.workoutCount}
        goalProgress={goalProgress}
      />

      {/* Weight trend */}
      <ClientWeightChart points={weightPoints} />

      {/* Wellness trends */}
      {wellnessPoints.length > 0 ? (
        <ClientWellnessChart points={wellnessPoints} />
      ) : null}

      {/* Per-exercise strength */}
      {strengthSeries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t.client.progress.strength}</CardTitle>
            <CardDescription>{t.client.progress.strengthDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExerciseStrengthChartLazy series={strengthSeries} />
          </CardContent>
        </Card>
      ) : null}

      {/* Session log */}
      <ClientSessionLog sessions={sessionViews} />
    </div>
  )
}
