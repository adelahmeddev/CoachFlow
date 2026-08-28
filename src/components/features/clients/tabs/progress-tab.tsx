import Link from "next/link"
import { ClipboardList, Dumbbell } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import {
  getClientProgressData,
  getCachedStrengthSeries,
} from "@/server/services/progress.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressSummaryCards } from "@/components/features/progress/progress-summary-cards"
import { BodyCompositionComparisonSection } from "@/components/features/progress/body-composition-comparison-section"
import { ProgressReviewFormDialog } from "@/components/features/progress/progress-review-form-dialog"
import { ProgressReviewList } from "@/components/features/progress/progress-review-list"
import { WorkoutLogFormDialog } from "@/components/features/progress/workout-log-form-dialog"
import { WorkoutLogTable } from "@/components/features/progress/workout-log-table"
import {
  WeightProgressChartLazy,
  MeasurementsProgressChartLazy,
  ExerciseStrengthChartLazy,
} from "@/components/features/progress/charts-client"
import { LastSessionTargetsTable, type TargetRow } from "@/components/features/progress/last-session-targets-table"
import { SessionLogList, type SessionView } from "@/components/features/progress/session-log-list"
import { getI18n } from "@/lib/i18n"
import { getDayFocusLabel } from "@/lib/i18n/labels"
import {
  didAchieveTargets,
  getProgressionAdvice,
  groupSessionsByDate,
  type SessionExerciseLog,
} from "@/lib/calculations/session-progress"

interface ProgressTabProps {
  clientId: string
}

export async function ProgressTab({ clientId }: ProgressTabProps) {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const data = await getClientProgressData(
    clientId,
    session.user.trainerProfileId
  )

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{t.toasts.unauthorized}</p>
      </div>
    )
  }

  const { bodyCompositions, baseline, latest, progressReviews, workoutLogs } = data

  const exerciseLogs = data.exerciseLogs
  const rawByLogId = new Map(exerciseLogs.map((log) => [log.id, log]))
  const logsByExercise = new Map<string, SessionExerciseLog[]>()

  for (const log of exerciseLogs) {
    const exercise = log.splitDayExercise
    const sessionLog: SessionExerciseLog = {
      id: log.id,
      date: log.date,
      actualSets: log.actualSets,
      actualReps: log.actualReps,
      actualWeightKg: log.actualWeightKg,
      rpe: log.rpe,
      target: {
        id: exercise.id,
        name: exercise.exerciseName,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        targetWeightKg: exercise.targetWeightKg,
      },
    }

    const list = logsByExercise.get(exercise.id) ?? []
    list.push(sessionLog)
    logsByExercise.set(exercise.id, list)
  }

  const strengthSeries = await getCachedStrengthSeries(clientId)

  const allSessions = groupSessionsByDate(
    [...logsByExercise.values()].flat()
  )
  const lastSession = allSessions[0] ?? null

  const lastSessionRows: TargetRow[] = lastSession
    ? lastSession.logs.map((log) => ({
        exerciseName: log.target.name,
        targetSets: log.target.targetSets,
        targetReps: log.target.targetReps,
        targetWeightKg: log.target.targetWeightKg,
        actualSets: log.actualSets,
        actualReps: log.actualReps,
        actualWeightKg: log.actualWeightKg,
        achieved: didAchieveTargets(log),
        advice: getProgressionAdvice(logsByExercise.get(log.target.id) ?? [log]),
      }))
    : []

  const sessionViews: SessionView[] = allSessions.map((session) => {
    const firstRaw = rawByLogId.get(session.logs[0].id)
    const day = firstRaw?.splitDayExercise.splitDay
    const dayLabel = day
      ? `${t.sessions.dayPrefix} ${day.dayNumber} · ${
          day.focus === "CUSTOM"
            ? day.customFocus || t.trainingSplit.custom
            : getDayFocusLabel(day.focus, locale)
        }`
      : ""
    return {
      date: session.date,
      dayLabel,
      adherencePct: session.adherencePct,
      rows: session.logs.map((log) => ({
        exerciseName: log.target.name,
        targetSets: log.target.targetSets,
        targetReps: log.target.targetReps,
        sets: log.actualSets,
        reps: log.actualReps,
        weightKg: log.actualWeightKg,
        rpe: log.rpe,
        notes: rawByLogId.get(log.id)?.notes ?? null,
      })),
    }
  })

  const hasSessionLogs = exerciseLogs.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t.progress.title}</h2>
          <p className="text-muted-foreground">
            {t.progress.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${clientId}/sessions/new`}>
              <Dumbbell className="me-1 h-4 w-4" />
              {t.sessions.logSession}
            </Link>
          </Button>
          <ProgressReviewFormDialog clientId={clientId} />
          <WorkoutLogFormDialog clientId={clientId} />
        </div>
      </div>

      {bodyCompositions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-sm font-semibold">{t.progress.emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No InBody data yet — add first InBody to start tracking progress.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href={`/clients/${clientId}?tab=body-composition`}>
              <ClipboardList className="me-1 h-4 w-4" aria-hidden="true" />
              {t.progress.addInBody}
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <ProgressSummaryCards
            baseline={baseline}
            latest={latest}
            reviews={progressReviews}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t.progress.weight}</CardTitle>
              </CardHeader>
              <CardContent>
                <WeightProgressChartLazy bodyCompositions={bodyCompositions} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.progress.measurements}</CardTitle>
              </CardHeader>
              <CardContent>
                <MeasurementsProgressChartLazy bodyCompositions={bodyCompositions} />
              </CardContent>
            </Card>
          </div>

          <BodyCompositionComparisonSection
            baseline={baseline}
            latest={latest}
            hasMultiple={bodyCompositions.length >= 2}
          />
        </>
      )}

      {hasSessionLogs ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.progress.perExerciseStrength}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExerciseStrengthChartLazy series={strengthSeries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.progress.lastSessionVsTargets}</CardTitle>
            </CardHeader>
            <CardContent>
              <LastSessionTargetsTable rows={lastSessionRows} />
            </CardContent>
          </Card>
        </>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t.progress.sessionLogs}</h3>
          <Button asChild size="sm">
            <Link href={`/clients/${clientId}/sessions/new`}>
              <Dumbbell className="me-1 h-4 w-4" />
              {t.sessions.logSession}
            </Link>
          </Button>
        </div>
        <SessionLogList sessions={sessionViews} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t.progress.reviews}</h3>
        </div>
        <ProgressReviewList reviews={progressReviews} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t.progress.logs}</h3>
        </div>
        <WorkoutLogTable logs={workoutLogs} clientId={clientId} />
      </div>
    </div>
  )
}
