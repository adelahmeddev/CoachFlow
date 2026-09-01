"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarCheck2, CheckCircle2, Flame, MoonStar, Play } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { interpolate } from "@/lib/i18n/format"
import type {
  BoardEntry,
  WeekSummary,
} from "@/lib/calculations/week-schedule"
import { ScheduleMode } from "@/lib/db/enums"
import { formatDate } from "@/lib/i18n/format"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DayCard, getFocusIcon } from "./day-card"
import { DayDetailSheet } from "./day-detail-sheet"

export function WeekBoard({
  mode,
  board,
  summary,
  rangeStartKey,
  rangeEndKey,
}: {
  mode: ScheduleMode
  board: BoardEntry[]
  summary: WeekSummary
  rangeStartKey: string | null
  rangeEndKey: string | null
}) {
  const { t, locale } = useI18n()
  const [selected, setSelected] = useState<BoardEntry | null>(null)

  const activeEntry =
    board.find(
      (entry) =>
        (entry.status === "TODAY" || entry.status === "CURRENT") &&
        entry.dayId
    ) ?? null
  const todayRestEntry =
    board.find((entry) => entry.status === "REST") ?? null

  const rangeLabel = useMemo(() => {
    if (mode === ScheduleMode.SEQUENTIAL) return null
    if (!rangeStartKey || !rangeEndKey) return null
    const end = new Date(rangeEndKey)
    end.setDate(end.getDate() - 1)
    const start = formatDate(rangeStartKey, locale)
    return `${start} – ${formatDate(end, locale)}`
  }, [mode, rangeStartKey, rangeEndKey, locale])

  const focusLabelText = activeEntry
    ? activeEntry.focus === "CUSTOM"
      ? (activeEntry.customFocus ??
        lookup(t, "trainingSplit.dayFocus.custom"))
      : lookup(
          t,
          `trainingSplit.dayFocus.${
            FOCUS_KEY_MAP[activeEntry.focus] ??
            activeEntry.focus.toLowerCase()
          }`
        )
    : ""

  const FocusIcon = activeEntry ? getFocusIcon(activeEntry.focus) : null

  return (
    <section className="space-y-4" aria-label={t.client.week.myWeek}>
      <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-energy-500/[0.03] to-transparent" aria-hidden="true" />
        <div className="absolute -right-10 -top-10 size-24 rounded-full bg-gradient-to-br from-brand-500/15 to-energy-500/10 blur-xl" aria-hidden="true" />
        <div className="relative p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight">
              {t.client.week.myWeek}
            </h1>
            <Badge variant="secondary" className="rounded-full">
              {mode === ScheduleMode.SEQUENTIAL
                ? lookup(t, "trainingSplit.scheduleModeSequential")
                : lookup(t, "trainingSplit.scheduleModeFixed")}
            </Badge>
            {rangeLabel ? (
              <span className="text-xs text-muted-foreground" dir="auto">
                {rangeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === ScheduleMode.SEQUENTIAL ? (locale === "ar" ? "بالترتيب — خلص يوم عشان اللي بعده يفتح" : "Sequential — finish a day to unlock next") : (locale === "ar" ? "أيام ثابتة — التزم بالجدول" : "Fixed weekdays — stick to the plan")}
          </p>
        </div>
      </div>

      {activeEntry ? (
        <TodaySpotlight
          entry={activeEntry}
          focusLabel={focusLabelText}
          icon={FocusIcon}
        />
      ) : todayRestEntry ? (
        <div className="flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-brand-500/10 to-brand-600/5 p-4 dark:from-brand-500/15 dark:to-brand-600/10">
          <MoonStar className="size-6 shrink-0 text-brand-600 dark:text-brand-400" />
          <div className="min-w-0">
            <p className="font-semibold">{t.client.week.restDay} 💤</p>
            <p className="truncate text-sm text-muted-foreground">
              {t.client.week.recoveryTip}
            </p>
          </div>
        </div>
      ) : null}

      {/* Mobile: vertical full-width list / md+: 7-column grid */}
      <div className="flex flex-col gap-2.5 md:grid md:gap-3">
        {board.map((entry) => (
          <DayCard
            key={entry.key}
            entry={entry}
            mode={mode}
            onOpen={() => setSelected(entry)}
          />
        ))}
      </div>

      {/* Weekly stats — fitness */}
      <div className="rounded-[20px] border bg-card p-4 shadow-soft">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <CalendarCheck2 className="size-3.5" />
              {t.client.week.workoutsThisWeek}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums" dir="ltr">
              {summary.done} <span className="text-sm font-medium text-muted-foreground">/ {summary.planned}</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-to-r from-brand-500 to-energy-500 transition-all" style={{ width: `${summary.planned ? (summary.done/summary.planned)*100 : 0}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-3">
            <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-performance-600" />
              {t.client.week.done}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums text-performance-600" dir="ltr">
              {summary.planned ? Math.round((summary.done/summary.planned)*100) : 0}%
            </p>
            <Progress
              value={summary.planned ? (summary.done / summary.planned) * 100 : 0}
              className="mt-2 h-1.5"
            />
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-energy-500 to-brand-500 p-3 text-white shadow-soft">
            <p className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-widest text-white/90">
              <Flame className="size-3.5 fill-white/20" />
              {t.client.week.streak}
            </p>
            <p className="mt-1 text-xl font-extrabold tabular-nums" dir="ltr">
              {summary.streak} <span className="text-sm font-medium text-white/80">{locale === "ar" ? "يوم" : "d"}</span>
            </p>
            <p className="mt-1 text-[11px] text-white/70">{summary.streak >=7 ? (locale==="ar"?"وحش!":"Beast!") : ""}</p>
          </div>
        </div>
      </div>

      <DayDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        entry={selected}
        mode={mode}
      />
    </section>
  )
}

const FOCUS_KEY_MAP: Record<string, string> = {
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

function TodaySpotlight({
  entry,
  focusLabel,
  icon: Icon,
}: {
  entry: BoardEntry
  focusLabel: string
  icon: ReturnType<typeof getFocusIcon>
}) {
  const { t } = useI18n()
  const done = entry.done

  return (
    <Link
      href={`/client/workout/session?dayId=${entry.dayId}`}
      className="group block rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-[1px] shadow-glass transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] dark:from-brand-500 dark:to-brand-600"
    >
      <div className="flex items-center gap-4 rounded-[15px] bg-background p-4">
        <span
          className={
            done
              ? "flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400"
              : "flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"
          }
        >
          {done ? (
            <CheckCircle2 className="size-6" />
          ) : Icon ? (
            <Icon className="size-6" />
          ) : (
            <Play className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300">
            {t.client.week.today}
          </p>
          <p className="truncate font-semibold">{focusLabel}</p>
          {(entry.exerciseCount ?? 0) > 0 ? (
            <p className="text-xs tabular-nums text-muted-foreground" dir="ltr">
              {interpolate(t.client.week.exercisesCount, {
                n: String(entry.exerciseCount ?? 0),
              })}
            </p>
          ) : null}
        </div>
        {!done ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-transform group-hover:scale-105 dark:from-brand-500 dark:to-brand-600">
            <Play className="size-4" />
            {lookup(t, "client.workout.startWorkout")}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {t.client.week.done}
          </span>
        )}
      </div>
    </Link>
  )
}
