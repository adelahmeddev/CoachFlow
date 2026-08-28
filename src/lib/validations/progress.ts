import { z } from "zod"

const optionalPositiveInt = z
  .union([z.number().int().positive(), z.literal("")])
  .optional()

const optionalPositiveNumber = z.union([z.number().positive(), z.literal("")]).optional()

export const progressReviewSchema = z.object({
  reviewDate: z.string().min(1, "Review date is required"),
  adherencePct: z.union([
    z.number().min(0, "Adherence must be at least 0").max(100, "Adherence cannot exceed 100"),
    z.literal(""),
  ]),
  energyLevel: z
    .union([
      z.number().int("Energy level must be a whole number").min(1, "Energy level must be at least 1").max(10, "Energy level cannot exceed 10"),
      z.literal(""),
    ])
    .optional(),
  trainerNotes: z.string().trim().max(2000).optional(),
})

export type ProgressReviewInput = z.infer<typeof progressReviewSchema>

export const workoutLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  exerciseName: z.string().trim().min(2, "Exercise name must be at least 2 characters").max(120),
  sets: optionalPositiveInt,
  reps: optionalPositiveInt,
  weightKg: optionalPositiveNumber,
  rpe: z
    .union([z.number().int("RPE must be a whole number").min(1, "RPE must be at least 1").max(10, "RPE cannot exceed 10"), z.literal("")])
    .optional(),
  notes: z.string().trim().max(500).optional(),
})

export type WorkoutLogInput = z.infer<typeof workoutLogSchema>