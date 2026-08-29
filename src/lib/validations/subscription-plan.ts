import { z } from "zod"
import { PlanType } from "@/lib/db/enums"

export const subscriptionPlanSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "PLAN_NAME_MIN")
      .max(120, "PLAN_NAME_MAX"),
    planType: z.nativeEnum(PlanType, {
      message: "PLAN_TYPE_INVALID",
    }),
    sessionsCount: z
      .union([z.number().int().positive(), z.literal("")])
      .optional(),
    durationDays: z
      .union([z.number().int().positive().max(3650), z.literal("")])
      .optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.planType === PlanType.SESSIONS) {
      if (
        data.sessionsCount === "" ||
        data.sessionsCount === undefined ||
        Number(data.sessionsCount) < 1
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["sessionsCount"],
          message: "SESSIONS_REQUIRED",
        })
      }
      return
    }

    if (
      data.durationDays === "" ||
      data.durationDays === undefined ||
      Number(data.durationDays) < 1
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["durationDays"],
        message: "DURATION_REQUIRED",
      })
    }
  })

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>

export function translateSubscriptionPlanFieldError(
  message: string,
  t: {
    planNameMin: string
    planNameMax: string
    invalidValue: string
    sessionsRequired: string
    durationRequired: string
  }
): string {
  switch (message) {
    case "PLAN_NAME_MIN":
      return t.planNameMin
    case "PLAN_NAME_MAX":
      return t.planNameMax
    case "SESSIONS_REQUIRED":
      return t.sessionsRequired
    case "DURATION_REQUIRED":
      return t.durationRequired
    default:
      return t.invalidValue
  }
}
