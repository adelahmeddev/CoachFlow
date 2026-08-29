import type { ScheduleMode, Weekday, WeekStartDay } from "@/lib/db/enums"

/**
 * Canonical weekday cycle starting Saturday (matches the Weekday enum).
 * Index 0 = SAT … index 6 = FRI.
 */
export const WEEKDAY_CYCLE: Weekday[] = [
  "SAT",
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
]

/**
 * JS Date#getDay(): 0 = Sunday … 6 = Saturday.
 */
export const JS_GETDAY_TO_WEEKDAY: Weekday[] = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
]

export function jsDayToWeekday(date: Date): Weekday {
  return JS_GETDAY_TO_WEEKDAY[date.getDay()] ?? "SAT"
}

/**
 * Even distribution across the week starting from a given start day.
 * N days → offsets round(i*7/N), e.g. N=3 → SAT, MON, THU.
 */
export function evenDistributionOffsets(count: number): number[] {
  if (count <= 0) return []
  return Array.from({ length: count }, (_, i) => Math.round((i * 7) / count))
}

export function weekdayForOffset(offset: number, weekStart: Weekday): Weekday {
  const startIndex = WEEKDAY_CYCLE.indexOf(weekStart)
  const base = startIndex === -1 ? 0 : startIndex
  return WEEKDAY_CYCLE[(base + ((offset % 7) + 7)) % 7] ?? "SAT"
}

/**
 * Auto-assign weekdays: even distribution from weekStartDay.
 */
export function autoAssignWeekdays(
  count: number,
  weekStart: Weekday = "SAT"
): Weekday[] {
  return evenDistributionOffsets(count).map((offset) =>
    weekdayForOffset(offset, weekStart)
  )
}

interface WeekdayCarrier {
  weekday?: Weekday | null
}

/**
 * Runtime fallback for FIXED splits read from storage:
 * keeps explicit weekdays, fills nulls deterministically using the same
 * even-distribution sequence (skipping slots already taken).
 * Never crashes, never returns duplicates.
 */
export function resolveWeekdays<T extends WeekdayCarrier>(
  days: T[],
  weekStart: Weekday = "SAT"
): (Weekday | null)[] {
  const used = new Set<Weekday>()
  for (const day of days) {
    if (day.weekday) used.add(day.weekday)
  }

  const queue = autoAssignWeekdays(days.length + used.size, weekStart).filter(
    (weekday) => !used.has(weekday)
  )

  return days.map((day) => {
    if (day.weekday) return day.weekday
    const next = queue.shift() ?? null
    if (next) used.add(next)
    return next
  })
}

export interface BoardSplitDay {
  id: string
  dayNumber: number
  focus: string
  customFocus?: string | null
  weekday?: Weekday | null
}

export type DayStatus =
  | "DONE"
  | "TODAY"
  | "MISSED"
  | "UPCOMING"
  | "REST"
  | "CURRENT"

export interface BoardEntry {
  key: string
  dayId: string | null
  dayNumber: number | null
  focus: string
  customFocus: string | null
  weekday: Weekday | null
  /** Local calendar date key yyyy-mm-dd */
  dateKey: string
  status: DayStatus
  /** Logs exist for this training day/date */
  done: boolean
  /** Logs exist on a REST day */
  extraWorkout: boolean
  /** Number of exercises planned for this training day (null for rest) */
  exerciseCount?: number | null
}

export interface WeekSummary {
  planned: number
  done: number
  streak: number
}

/** Local-timezone yyyy-mm-dd key. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Add days to a yyyy-mm-dd key without timezone drift. */
export function addDaysToDateKey(dateKey: string, amount: number): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

/**
 * Calendar date of the week start (weekStartDay) for the week
 * containing `reference`.
 */
export function weekStartDate(
  weekStart: WeekStartDay | Weekday,
  reference: Date
): Date {
  const start = startOfDay(reference)
  const startIndex = Math.max(WEEKDAY_CYCLE.indexOf(weekStart as Weekday), 0)
  const todayOffset =
    (WEEKDAY_CYCLE.indexOf(jsDayToWeekday(start)) - startIndex + 7) % 7
  return addDays(start, -todayOffset)
}

/**
 * Calendar date of `weekday` inside the week (starting `weekStart`)
 * that contains `reference`.
 */
export function weekdayToDate(
  weekday: Weekday,
  weekStart: WeekStartDay | Weekday,
  reference: Date
): Date {
  const weekStart_ = weekStartDate(weekStart, reference)
  const startIndex = Math.max(WEEKDAY_CYCLE.indexOf(weekStart as Weekday), 0)
  const position = (WEEKDAY_CYCLE.indexOf(weekday) - startIndex + 7) % 7
  return addDays(weekStart_, position)
}

/**
 * FIXED board: exactly 7 entries ordered from weekStartDay.
 * - Training day slot: DONE (logs that date) / MISSED (past, no logs) /
 *   TODAY (done flag if logged) / UPCOMING (future)
 * - Non-training slot: REST (extraWorkout flag if logs that date)
 */
export function buildFixedBoard(
  days: BoardSplitDay[],
  weekStartDay: WeekStartDay | Weekday,
  today: Date,
  loggedDates: Set<string>
): BoardEntry[] {
  const safeDays = days.length > 0 ? days : []
  const resolved = resolveWeekdays(safeDays)

  const byWeekday = new Map<Weekday, BoardSplitDay>()
  safeDays.forEach((day, index) => {
    const weekday = resolved[index]
    if (!weekday) return
    const existing = byWeekday.get(weekday)
    if (!existing || day.dayNumber < existing.dayNumber) {
      byWeekday.set(weekday, day)
    }
  })

  const startIndex = Math.max(WEEKDAY_CYCLE.indexOf(weekStartDay as Weekday), 0)
  const todayKey = toDateKey(today)

  const entries: BoardEntry[] = []
  for (let slot = 0; slot < 7; slot++) {
    const weekday = WEEKDAY_CYCLE[(startIndex + slot) % 7] ?? "SAT"
    const date = weekdayToDate(weekday, weekStartDay as WeekStartDay, today)
    const dateKey = toDateKey(date)
    const trainingDay = byWeekday.get(weekday) ?? null
    const hasLogs = loggedDates.has(dateKey)

    if (!trainingDay) {
      entries.push({
        key: `rest-${weekday}`,
        dayId: null,
        dayNumber: null,
        focus: "REST",
        customFocus: null,
        weekday,
        dateKey,
        status: "REST",
        done: false,
        extraWorkout: hasLogs,
      })
      continue
    }

    let status: DayStatus
    if (dateKey === todayKey) {
      status = "TODAY"
    } else if (dateKey < todayKey) {
      status = hasLogs ? "DONE" : "MISSED"
    } else {
      status = "UPCOMING"
    }

    entries.push({
      key: `day-${trainingDay.id}`,
      dayId: trainingDay.id,
      dayNumber: trainingDay.dayNumber,
      focus: trainingDay.focus,
      customFocus: trainingDay.customFocus ?? null,
      weekday,
      dateKey,
      status,
      done: hasLogs,
      extraWorkout: false,
    })
  }

  return entries
}

/**
 * SEQUENTIAL board: one entry per day in step order.
 * Logged → DONE; first unlogged → CURRENT; rest → UPCOMING.
 */
export function buildSequentialBoard(
  days: BoardSplitDay[],
  loggedByDayId: Record<string, boolean>,
  today: Date
): BoardEntry[] {
  const todayKey = toDateKey(today)
  let currentAssigned = false

  return days.map((day) => {
    const done = Boolean(loggedByDayId[day.id])
    let status: DayStatus
    if (done) {
      status = "DONE"
    } else if (!currentAssigned) {
      status = "CURRENT"
      currentAssigned = true
    } else {
      status = "UPCOMING"
    }

    return {
      key: `seq-${day.id}`,
      dayId: day.id,
      dayNumber: day.dayNumber,
      focus: day.focus,
      customFocus: day.customFocus ?? null,
      weekday: day.weekday ?? null,
      dateKey: todayKey,
      status,
      done,
      extraWorkout: false,
    }
  })
}

/**
 * Consecutive completed training entries counting backwards from the
 * active entry (today / current turn). Rest days never break the chain.
 */
export function computeStreak(
  board: BoardEntry[],
  scheduleMode: ScheduleMode | string
): number {
  const trainingEntries =
    scheduleMode === "SEQUENTIAL"
      ? [...board].reverse()
      : [...board]
          .reverse()
          .sort((a, b) => (a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0))

  let streak = 0
  let activeSkipped = false

  for (const entry of trainingEntries) {
    const isActive = entry.status === "TODAY" || entry.status === "CURRENT"
    if (isActive && !entry.done && !activeSkipped) {
      activeSkipped = true
      continue
    }
    if (entry.status === "DONE" || (isActive && entry.done)) {
      streak += 1
      continue
    }
    if (entry.status === "MISSED") break
    if ((entry.status === "UPCOMING" || entry.status === "CURRENT") && !entry.done) {
      break
    }
  }

  return streak
}

export function summarizeBoard(
  board: BoardEntry[],
  scheduleMode: ScheduleMode | string
): WeekSummary {
  const trainingEntries = board.filter((entry) => entry.dayId !== null)
  return {
    planned: trainingEntries.length,
    done: trainingEntries.filter((entry) => entry.done).length,
    streak: computeStreak(board, scheduleMode),
  }
}
