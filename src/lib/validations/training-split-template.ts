import { z } from "zod"
import {
  Goal,
  SplitType,
  TrainingDayFocus,
} from "@/generated/prisma/enums"
import {
  MAX_EXERCISES_PER_DAY,
  splitDayExerciseSchema,
} from "@/lib/validations/exercise"

const templateDaySchema = z
  .object({
    focus: z.nativeEnum(TrainingDayFocus),
    customFocus: z
      .union([z.string().trim().max(60), z.literal(""), z.literal(null)])
      .optional(),
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

export const trainingSplitTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Template name is required")
    .max(120),
  goal: z.nativeEnum(Goal).nullable().optional(),
  level: z
    .union([z.string().trim().max(60), z.literal(""), z.literal(null)])
    .optional(),
  splitType: z.nativeEnum(SplitType),
  daysPerWeek: z.number().int().min(1).max(7),
  description: z
    .union([
      z.string().trim().max(1000),
      z.literal(""),
      z.literal(null),
    ])
    .optional(),
  days: z.array(templateDaySchema).min(1).max(7),
})

export type TemplateDayInput = z.infer<typeof templateDaySchema>
export type TrainingSplitTemplateInput = z.infer<
  typeof trainingSplitTemplateSchema
>
