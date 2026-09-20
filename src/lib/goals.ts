/**
 * Client-goal helpers (pure — safe to unit test).
 *
 * WEIGHT / BODY_FAT / MUSCLE goals auto-resolve their current value from the
 * latest InBody entry (see goal.service.ts). All other types track the
 * coach-entered `currentValue`.
 */

import type { Goal, GoalType } from "@/lib/db/enums"

/**
 * Safely parses goals from any format (Array, Postgres array string "{A,B}", JSON string, or single string)
 * into a strongly-typed Goal[] array. Always returns an array, never throws.
 */
export function parseGoals(goals: unknown): Goal[] {
  if (!goals) return []
  if (Array.isArray(goals)) {
    return goals
      .map((g) => (typeof g === "string" ? g.trim() : ""))
      .filter(Boolean) as Goal[]
  }
  if (typeof goals === "string") {
    const trimmed = goals.trim()
    if (!trimmed || trimmed === "{}" || trimmed === "[]") return []

    // JSON array string e.g. '["WEIGHT_LOSS"]'
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed
            .map((g) => (typeof g === "string" ? g.trim() : ""))
            .filter(Boolean) as Goal[]
        }
      } catch {
        // fallback below
      }
    }

    // Postgres array format e.g. "{WEIGHT_LOSS,MUSCLE_BUILDING}"
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const inner = trimmed.slice(1, -1).trim()
      if (!inner) return []
      return inner
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, "").trim())
        .filter(Boolean) as Goal[]
    }

    // Single goal string
    return [trimmed as Goal]
  }
  return []
}


export const AUTO_SYNCED_GOAL_TYPES: GoalType[] = ["WEIGHT", "BODY_FAT", "MUSCLE"]

export function isAutoSynced(type: GoalType): boolean {
  return AUTO_SYNCED_GOAL_TYPES.includes(type)
}

/**
 * Progress 0–100 (rounded, clamped), direction-aware:
 * - gaining (target > start): progress as current climbs toward target
 * - losing (target < start): progress as current drops toward target
 * Returns null when there is nothing to compare yet.
 */
export function goalProgress(
  start: number | null,
  current: number | null,
  target: number
): number | null {
  if (start === null || start === undefined) return null
  if (current === null || current === undefined) return null
  if (!Number.isFinite(start) || !Number.isFinite(current) || !Number.isFinite(target)) return null
  const span = target - start
  if (span === 0) return current === target ? 100 : 0
  const pct = ((current - start) / span) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

/** Days from now until the deadline (negative = overdue, null = none). */
export function daysUntilDeadline(deadline: Date | string | null, nowMs: number = Date.now()): number | null {
  if (!deadline) return null
  return Math.ceil((new Date(deadline).getTime() - nowMs) / (24 * 60 * 60 * 1000))
}
