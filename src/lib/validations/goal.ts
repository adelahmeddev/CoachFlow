import { z } from "zod"
import { GoalStatus, GoalType } from "@/lib/db/enums"

const optionalNumber = z.coerce.number().finite().min(0).max(10_000).optional().nullable()

export const goalSchema = z.object({
  type: z.nativeEnum(GoalType),
  title: z.string().trim().min(2).max(100),
  startValue: optionalNumber,
  currentValue: optionalNumber,
  targetValue: z.coerce.number().finite().min(0).max(10_000),
  unit: z.string().trim().max(12).optional().nullable(),
  deadline: z
    .union([z.string().min(1), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null)),
})

export type GoalInput = z.infer<typeof goalSchema>

export const goalStatusSchema = z.object({
  status: z.nativeEnum(GoalStatus),
})

export type GoalStatusInput = z.infer<typeof goalStatusSchema>
