import { z } from "zod"

const sessionLogEntrySchema = z.object({
  splitDayExerciseId: z.string().min(1),
  actualSets: z
    .union([z.number().int().min(1).max(50), z.literal(""), z.null()])
    .optional(),
  actualReps: z
    .union([z.number().int().min(1).max(200), z.literal(""), z.null()])
    .optional(),
  actualWeightKg: z
    .union([z.number().min(0).max(2000), z.literal(""), z.null()])
    .optional(),
  rpe: z
    .union([
      z.number().int().min(1).max(10),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  notes: z
    .union([z.string().trim().max(500), z.literal(""), z.literal(null)])
    .optional(),
})

export const sessionLogSchema = z.object({
  splitDayId: z.string().min(1, "Training day is required"),
  date: z.string().min(1, "Date is required"),
  entries: z.array(sessionLogEntrySchema).min(1).max(50),
})

export type SessionLogEntryInput = z.infer<typeof sessionLogEntrySchema>
export type SessionLogInput = z.infer<typeof sessionLogSchema>
