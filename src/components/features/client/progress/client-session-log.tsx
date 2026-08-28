"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Dumbbell } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { formatDate } from "@/lib/i18n/format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface ClientSessionRow {
  exerciseName: string
  targetSets: number | null
  targetReps: number | null
  actualSets: number | null
  actualReps: number | null
  weightKg: number | null
  rpe: number | null
  notes: string | null
}

export interface ClientSessionView {
  date: Date
  dayLabel: string
  adherencePct: number | null
  rows: ClientSessionRow[]
}

interface ClientSessionLogProps {
  sessions: ClientSessionView[]
}

function adherenceBadgeVariant(
  pct: number | null
): "default" | "secondary" | "destructive" {
  if (pct === null) return "secondary"
  if (pct >= 80) return "default"
  if (pct >= 60) return "secondary"
  return "destructive"
}

function SessionItem({ session }: { session: ClientSessionView }) {
  const [open, setOpen] = useState(false)
  const { t, locale } = useI18n()

  return (
    <div className="overflow-hidden rounded-lg border transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-start"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground rtl:-scale-x-100" />
          )}
          <p className="text-sm font-medium">
            {formatDate(session.date, locale)}
          </p>
          {session.dayLabel ? (
            <Badge variant="outline" className="text-xs">
              {session.dayLabel}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {lookup(t, "client.progress.adherence")}
          </span>
          <Badge variant={adherenceBadgeVariant(session.adherencePct)}>
            {session.adherencePct != null
              ? `${session.adherencePct}%`
              : "—"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {session.rows.length}{" "}
            {lookup(t, "client.progress.exercises")}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">
                    {lookup(t, "client.progress.exercise")}
                  </TableHead>
                  <TableHead className="text-center">
                    {lookup(t, "client.progress.sets")}
                  </TableHead>
                  <TableHead className="text-center">
                    {lookup(t, "client.progress.reps")}
                  </TableHead>
                  <TableHead className="text-center">
                    {lookup(t, "client.progress.weight")}
                  </TableHead>
                  <TableHead className="text-center">RPE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.rows.map((row, i) => (
                  <TableRow key={`${row.exerciseName}-${i}`}>
                    <TableCell className="font-medium">
                      {row.exerciseName}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          row.targetSets != null &&
                            row.actualSets != null &&
                            row.actualSets < row.targetSets
                            ? "text-destructive"
                            : undefined
                        )}
                      >
                        {row.actualSets ?? "—"}
                      </span>
                      {row.targetSets != null ? (
                        <span className="text-xs text-muted-foreground">
                          /{row.targetSets}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          row.targetReps != null &&
                            row.actualReps != null &&
                            row.actualReps < row.targetReps
                            ? "text-destructive"
                            : undefined
                        )}
                      >
                        {row.actualReps ?? "—"}
                      </span>
                      {row.targetReps != null ? (
                        <span className="text-xs text-muted-foreground">
                          /{row.targetReps}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.weightKg != null ? `${row.weightKg} kg` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.rpe ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {session.rows.some((r) => r.notes) ? (
            <div className="space-y-1 border-t px-4 py-2">
              {session.rows
                .filter((r) => r.notes)
                .map((r) => (
                  <p key={r.exerciseName} className="text-xs text-muted-foreground">
                    <span className="font-medium">{r.exerciseName}:</span>{" "}
                    {r.notes}
                  </p>
                ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function ClientSessionLog({ sessions }: ClientSessionLogProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Dumbbell className="size-4 text-emerald-500" />
          <CardTitle>{lookup(t, "client.progress.sessionLogs")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            {lookup(t, "client.progress.noSessions")}
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionItem key={session.date.toISOString()} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
