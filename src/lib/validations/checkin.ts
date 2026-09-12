import { z } from "zod"

export const checkInSchema = z.object({
  energyLevel: z.coerce.number().int().min(1).max(5),
  sleepHours: z.coerce.number().min(0).max(24),
  moodLevel: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(500).optional().default(""),
})

export type CheckInInput = z.infer<typeof checkInSchema>
