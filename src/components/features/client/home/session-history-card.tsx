"use client"

import { Dumbbell } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { groupSessionsByDate } from "@/lib/calculations/session-progress"
import type { ClientSessionView } from "@/components/features/client/progress/client-session-log"

interface SessionHistoryCardProps {
  sessionHistory: Array<{
    id: string
    date: Date
    exerciseName: string
    targetSets: number
    targetReps: number
  }>
}

function adherenceBadgeVariant(
  pct: number | null
): "default" | "secondary" | "destructive" {
  if (pct === null) return "secondary"
  if (pct >= 80) return "default"
  if (pct >= 60) return "secondary"
  return "destructive"
}

export function SessionHistoryCard({ sessionHistory }: SessionHistoryCardProps) {
  const { t, locale } = useI18n()

    const sessionExerciseLogs = sessionHistory.map((log) => ({
    id: log.id,
    date: log.date,
    actualSets: null,
    actualReps: null,
    actualWeightKg: null,
    rpe: null,
    target: {
      id: log.id,
      name: log.exerciseName,
      targetSets: log.targetSets,
      targetReps: log.targetReps,
      targetWeightKg: null,
    },
  }))

  const grouped = groupSessionsByDate(sessionExerciseLogs)

  const sessions: ClientSessionView[] = grouped.map((sg) => ({
    date: sg.date,
    dayLabel: "",
    adherencePct: sg.adherencePct,
    rows: sg.logs.map((log) => ({
      exerciseName: log.target.name,
      targetSets: log.target.targetSets,
      targetReps: log.target.targetReps,
      actualSets: log.actualSets,
      actualReps: log.actualReps,
      weightKg: log.actualWeightKg,
      rpe: log.rpe,
      notes: null,
    })),
  }))

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="size-4" />
            {t.client.progress.sessionLogs}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-4">
          {t.client.progress.noSessions}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="size-4" />
          {t.client.progress.sessionLogs}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.slice(0, 5).map((session, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {formatDate(session.date, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.rows.length} {t.client.progress.exercises ?? "exercises"}
              </p>
            </div>
            <Badge variant={adherenceBadgeVariant(session.adherencePct)}>
              {session.adherencePct != null ? `${session.adherencePct}%` : "—"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )}
