export interface SessionExerciseTarget {
  id: string
  name: string
  targetSets: number | null
  targetReps: number | null
  targetWeightKg: number | null
}

export interface ExerciseSetData {
  weightKg: number | null
  reps: number | null
}

export function parseSetData(value: unknown): ExerciseSetData[] | null {
  if (!Array.isArray(value)) return null
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      weightKg: typeof item.weightKg === "number" ? item.weightKg : null,
      reps: typeof item.reps === "number" ? item.reps : null,
    }))
}

export interface SessionExerciseLog {
  id: string
  date: Date
  actualSets: number | null
  actualReps: number | null
  actualWeightKg: number | null
  rpe: number | null
  target: SessionExerciseTarget
}

export interface SessionGroup {
  dateKey: string
  date: Date
  logs: SessionExerciseLog[]
  adherencePct: number | null
}

export function groupSessionsByDate(
  logs: SessionExerciseLog[]
): SessionGroup[] {
  const grouped = new Map<string, SessionExerciseLog[]>()
  for (const log of logs) {
    const key = log.date.toISOString().slice(0, 10)
    const list = grouped.get(key) ?? []
    list.push(log)
    grouped.set(key, list)
  }

  const sessions: SessionGroup[] = []
  for (const [dateKey, list] of grouped.entries()) {
    let completed = 0
    let target = 0
    for (const log of list) {
      if (log.actualSets != null && log.target.targetSets != null) {
        completed += log.actualSets
        target += log.target.targetSets
      }
    }
    sessions.push({
      dateKey,
      date: list[0].date,
      logs: list,
      adherencePct: target > 0 ? Math.round((completed / target) * 100) : null,
    })
  }

  return sessions.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export type ProgressionAdvice =
  | { type: "increase"; labelKey: "increaseLoad" }
  | { type: "deload"; labelKey: "deload" }
  | { type: "none" }

export function getProgressionAdvice(
  logs: SessionExerciseLog[]
): ProgressionAdvice {
  const sorted = [...logs].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )
  const lastTwo = sorted.slice(0, 2)
  if (lastTwo.length < 2) return { type: "none" }

  const allAchieved = lastTwo.every(
    (log) =>
      log.target.targetSets == null ||
      (log.actualSets != null && log.actualSets >= log.target.targetSets)
  )
  const anyHardRpe = lastTwo.some((log) => log.rpe != null && log.rpe >= 9)
  const missedRepsTwice =
    lastTwo.filter(
      (log) =>
        log.target.targetReps != null &&
        log.actualReps != null &&
        log.actualReps < log.target.targetReps
    ).length >= 2

  if (anyHardRpe || missedRepsTwice) return { type: "deload", labelKey: "deload" }
  if (allAchieved && lastTwo.every((log) => log.rpe == null || log.rpe <= 7)) {
    return { type: "increase", labelKey: "increaseLoad" }
  }
  return { type: "none" }
}

export function didAchieveTargets(log: SessionExerciseLog): boolean {
  if (log.target.targetSets != null && log.actualSets != null) {
    if (log.actualSets < log.target.targetSets) return false
  }
  if (log.target.targetReps != null && log.actualReps != null) {
    if (log.actualReps < log.target.targetReps) return false
  }
  return true
}
