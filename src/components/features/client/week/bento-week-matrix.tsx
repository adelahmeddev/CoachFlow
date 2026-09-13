"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Bike,
  CalendarDays,
  CheckCircle2,
  CircleX,
  Clock3,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Magnet,
  MoonStar,
  PersonStanding,
  Play,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { formatDate, interpolate } from "@/lib/i18n/format"
import { toDateKey } from "@/lib/calculations/week-schedule"
import { cn } from "@/lib/utils"
import type {
  BoardEntry,
  WeekSummary,
} from "@/lib/calculations/week-schedule"
import { ScheduleMode, type WorkoutDisplayMode } from "@/lib/db/enums"
import { DayDetailSheet } from "./day-detail-sheet"
import { getMyDayDetailAction } from "@/server/actions/client-portal"

const FOCUS_LABEL_KEYS: Record<string, string> = {
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
  CUSTOM: "custom",
}

const FOCUS_ICONS: Record<string, LucideIcon> = {
  UPPER: Dumbbell,
  LOWER: Footprints,
  FULL_BODY: PersonStanding,
  PUSH: Zap,
  PULL: Magnet,
  LEGS: Bike,
  SHOULDERS_ARMS: Activity,
  CARDIO: HeartPulse,
  MOBILITY: Wind,
  CUSTOM: Sparkles,
  REST: MoonStar,
}

function focusText(
  t: Parameters<typeof lookup>[0],
  focus: string,
  customFocus: string | null
): string {
  if (focus === "CUSTOM")
    return customFocus || lookup(t, "trainingSplit.dayFocus.custom")
  const key = FOCUS_LABEL_KEYS[focus]
  return key ? lookup(t, `trainingSplit.dayFocus.${key}`) : focus
}

/**
 * Whisper-quiet specular light: top-edge hairline + soft top-left
 * reflection. Static decorative layers only — no logic, GPU-cheap.
 */
function GlassSheen({ opacity = 1 }: { opacity?: number }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ opacity }}>
      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <span className="absolute -top-10 -left-10 size-24 rounded-full bg-white/[0.05] blur-2xl" />
    </span>
  )
}

function dayTitle(
  t: Parameters<typeof lookup>[0],
  mode: ScheduleMode,
  entry: BoardEntry
): string {
  if (mode === ScheduleMode.FIXED_WEEKDAYS) {
    return entry.weekday
      ? lookup(t, `trainingSplit.weekdays.${entry.weekday}`)
      : "—"
  }
  return interpolate(t.client.week.dayN, { n: entry.dayNumber ?? 0 })
}

export function BentoWeekMatrix({
  mode,
  board,
  summary,
  rangeStartKey,
  rangeEndKey,
  workoutDisplayMode,
}: {
  mode: ScheduleMode
  board: BoardEntry[]
  summary: WeekSummary
  rangeStartKey: string | null
  rangeEndKey: string | null
  workoutDisplayMode: WorkoutDisplayMode
}) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const [selected, setSelected] = useState<BoardEntry | null>(null)

  // Local calendar key — same helper the service uses to stamp TODAY/REST.
  const todayKey = toDateKey(new Date())

  const activeEntry =
    board.find(
      (entry) =>
        (entry.status === "TODAY" || entry.status === "CURRENT") && entry.dayId
    ) ?? null
  // Prefer the REST slot that is actually today; fall back to the first one.
  const todayRestEntry =
    board.find(
      (entry) => entry.status === "REST" && entry.dateKey === todayKey
    ) ??
    board.find((entry) => entry.status === "REST") ??
    null
  const restHeroIsToday =
    todayRestEntry !== null && todayRestEntry.dateKey === todayKey

  const tiles = useMemo(
    () =>
      activeEntry
        ? board.filter((entry) => entry.key !== activeEntry.key)
        : board,
    [board, activeEntry]
  )

  const rangeLabel = useMemo(() => {
    if (mode === ScheduleMode.SEQUENTIAL) return null
    if (!rangeStartKey || !rangeEndKey) return null
    const end = new Date(rangeEndKey)
    end.setDate(end.getDate() - 1)
    const start = formatDate(rangeStartKey, locale)
    return `${start} – ${formatDate(end, locale)}`
  }, [mode, rangeStartKey, rangeEndKey, locale])

  const adherence = summary.planned
    ? Math.round((summary.done / summary.planned) * 100)
    : 0
  // DAY_NAME_ONLY: day names + focus only — no counts, previews, or set bars.
  const nameOnly = workoutDisplayMode === "DAY_NAME_ONLY"

  return (
    <section
      className={cn("relative space-y-5", isAr && "font-[var(--font-arabic)]")}
      aria-label={t.client.week.myWeek}
    >
      {/* Ambient atmospheric light — barely-there, never a visible gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 start-0 end-0 h-72 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(150,17,18,0.10),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 end-0 h-56 w-2/3 bg-[radial-gradient(ellipse_50%_45%_at_80%_20%,rgba(147,197,253,0.05),transparent)]"
      />

      {/* 1 — Weekly summary glass banner */}
      <div className="relative h-14 px-5 rounded-2xl backdrop-blur-2xl bg-gradient-to-b from-white/[0.10] via-white/[0.035] to-neutral-950/70 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.40)] flex items-center justify-between mb-5 gap-3 transform-gpu overflow-hidden">
        <GlassSheen />
        <p className="relative flex min-w-0 items-center gap-2 text-sm font-bold truncate">
          <Flame className="size-4 shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" aria-hidden="true" />
          <span className="truncate text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.18)]">
            {isAr
              ? `الأسبوع التدريبي: ${summary.done} من ${summary.planned} تمارين مكتملة`
              : `Training week: ${summary.done} of ${summary.planned} workouts done`}
          </span>
        </p>
        <div className="relative flex shrink-0 items-center gap-2">
          {rangeLabel ? (
            <span
              className="hidden text-[11px] tabular-nums text-muted-foreground sm:block"
              dir="auto"
            >
              {rangeLabel}
            </span>
          ) : null}
          <span
            className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs tabular-nums font-bold text-emerald-300 ring-1 ring-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
            dir="ltr"
          >
            {adherence}%
          </span>
        </div>
      </div>

      {board.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.10] via-white/[0.035] to-neutral-950/70 p-8 text-center backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.40)] transform-gpu">
          <GlassSheen opacity={0.6} />
          <CalendarDays
            className="mx-auto size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-2 font-bold">{t.client.week.noWorkoutPlanned}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4 transform-gpu">
          {activeEntry ? (
            <HeroTile
              entry={activeEntry}
              mode={mode}
              displayMode={workoutDisplayMode}
            />
          ) : todayRestEntry ? (
            <RestHeroTile isToday={restHeroIsToday} />
          ) : null}
          {tiles.map((entry) =>
            entry.dayId ? (
              <BentoDayTile
                key={entry.key}
                entry={entry}
                mode={mode}
                hideCounts={nameOnly}
                onOpen={() => setSelected(entry)}
              />
            ) : (
              <BentoRestTile
                key={entry.key}
                entry={entry}
                mode={mode}
                isToday={entry.dateKey === todayKey}
                onOpen={() => setSelected(entry)}
              />
            )
          )}
        </div>
      )}

      <DayDetailSheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        entry={selected}
        mode={mode}
        displayMode={workoutDisplayMode}
      />
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Hero: today's featured workout (double-span tile)                   */
/* ------------------------------------------------------------------ */

function HeroTile({
  entry,
  mode,
  displayMode,
}: {
  entry: BoardEntry
  mode: ScheduleMode
  displayMode: WorkoutDisplayMode
}) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const nameOnly = displayMode === "DAY_NAME_ONLY"
  const [sets, setSets] = useState<{ done: number; total: number } | null>(
    null
  )

  useEffect(() => {
    let cancelled = false
    if (!entry.dayId || nameOnly) return
    getMyDayDetailAction(entry.dayId).then((detail) => {
      if (cancelled || !detail) return
      const total = detail.exercises.reduce(
        (s, ex) => s + (ex.targetSets ?? 0),
        0
      )
      const done = detail.exercises.reduce(
        (s, ex) => s + (ex.actualSets ?? 0),
        0
      )
      setSets({ done, total })
    })
    return () => {
      cancelled = true
    }
  }, [entry.dayId, nameOnly])

  const FocusIcon = FOCUS_ICONS[entry.focus] ?? Dumbbell
  const setsPct =
    sets && sets.total > 0
      ? Math.min(100, Math.round((sets.done / sets.total) * 100))
      : 0

  // Single source of truth: the board's done flag (logs recorded for today).
  const isComplete = entry.done
  const StateIcon = isComplete ? CheckCircle2 : FocusIcon

  return (
    <div className="col-span-1 sm:col-span-2 relative transform-gpu">
      {/* Outer aura: the card emits energy — controlled, not neon */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-1.5 rounded-[28px] blur-2xl transition-all duration-500",
          isComplete ? "bg-emerald-500/20" : "bg-[#961112]/20"
        )}
      />
      <article
        className={cn(
          "relative overflow-hidden rounded-3xl p-6 border backdrop-blur-2xl flex flex-col justify-between gap-4 min-h-[220px] transform-gpu transition-all duration-500",
          isComplete
            ? "bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.35)_0%,_rgba(16,185,129,0.10)_35%,_rgba(10,10,10,0.72)_75%,_rgba(5,5,5,0.92)_100%)] border-emerald-400/40 border-t-emerald-300/30 ring-2 ring-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.35),0_15px_50px_rgba(0,0,0,0.45)]"
            : "bg-[radial-gradient(ellipse_at_top_right,_rgba(150,17,18,0.45)_0%,_rgba(150,17,18,0.12)_35%,_rgba(10,10,10,0.72)_75%,_rgba(5,5,5,0.92)_100%)] border-[#961112]/40 border-t-white/30 ring-2 ring-[#961112] shadow-[0_0_35px_rgba(150,17,18,0.45),0_15px_50px_rgba(0,0,0,0.45)]"
        )}
      >
        {/* Inner state illumination + glass sheen */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-20 start-1/4 size-56 rounded-full blur-3xl transition-all duration-500",
            isComplete ? "bg-emerald-500/25" : "bg-[#961112]/30"
          )}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.07] to-transparent"
        />
        <GlassSheen />

        <div className="relative flex items-center gap-2 text-xs font-bold">
          {isComplete ? (
            <span className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)] backdrop-blur-md flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden="true" />
              {t.client.week.done} • {t.client.week.today}
            </span>
          ) : (
            <span className="bg-[#961112]/25 border border-[#961112]/60 text-white shadow-[0_0_12px_rgba(150,17,18,0.25)] backdrop-blur-md flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" aria-hidden="true" />
              {isAr ? "مباشر • تمرين اليوم" : "LIVE • Today's workout"}
            </span>
          )}
          <span className="ms-auto rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.18)] ring-1 ring-white/15">
            {dayTitle(t, mode, entry)}
          </span>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl text-white transition-all duration-500",
                isComplete
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_16px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-br from-[#961112] to-[#d21f1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_16px_rgba(150,17,18,0.5)]"
              )}
            >
              <StateIcon className="size-6 drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]" aria-hidden="true" />
            </span>
            <h2 className="min-w-0 flex-1 truncate text-lg font-extrabold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.18)]">
              {focusText(t, entry.focus, entry.customFocus)}
            </h2>
          </div>
        {nameOnly ? null : (
          <>
            <p
              className="mt-2 text-xs tabular-nums text-neutral-200"
              dir={isAr ? "rtl" : "ltr"}
            >
              {(entry.exerciseCount ?? 0) > 0
                ? interpolate(t.client.week.exercisesCount, {
                    n: String(entry.exerciseCount ?? 0),
                  })
                : null}
              {sets && sets.total > 0 ? (
                <span
                  className="ms-2 font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.18)]"
                  dir="ltr"
                >
                  {sets.done}/{sets.total} {isAr ? "مجموعات" : "sets"}
                </span>
              ) : null}
            </p>
            <div
              className="mt-2.5 h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10"
              role="progressbar"
              aria-valuenow={setsPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] transition-[width] duration-700"
                style={{ width: `${sets ? setsPct : 0}%` }}
              />
            </div>
          </>
        )}
        </div>

      {isComplete ? (
        <div className="relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 px-5 text-sm text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_18px_rgba(16,185,129,0.35)]">
          <CheckCircle2 className="relative size-4" aria-hidden="true" />
          <span className="relative">
            {t.client.week.done} • {t.client.week.today}
          </span>
        </div>
      ) : (
        <Link
          href={`/client/workout/session?dayId=${entry.dayId}`}
          className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#961112] via-red-700 to-[#961112] px-5 text-sm text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_18px_rgba(150,17,18,0.45)] transition-all duration-200 hover:brightness-110 active:scale-95"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
          <Play className="relative size-4" aria-hidden="true" />
          <span className="relative">
            {isAr ? "ابدأ التمرين الآن" : "Start workout now"}
          </span>
        </Link>
      )}
      </article>
    </div>
  )
}

function RestHeroTile({ isToday }: { isToday: boolean }) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  return (
    <article
      className={cn(
        "col-span-1 sm:col-span-2 relative overflow-hidden rounded-3xl p-6 backdrop-blur-2xl border flex flex-col justify-between gap-4 min-h-[220px] transform-gpu transition-all duration-500",
        isToday
          ? "bg-gradient-to-b from-white/[0.08] via-white/[0.035] to-neutral-950/70 border-white/15 border-t-white/25 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(255,255,255,0.06)]"
          : "bg-gradient-to-b from-white/[0.10] via-white/[0.035] to-neutral-950/70 border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.40)]"
      )}
    >
      <GlassSheen opacity={0.7} />
      <div className="relative flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <MoonStar className="size-4" aria-hidden="true" />
        {t.client.week.restDay}
        {isToday ? (
          <span className="bg-white/10 border border-white/20 text-neutral-100 backdrop-blur-md flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ms-auto">
            <span className="size-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.8)]" aria-hidden="true" />
            {t.client.week.today} • {t.client.week.rest}
          </span>
        ) : (
          <span className="ms-auto rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-200">
            {t.client.week.today}
          </span>
        )}
      </div>
      <div className="relative">
        <h2 className="text-lg font-extrabold tracking-tight">
          {isAr ? "يوم راحة واستشفاء" : "Rest & recovery day"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.client.week.recoveryTip}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <MoonStar className="size-3.5 shrink-0 text-brand-400" aria-hidden="true" />
            {t.client.week.restTips.sleep}
          </li>
          <li className="flex items-center gap-2">
            <Droplets className="size-3.5 shrink-0 text-sky-400" aria-hidden="true" />
            {t.client.week.restTips.water}
          </li>
        </ul>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Standard workout day tile                                           */
/* ------------------------------------------------------------------ */

function BentoDayTile({
  entry,
  mode,
  hideCounts,
  onOpen,
}: {
  entry: BoardEntry
  mode: ScheduleMode
  hideCounts: boolean
  onOpen: () => void
}) {
  const { t } = useI18n()
  const isDone = entry.status === "DONE" || entry.done
  const isActive = entry.status === "TODAY" || entry.status === "CURRENT"
  const isMissed = entry.status === "MISSED"
  const FocusIcon = FOCUS_ICONS[entry.focus] ?? Dumbbell

  const statusLabel = (() => {
    if (isDone) return t.client.week.done
    switch (entry.status) {
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
      default:
        return t.client.week.upcoming
    }
  })()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${dayTitle(t, mode, entry)} — ${statusLabel}`}
      className="group relative col-span-1 rounded-3xl p-4 backdrop-blur-2xl bg-gradient-to-b from-white/[0.10] via-white/[0.035] to-neutral-950/70 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),inset_0_-1px_1px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.40)] overflow-hidden hover:border-white/30 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between min-h-[160px] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transform-gpu"
    >
      <GlassSheen opacity={0.6} />
      <div className="relative flex items-center justify-between gap-2">
        <p className="truncate text-sm font-extrabold">
          {dayTitle(t, mode, entry)}
        </p>
        {isDone ? (
          <CheckCircle2
            className="size-4 shrink-0 text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
            aria-hidden="true"
          />
        ) : isActive ? (
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-beacon rounded-full bg-emerald-500" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
        ) : isMissed ? (
          <CircleX
            className="size-4 shrink-0 text-rose-400"
            aria-hidden="true"
          />
        ) : (
          <Clock3
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="relative mt-3 flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            isDone
              ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30"
              : "bg-gradient-to-br from-[#961112]/60 to-[#d21f1f]/40 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          )}
        >
          <FocusIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {focusText(t, entry.focus, entry.customFocus)}
          </p>
          {hideCounts ? null : (
            <p className="text-[11px] tabular-nums text-muted-foreground" dir="ltr">
              {interpolate(t.client.week.exercisesCount, {
                n: String(entry.exerciseCount ?? 0),
              })}
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            isDone
              ? "bg-emerald-500/10 border border-emerald-400/30 text-emerald-300"
              : isActive
                ? "bg-[#961112]/30 text-white ring-1 ring-[#961112]/50"
                : isMissed
                  ? "bg-rose-500/10 text-rose-400"
                  : "bg-white/5 text-muted-foreground"
          )}
        >
          {statusLabel}
        </span>
        {entry.extraWorkout ? (
          <Flame
            className="size-4 shrink-0 text-orange-500"
            aria-label={t.client.week.extraWorkout}
          />
        ) : null}
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Rest / recovery tile                                                */
/* ------------------------------------------------------------------ */

function BentoRestTile({
  entry,
  mode,
  isToday,
  onOpen,
}: {
  entry: BoardEntry
  mode: ScheduleMode
  isToday: boolean
  onOpen: () => void
}) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${dayTitle(t, mode, entry)} — ${t.client.week.rest}`}
      className={cn(
        "group col-span-1 rounded-3xl p-4 backdrop-blur-2xl border flex flex-col justify-between min-h-[160px] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 transform-gpu transition-all duration-500 hover:-translate-y-0.5 active:scale-[0.99]",
        isToday
          ? "bg-gradient-to-b from-white/[0.08] via-white/[0.035] to-neutral-950/70 border-white/15 border-t-white/25 ring-1 ring-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.20),0_12px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(255,255,255,0.06)] opacity-100"
          : "bg-neutral-950/35 border-white/5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] opacity-60 hover:opacity-100"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "truncate text-sm font-extrabold",
            isToday ? "text-neutral-100" : "text-muted-foreground"
          )}
        >
          {dayTitle(t, mode, entry)}
        </p>
        {isToday ? (
          <span className="bg-white/10 border border-white/20 text-neutral-100 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
            <span className="size-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.8)]" aria-hidden="true" />
            {t.client.week.today}
          </span>
        ) : (
          <MoonStar
            className="size-4 shrink-0 text-muted-foreground/60"
            aria-hidden="true"
          />
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-bold text-muted-foreground">
          {isAr ? "يوم راحة واستشفاء" : "Rest & recovery"}
        </p>
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
          <Footprints
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span className="line-clamp-2">{t.client.week.restTips.stretch}</span>
        </p>
      </div>
      <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
        <Droplets className="size-3" aria-hidden="true" />
        {t.client.week.rest}
      </span>
    </button>
  )
}
