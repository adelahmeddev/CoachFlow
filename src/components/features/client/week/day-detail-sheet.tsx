"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lock, Play } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { interpolate } from "@/lib/i18n/format"
import type { BoardEntry } from "@/lib/calculations/week-schedule"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RestDayCard } from "./rest-day-card"
import { getMyDayDetailAction } from "@/server/actions/client-portal"

type DayDetail = {
  dayId: string
  dayNumber: number
  focus: string
  customFocus: string | null
  status: string
  dateKey: string | null
  weekday: string | null
  exercises: Array<{
    id: string
    exerciseName: string
    targetSets: number | null
    targetReps: number | null
    targetWeightKg: number | null
    actualSets: number | null
    actualReps: number | null
    actualWeightKg: number | null
    done: boolean
  }>
  totalVolume: number | null
}

function formatTargets(
  sets: number | null,
  reps: number | null,
  weight: number | null
): string {
  const parts = [`${sets ?? "-"}×${reps ?? "-"}`]
  if (weight != null) parts.push(`@${weight}kg`)
  return parts.join(" ")
}

export function DayDetailSheet({
  open,
  onOpenChange,
  entry,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: BoardEntry | null
  mode: "FIXED_WEEKDAYS" | "SEQUENTIAL"
}) {
  const { t } = useI18n()

  const title = entry
    ? mode === "FIXED_WEEKDAYS" && entry.weekday
      ? lookup(t, `trainingSplit.weekdays.${entry.weekday}`)
      : interpolate(t.client.week.dayN, { n: entry.dayNumber ?? 0 })
    : ""

  const statusLabel = (() => {
    if (!entry) return ""
    switch (entry.status) {
      case "DONE":
        return t.client.week.done
      case "MISSED":
        return t.client.week.missed
      case "TODAY":
        return t.client.week.today
      case "CURRENT":
        return t.client.week.currentTurn
      case "UPCOMING":
        return t.client.week.upcoming
      case "REST":
        return t.client.week.rest
    }
  })()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl sm:mx-auto sm:max-w-lg">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-2 pe-8">
            <SheetTitle>{title}</SheetTitle>
            <Badge variant="secondary">{statusLabel}</Badge>
          </div>
          {mode === "FIXED_WEEKDAYS" && entry?.dateKey ? (
            <p className="text-xs tabular-nums text-muted-foreground" dir="ltr">
              {entry.dateKey}
            </p>
          ) : null}
        </SheetHeader>

        <div className="space-y-4 p-4">
          {entry?.status === "REST" ? (
            <RestDayCard extraWorkout={entry.extraWorkout} />
          ) : entry?.dayId ? (
            <DayDetailContent
              key={entry.dayId}
              dayId={entry.dayId}
              status={entry.status}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DayDetailContent({
  dayId,
  status,
}: {
  dayId: string
  status: NonNullable<BoardEntry["status"]>
}) {
  const { t } = useI18n()
  const [detail, setDetail] = useState<DayDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    getMyDayDetailAction(dayId).then((result) => {
      if (!cancelled) setDetail(result)
    })
    return () => {
      cancelled = true
    }
  }, [dayId])

  if (!detail) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const canStart = status === "TODAY" || status === "CURRENT"
  const isLocked = status === "UPCOMING" || status === "MISSED"

  return (
    <>
      <ul className="space-y-2">
        {detail.exercises.map((ex) => (
          <li key={ex.id} className="rounded-xl border bg-white/40 p-3 dark:bg-white/5">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium">
                {ex.exerciseName}
              </p>
              {ex.done ? (
                <span className="shrink-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  {t.client.week.done}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span dir="ltr">{formatTargets(ex.targetSets, ex.targetReps, ex.targetWeightKg)}</span>
            </p>
            {ex.actualReps != null || ex.actualSets != null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                <span dir="ltr">
                  {`${ex.actualSets ?? "-"}×${ex.actualReps ?? "-"}${
                    ex.actualWeightKg != null ? ` @${ex.actualWeightKg}kg` : ""
                  }`}
                </span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {status === "DONE" && detail.totalVolume ? (
        <p className="text-sm text-muted-foreground">
          {lookup(t, "client.workout.totalVolume")}:{" "}
          <span className="font-medium tabular-nums" dir="ltr">
            {Math.round(detail.totalVolume)}
          </span>{" "}
          kg
        </p>
      ) : null}

      {canStart ? (
        <Button asChild size="lg" className="w-full min-h-[48px] text-base">
          <Link href={`/client/workout/session?dayId=${detail.dayId}`}>
            <Play className="size-5" />
            {lookup(t, "client.workout.startWorkout")}
          </Link>
        </Button>
      ) : null}

      {isLocked ? (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          {t.client.week.lockedNote}
        </p>
      ) : null}
    </>
  )
}
