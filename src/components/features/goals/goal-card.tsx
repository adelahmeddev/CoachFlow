import { History, Sparkles } from "lucide-react"
import { lookup } from "@/lib/i18n/lookup"
import type { Dictionary } from "@/lib/i18n/messages/en"
import type { Locale } from "@/lib/i18n/config"
import { formatDate, interpolate } from "@/lib/i18n/format"
import { daysUntilDeadline } from "@/lib/goals"
import type { GoalWithProgress } from "@/server/services/goal.service"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

function StatusBadge({ status, t }: { status: GoalWithProgress["status"]; t: Dictionary["goals"] }) {
  if (status === "ACHIEVED") return <Badge className="shrink-0 bg-performance-500 text-white">{t.achieved}</Badge>
  if (status === "PAUSED") return <Badge className="shrink-0 bg-energy-500 text-white">{t.paused}</Badge>
  if (status === "CANCELLED") return <Badge variant="secondary" className="shrink-0">{t.cancelled}</Badge>
  return <Badge className="shrink-0 bg-brand-500 text-white">{t.active}</Badge>
}

function fmt(v: number | null): string {
  if (v === null || v === undefined) return "—"
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10)
}

export function GoalCard({
  goal,
  t,
  locale,
  actions,
}: {
  goal: GoalWithProgress
  t: Dictionary
  locale: Locale
  actions?: React.ReactNode
}) {
  const types = lookup(t, "goals.types") as unknown as Record<string, string>
  const typeLabel = types[goal.type.toLowerCase()] ?? goal.type
  const left = daysUntilDeadline(goal.deadline)
  const unit = goal.unit ? ` ${goal.unit}` : ""

  return (
    <Card className={cn(goal.status !== "ACTIVE" && "opacity-80")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 break-words text-sm font-bold">{goal.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {typeLabel}
              {goal.autoSynced ? (
                <span className="ms-1.5 inline-flex items-center gap-0.5">
                  <Sparkles className="size-3" />
                  {t.goals.autoSynced}
                </span>
              ) : null}
            </p>
          </div>
          <StatusBadge status={goal.status} t={t.goals} />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 text-xs tabular-nums">
            <span className="text-muted-foreground">
              {fmt(goal.resolvedCurrent)}
              {unit} → {fmt(goal.targetValue)}
              {unit}
            </span>
            <span className="font-bold">
              {goal.progress !== null ? `${goal.progress}%` : "—"}
            </span>
          </div>
          <Progress value={goal.progress ?? 0} className="mt-1.5 h-2" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {goal.deadline ? (
              left !== null && left >= 0 ? (
                interpolate(t.goals.dueIn, { n: left })
              ) : (
                <span className="font-semibold text-muscle-600">{t.goals.overdue}</span>
              )
            ) : (
              t.goals.noDeadline
            )}
            {" • "}
            {formatDate(goal.createdAt, locale)}
          </span>
          {actions}
        </div>
      </CardContent>
    </Card>
  )
}

export function GoalHistoryList({
  goals,
  t,
  locale,
}: {
  goals: GoalWithProgress[]
  t: Dictionary
  locale: Locale
}) {
  if (goals.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <History className="size-3.5" />
        {t.goals.history} ({goals.length})
      </p>
      {goals.map((g) => (
        <GoalCard key={g.id} goal={g} t={t} locale={locale} />
      ))}
    </div>
  )
}
