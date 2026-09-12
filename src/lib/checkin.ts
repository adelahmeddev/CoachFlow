/**
 * Daily check-in streak helpers (pure — safe to unit test).
 *
 * Check-ins are stored as DailyLog rows (one per client per day via the
 * @@unique([clientId, date]) constraint). A row counts as a "check-in" when
 * at least one of the check-in fields (energy, sleep, mood, note) is set.
 */

export interface StreakResult {
  current: number
  longest: number
  /** YYYY-MM-DD of the most recent check-in, or null when never checked in. */
  lastCheckIn: string | null
  /** Whether the client already checked in on `todayKey`. */
  checkedInToday: boolean
}

export function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function todayKey(now: Date = new Date()): string {
  return toDayKey(now)
}

function prevDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return toDayKey(d)
}

function nextDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return toDayKey(d)
}

/**
 * Calculate current/longest streak from a set of check-in day keys.
 * - `dayKeys` may be unsorted and may contain duplicates or future dates
 *   (future dates are ignored).
 * - The current streak stays alive when the last check-in was yesterday
 *   (today simply hasn't been logged yet); any older gap breaks it.
 */
export function calcStreak(dayKeys: string[], today: string): StreakResult {
  const set = new Set(dayKeys.filter((k) => k <= today))
  if (set.size === 0) {
    return { current: 0, longest: 0, lastCheckIn: null, checkedInToday: false }
  }

  const sorted = [...set].sort()
  const lastCheckIn = sorted[sorted.length - 1]!

  // Longest run anywhere in the window.
  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (nextDayKey(sorted[i - 1]!) === sorted[i]) {
      run += 1
      if (run > longest) longest = run
    } else {
      run = 1
    }
  }

  // Current streak: walk back from today (or yesterday when today is missing).
  let current = 0
  let cursor = today
  if (!set.has(cursor)) cursor = prevDayKey(cursor)
  while (set.has(cursor)) {
    current += 1
    cursor = prevDayKey(cursor)
  }

  return {
    current,
    longest,
    lastCheckIn,
    checkedInToday: set.has(today),
  }
}

/** A DailyLog row counts as a check-in when any check-in field is set. */
export function isCheckInRow(row: {
  energyLevel?: number | null
  sleepHours?: number | null
  moodLevel?: number | null
  notes?: string | null
}): boolean {
  return (
    row.energyLevel != null ||
    row.sleepHours != null ||
    row.moodLevel != null ||
    (row.notes != null && row.notes.trim().length > 0)
  )
}
