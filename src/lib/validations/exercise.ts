import { z } from "zod"

export const MAX_EXERCISES_PER_DAY = 20

function nullableNumber(min: number, max: number, message: string) {
  return z
    .union([
      z
        .string()
        .trim()
        .refine(
          (value) =>
            value === "" ||
            (Number(value) >= min && Number(value) <= max),
          message
        ),
      z.number().min(min).max(max),
      z.literal(""),
      z.literal(null),
      z.undefined(),
    ])
    .optional()
}

export const splitDayExerciseSchema = z.object({
  exerciseId: z.union([z.string(), z.literal(null)]).optional(),
  exerciseName: z
    .string()
    .trim()
    .min(1, "Exercise name is required")
    .max(200),
  targetSets: nullableNumber(1, 50, "Sets must be between 1 and 50"),
  targetReps: nullableNumber(1, 200, "Reps must be between 1 and 200"),
  targetWeightKg: nullableNumber(
    0,
    2000,
    "Weight must be between 0 and 2000"
  ),
  restSeconds: nullableNumber(0, 1800, "Rest must be between 0 and 1800"),
  notes: z
    .union([z.string().trim().max(500), z.literal(""), z.literal(null)])
    .optional(),
  videoUrl: z
    .union([z.string().trim().max(500), z.literal(""), z.literal(null)])
    .optional(),
})

export type SplitDayExerciseInput = z.infer<typeof splitDayExerciseSchema>

export function toNumberOrNull(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export function toIntOrNull(
  value: string | number | null | undefined
): number | null {
  const num = toNumberOrNull(value)
  if (num === null) return null
  return Number.isInteger(num) ? num : null
}
