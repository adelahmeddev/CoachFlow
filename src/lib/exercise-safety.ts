export const SAFETY_TAGS = {
  neckLoad: "neck_load",
  kneeLoad: "knee_load",
  backLoad: "back_load",
  shoulderLoad: "shoulder_load",
  beginnerFriendly: "beginner_friendly",
} as const

export interface PainFlags {
  neckPain: boolean
  kneePain: boolean
  backPain: boolean
  shoulderPain: boolean
}

export interface ExerciseOption {
  id: string
  name: string
  nameAr: string | null
  muscleGroup: string
  equipment: string | null
  tags: string[]
  defaultSets: number | null
  defaultReps: number | null
  defaultRestSeconds: number | null
  youtubeUrl: string | null
}

export interface ExerciseConflict {
  dayIndex: number
  exerciseIndex: number
  exerciseId: string
  exerciseName: string
  reason: "neckPain" | "kneePain" | "backPain" | "shoulderPain"
}

const PAIN_TO_TAG: { pain: keyof PainFlags; tag: string }[] = [
  { pain: "neckPain", tag: SAFETY_TAGS.neckLoad },
  { pain: "kneePain", tag: SAFETY_TAGS.kneeLoad },
  { pain: "backPain", tag: SAFETY_TAGS.backLoad },
  { pain: "shoulderPain", tag: SAFETY_TAGS.shoulderLoad },
]

export function findConflicts(
  days: {
    exercises: { exerciseId?: string | null; exerciseName: string }[]
  }[],
  library: Map<string, ExerciseOption>,
  pain: PainFlags
): ExerciseConflict[] {
  const conflicts: ExerciseConflict[] = []
  days.forEach((day, dayIndex) => {
    day.exercises.forEach((exercise, exerciseIndex) => {
      if (!exercise.exerciseId) return
      const option = library.get(exercise.exerciseId)
      if (!option) return
      for (const { pain: painKey, tag } of PAIN_TO_TAG) {
        if (pain[painKey] && option.tags.includes(tag)) {
          conflicts.push({
            dayIndex,
            exerciseIndex,
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            reason: painKey,
          })
        }
      }
    })
  })
  return conflicts
}

export function suggestAlternative(
  exerciseId: string,
  library: Map<string, ExerciseOption>,
  pain: PainFlags
): ExerciseOption | null {
  const current = library.get(exerciseId)
  if (!current) return null

  const conflictTags = PAIN_TO_TAG.filter(({ pain: painKey }) => pain[painKey]).map(
    ({ tag }) => tag
  )

  const candidates: ExerciseOption[] = []
  for (const option of library.values()) {
    if (option.id === exerciseId) continue
    if (option.muscleGroup !== current.muscleGroup) continue
    if (option.tags.some((tag) => conflictTags.includes(tag))) continue
    candidates.push(option)
  }

  const beginnerFriendly = candidates.find((option) =>
    option.tags.includes(SAFETY_TAGS.beginnerFriendly)
  )
  return beginnerFriendly ?? candidates[0] ?? null
}
