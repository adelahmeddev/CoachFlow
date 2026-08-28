"use client"

import { createElement } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  Bike,
  CheckCircle2,
  CircleX,
  Clock3,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Magnet,
  MoonStar,
  PersonStanding,
  Sparkles,
  Wind,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { interpolate } from "@/lib/i18n/format"
import type { Dictionary } from "@/lib/i18n/messages/en"
import type { BoardEntry } from "@/lib/calculations/week-schedule"

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

export function getFocusIcon(focus: string): LucideIcon | null {
  return FOCUS_ICONS[focus] ?? null
}

function focusLabel(
  t: Dictionary,
  focus: string,
  customFocus: string | null
): string {
  if (focus === "CUSTOM") return customFocus || lookup(t, "trainingSplit.dayFocus.custom")
  const key = FOCUS_LABEL_KEYS[focus]
  return key ? lookup(t, `trainingSplit.dayFocus.${key}`) : focus
}

export function DayCard({
  entry,
  mode,
  onOpen,
}: {
  entry: BoardEntry
  mode: "FIXED_WEEKDAYS" | "SEQUENTIAL"
  onOpen?: () => void
}) {
  const { t } = useI18n()

  const isActive = entry.status === "TODAY" || entry.status === "CURRENT"
  const isDone = entry.status === "DONE" || (isActive && entry.done)
  const isMissed = entry.status === "MISSED"
  const isRest = !entry.dayId
  const dayOfMonth = Number(entry.dateKey.slice(8, 10))

  const title =
    mode === "FIXED_WEEKDAYS"
      ? entry.weekday
        ? lookup(t, `trainingSplit.weekdays.${entry.weekday}`)
        : "—"
      : interpolate(t.client.week.dayN, { n: entry.dayNumber ?? 0 })

  const focusIcon: LucideIcon | null = entry.dayId
    ? (getFocusIcon(entry.focus) ?? null)
    : null

  const statusLabel = (() => {
    if (isDone && isActive) return t.client.week.done
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

  const statusPill = (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium md:px-1.5",
        isActive &&
          (entry.done
            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"),
        entry.status === "DONE" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        entry.status === "MISSED" &&
          "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        (entry.status === "UPCOMING" || entry.status === "REST") &&
          "bg-muted text-muted-foreground"
      )}
    >
      {statusLabel}
    </span>
  )

  const bubble = mode === "FIXED_WEEKDAYS" ? (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-semibold tabular-nums",
        isActive
          ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"
          : isRest
            ? "bg-muted text-muted-foreground"
            : "bg-background text-foreground"
      )}
      dir="ltr"
    >
      {dayOfMonth}
    </span>
  ) : (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold tabular-nums",
        isActive
          ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft dark:from-brand-500 dark:to-brand-600"
          : isRest
            ? "bg-muted text-muted-foreground"
            : "bg-background text-foreground"
      )}
      dir="ltr"
    >
      {entry.dayNumber ?? "—"}
    </span>
  )

  const focusLine = (
    <p className="flex min-w-0 items-center gap-1.5 leading-snug">
      {entry.dayId && focusIcon
        ? createElement(focusIcon, {
            className: cn(
              "size-4 shrink-0 md:size-3.5",
              isActive
                ? "text-brand-600 dark:text-brand-400"
                : "text-muted-foreground/70"
            ),
          })
        : null}
      <span className="min-w-0 truncate text-sm md:text-xs">
        {entry.dayId ? focusLabel(t, entry.focus, entry.customFocus) : `${t.client.week.rest} 💤`}
      </span>
    </p>
  )

  const countLine =
    entry.dayId && (entry.exerciseCount ?? 0) > 0 ? (
      <p
        className="text-xs tabular-nums text-muted-foreground/80 md:text-[11px]"
        dir="ltr"
      >
        {interpolate(t.client.week.exercisesCount, {
          n: String(entry.exerciseCount ?? 0),
        })}
      </p>
    ) : null

  const activeIcon = (() => {
    if (!isActive) return null
    return (
      <span className="relative flex size-4 items-center justify-center">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            entry.done ? "bg-emerald-400" : "bg-brand-400"
          )}
        />
        <Zap
          className={cn(
            "relative size-4",
            entry.done
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-brand-600 dark:text-brand-400"
          )}
        />
      </span>
    )
  })()

  const staticStatusIcon = (() => {
    const cls = "size-4 shrink-0"
    switch (entry.status) {
      case "DONE":
        return <CheckCircle2 className={cn(cls, "text-emerald-600 dark:text-emerald-400")} />
      case "MISSED":
        return <CircleX className={cn(cls, "text-rose-600 dark:text-rose-400")} />
      case "UPCOMING":
        return <Clock3 className={cn(cls, "text-muted-foreground")} />
      case "REST":
        return <MoonStar className={cn(cls, "text-muted-foreground")} />
      default:
        return null
    }
  })()

  const trailing = (
    <div className="flex shrink-0 flex-col items-center gap-1.5 md:flex-row">
      {activeIcon ?? staticStatusIcon}
      {statusPill}
      {entry.extraWorkout ? (
        <Flame
          className="size-4 shrink-0 text-orange-500 md:size-3.5"
          aria-label={t.client.week.extraWorkout}
        />
      ) : null}
    </div>
  )

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${title} — ${statusLabel}`}
      className={cn(
        "group w-full rounded-2xl text-start transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive && "hover:-translate-y-1"
      )}
    >
      {/* Mobile: full-width horizontal row / md+: vertical card */}
      <div
        className={cn(
          "flex h-full items-center gap-3 rounded-[14px] border p-4 transition-shadow duration-200 group-hover:shadow-md md:flex-col md:items-stretch md:gap-1.5 md:p-3",
          isActive
            ? "border-brand-500/40 bg-gradient-to-b from-brand-500/10 to-transparent shadow-glass dark:border-brand-400/30"
            : "bg-white/50 group-hover:bg-white/70 dark:bg-white/5 dark:group-hover:bg-white/10",
          isDone && !isActive && "border-emerald-600/20 bg-emerald-500/5 dark:border-emerald-400/20 dark:bg-emerald-400/5",
          isMissed && "opacity-75",
          isRest && "opacity-80"
        )}
      >
        {bubble}

        <div className="min-w-0 flex-1 space-y-0.5 md:min-h-[2.6rem] md:space-y-1">
          <span className="block truncate text-sm font-semibold md:text-xs">
            {title}
          </span>
          {focusLine}
          {countLine}
        </div>

        <div className="hidden shrink-0 items-center justify-between gap-1.5 md:flex">
          {activeIcon ?? staticStatusIcon}
          {statusPill}
          {entry.extraWorkout ? (
            <Flame
              className="size-3.5 shrink-0 text-orange-500"
              aria-label={t.client.week.extraWorkout}
            />
          ) : null}
        </div>

        <div className="md:hidden">{trailing}</div>
      </div>
    </button>
  )
}
