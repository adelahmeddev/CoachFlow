import { getI18n } from "@/lib/i18n"
import { formatDate } from "@/lib/i18n/format"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface SessionViewRow {
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  sets: number | null
  reps: number | null
  weightKg: number | null
  rpe: number | null
  notes: string | null
}

export interface SessionView {
  date: Date
  dayLabel: string
  adherencePct: number | null
  rows: SessionViewRow[]
}

interface SessionLogListProps {
  sessions: SessionView[]
}

function adherenceVariant(pct: number | null): "default" | "secondary" | "destructive" {
  if (pct === null) return "secondary"
  if (pct >= 80) return "default"
  if (pct >= 60) return "secondary"
  return "destructive"
}

export async function SessionLogList({ sessions }: SessionLogListProps) {
  const { t, locale } = await getI18n()

  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {t.sessions.emptyDescription}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.date.toISOString()} className="rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {formatDate(session.date, locale)}
              </p>
              <Badge variant="outline">{session.dayLabel}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t.progress.adherence}
              </span>
              <Badge variant={adherenceVariant(session.adherencePct)}>
                {session.adherencePct != null
                  ? `${session.adherencePct}%`
                  : t.progress.noAdherence}
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.progress.exercise}</TableHead>
                  <TableHead>{t.trainingSplit.targetSets}</TableHead>
                  <TableHead>{t.trainingSplit.targetReps}</TableHead>
                  <TableHead>{t.sessions.actualSets}</TableHead>
                  <TableHead>{t.sessions.actualReps}</TableHead>
                  <TableHead>{t.sessions.actualWeightKg}</TableHead>
                  <TableHead>{t.sessions.rpe}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.rows.map((row, index) => (
                  <TableRow key={`${row.exerciseName}-${index}`}>
                    <TableCell className="font-medium">
                      {row.exerciseName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.targetSets ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.targetReps ?? "—"}
                    </TableCell>
                    <TableCell>{row.sets ?? "—"}</TableCell>
                    <TableCell>{row.reps ?? "—"}</TableCell>
                    <TableCell>{row.weightKg ?? "—"}</TableCell>
                    <TableCell>{row.rpe ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {session.rows.some((row) => row.notes) ? (
            <div className="border-t px-4 py-2">
              {session.rows
                .filter((row) => row.notes)
                .map((row) => (
                  <p
                    key={row.exerciseName}
                    className="text-xs text-muted-foreground"
                  >
                    <span className="font-medium">{row.exerciseName}:</span>{" "}
                    {row.notes}
                  </p>
                ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
