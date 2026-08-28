import { z } from "zod"
import {
  PlanStatus,
  ScheduleMode,
  SplitType,
  TrainingDayFocus,
  Weekday,
} from "@/generated/prisma/enums"
import {
  MAX_TRAINING_DAYS,
  MIN_TRAINING_DAYS,
} from "@/lib/constants/training-split"
import {
  MAX_EXERCISES_PER_DAY,
  splitDayExerciseSchema,
} from "@/lib/validations/exercise"

const trainingSplitDaySchema = z
  .object({
    focus: z.nativeEnum(TrainingDayFocus),
    customFocus: z
      .union([z.string().trim().max(60), z.literal(""), z.literal(null)])
      .optional(),
    notes: z
      .union([z.string().trim().max(500), z.literal(""), z.literal(null)])
      .optional(),
    weekday: z.nativeEnum(Weekday).nullish(),
    exercises: z
      .array(splitDayExerciseSchema)
      .max(MAX_EXERCISES_PER_DAY)
      .default([]),
  })
  .superRefine((day, ctx) => {
    if (
      day.focus === TrainingDayFocus.CUSTOM &&
      !day.customFocus?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customFocus"],
        message: "Custom focus is required when focus is Custom",
      })
    }
  })

export const trainingSplitSchema = z
  .object({
    splitType: z.nativeEnum(SplitType),
    scheduleMode: z.nativeEnum(ScheduleMode).default(ScheduleMode.FIXED_WEEKDAYS),
    status: z.nativeEnum(PlanStatus),
    notes: z
      .union([z.string().trim().max(1000), z.literal(""), z.literal(null)])
      .optional(),
    days: z
      .array(trainingSplitDaySchema)
      .min(MIN_TRAINING_DAYS, "Add at least one training day")
      .max(MAX_TRAINING_DAYS, "Maximum of 7 training days"),
  })
  .superRefine((split, ctx) => {
    if (split.scheduleMode !== ScheduleMode.FIXED_WEEKDAYS) return

    const weekdays = split.days.map(
      (day) => day.weekday ?? null
    )

    const missingIndex = weekdays.findIndex((weekday) => weekday == null)
    if (missingIndex !== -1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["days", missingIndex, "weekday"],
        message: "Each training day needs a weekday",
      })
    }

    const seen = new Map<string, number>()
    weekdays.forEach((weekday, index) => {
      if (!weekday) return
      const firstIndex = seen.get(weekday)
      if (firstIndex != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["days", index, "weekday"],
          message: "Duplicate weekday in this split",
        })
        void firstIndex
        return
      }
      seen.set(weekday, index)
    })
  })

export type TrainingSplitDayInput = z.infer<typeof trainingSplitDaySchema>
export type TrainingSplitInput = z.infer<typeof trainingSplitSchema>
