/**
 * Client-goal helpers (pure — safe to unit test).
 *
 * WEIGHT / BODY_FAT / MUSCLE goals auto-resolve their current value from the
 * latest InBody entry (see goal.service.ts). All other types track the
 * coach-entered `currentValue`.
 */

import type { GoalType } from "@/lib/db/enums"

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
