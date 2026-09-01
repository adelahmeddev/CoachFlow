import Link from "next/link"
import { ClipboardList, Dumbbell, TrendingUp, Ruler, BarChart3, Trophy, Target, History, Star, Flame } from "lucide-react"
import { getCurrentSession } from "@/server/auth"
import {
  getClientProgressData,
  getCachedStrengthSeries,
} from "@/server/services/progress.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  const isAr = locale === "ar"
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
      <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-performance-500/[0.06] via-brand-500/[0.03] to-transparent" aria-hidden="true" />
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br from-performance-500/15 to-brand-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-performance-500/10 px-2.5 py-1 text-xs font-bold text-performance-700 ring-1 ring-performance-500/15 dark:bg-performance-500/15 dark:text-performance-300">
              <TrendingUp className="size-3.5" />
              {isAr ? "تتبع التقدّم" : "Progress Tracking"}
            </div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t.progress.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-[60ch]">
              {t.progress.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-xl bg-card gap-1.5">
              <Link href={`/clients/${clientId}/sessions/new`}>
                <Dumbbell className="h-4 w-4" />
                {t.sessions.logSession}
              </Link>
            </Button>
            <ProgressReviewFormDialog clientId={clientId} />
            <WorkoutLogFormDialog clientId={clientId} />
          </div>
        </div>
      </div>

      {bodyCompositions.length === 0 ? (
        <div className="relative overflow-hidden rounded-[20px] border border-dashed bg-card p-10 text-center shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] to-transparent" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
              <Trophy className="size-8" />
            </span>
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-bold">{t.progress.emptyTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isAr ? "ابدأ بإضافة أول تحليل InBody عشان تشوف التغيير" : "No InBody data yet — add first InBody to start tracking progress."}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-1 rounded-xl gap-1.5">
              <Link href={`/clients/${clientId}?tab=body-composition`}>
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                {t.progress.addInBody}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ProgressSummaryCards
            baseline={baseline}
            latest={latest}
            reviews={progressReviews}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-soft hover:shadow-card-hover transition-all">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" aria-hidden="true" />
              <div className="flex items-center gap-2 border-b bg-muted/20 p-4">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                  <TrendingUp className="size-4" />
                </span>
                <h3 className="text-sm font-bold tracking-tight">{t.progress.weight}</h3>
                <Badge variant="outline" className="ms-auto rounded-full text-xs">{bodyCompositions.length} {isAr ? "قياسات" : "records"}</Badge>
              </div>
              <div className="p-4">
                <WeightProgressChartLazy bodyCompositions={bodyCompositions} />
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-soft hover:shadow-card-hover transition-all">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-performance-500/20 to-transparent" aria-hidden="true" />
              <div className="flex items-center gap-2 border-b bg-muted/20 p-4">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-performance-500 to-performance-600 text-white shadow-soft">
                  <Ruler className="size-4" />
                </span>
                <h3 className="text-sm font-bold tracking-tight">{t.progress.measurements}</h3>
                <Badge variant="outline" className="ms-auto rounded-full text-xs">{isAr ? "تفاصيل الجسم" : "body comp"}</Badge>
              </div>
              <div className="p-4">
                <MeasurementsProgressChartLazy bodyCompositions={bodyCompositions} />
              </div>
            </div>
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
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center gap-2 border-b bg-muted/20 p-4">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-muscle-500 to-brand-500 text-white shadow-soft">
                <BarChart3 className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight">{t.progress.perExerciseStrength}</h3>
              <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-muscle-500/10 px-2.5 py-1 text-xs font-medium text-muscle-700 ring-1 ring-muscle-500/15">
                <Flame className="size-3" />
                {isAr ? "قوة" : "strength"}
              </span>
            </div>
            <div className="p-4">
              <ExerciseStrengthChartLazy series={strengthSeries} />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
            <div className="flex items-center gap-2 border-b bg-muted/20 p-4">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-soft">
                <Target className="size-4" />
              </span>
              <h3 className="text-sm font-bold tracking-tight">{t.progress.lastSessionVsTargets}</h3>
              <Badge variant="outline" className="ms-auto rounded-full">{isAr ? "آخر جلسة" : "last session"}</Badge>
            </div>
            <div className="p-4">
              <LastSessionTargetsTable rows={lastSessionRows} />
            </div>
          </div>
        </>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <History className="size-4" />
            </span>
            <h3 className="text-base font-bold tracking-tight">{t.progress.sessionLogs}</h3>
            <Badge variant="outline" className="rounded-full">{sessionViews.length}</Badge>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 gap-1.5">
            <Link href={`/clients/${clientId}/sessions/new`}>
              <Dumbbell className="h-4 w-4" />
              {t.sessions.logSession}
            </Link>
          </Button>
        </div>
        <SessionLogList sessions={sessionViews} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-energy-500 to-energy-600 text-white shadow-soft">
            <Star className="size-4" />
          </span>
          <h3 className="text-base font-bold tracking-tight">{t.progress.reviews}</h3>
          <Badge variant="outline" className="rounded-full">{progressReviews.length}</Badge>
        </div>
        <ProgressReviewList reviews={progressReviews} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <History className="size-4" />
          </span>
          <h3 className="text-base font-bold tracking-tight">{t.progress.logs}</h3>
        </div>
        <WorkoutLogTable logs={workoutLogs} clientId={clientId} />
      </div>
    </div>
  )
}
