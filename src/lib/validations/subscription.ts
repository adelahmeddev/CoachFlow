import { z } from "zod"
import { PaymentStatus, PlanType, SubscriptionStatus } from "@/generated/prisma/enums"
import { interpolate } from "@/lib/i18n/format"
import type { Dictionary } from "@/lib/i18n/messages/en"

const optionalPositiveIntOrEmpty = z
  .union([z.number().int().positive(), z.literal("")])
  .optional()

const optionalNonNegativeIntOrEmpty = z
  .union([z.number().int().nonnegative(), z.literal("")])
  .optional()

const optionalDateString = z
  .union([z.string(), z.literal("")])
  .optional()

function refineByPlanType(
  data: {
    planType: PlanType
    startDate?: string | ""
    endDate?: string | ""
    durationDays?: number | "" | undefined
    sessionsCount?: number | "" | undefined
    remainingSessions?: number | "" | undefined
  },
  messages: {
    sessionsRequired: string
    durationRequired: string
    startDateRequired: string
    endBeforeStart: string
    remainingExceeds: string
  },
  onError: (path: string, message: string) => void
) {
  if (data.planType === PlanType.SESSIONS) {
    if (
      data.sessionsCount === "" ||
      data.sessionsCount === undefined ||
      Number(data.sessionsCount) < 1
    ) {
      onError("sessionsCount", messages.sessionsRequired)
      return
    }
    if (
      data.remainingSessions !== "" &&
      data.remainingSessions !== undefined &&
      data.remainingSessions > data.sessionsCount
    ) {
      onError("remainingSessions", messages.remainingExceeds)
    }
    return
  }

  if (!data.startDate) {
    onError("startDate", messages.startDateRequired)
  }
  if (data.durationDays === "" || data.durationDays === undefined) {
    onError("durationDays", messages.durationRequired)
  }
  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    onError("endDate", messages.endBeforeStart)
  }
}

export function buildSubscriptionSchema(t: Dictionary) {
  return z
    .object({
      planType: z.nativeEnum(PlanType, {
        message: t.validation.invalidValue,
      }),
      planName: z
        .union([
          z.literal(""),
          z
            .string()
            .trim()
            .min(2, t.subscription.errors.planNameMin)
            .max(120, interpolate(t.validation.maxLength, { max: 120 })),
        ])
        .optional(),
      status: z.nativeEnum(SubscriptionStatus, {
        message: t.validation.invalidValue,
      }),
      paymentStatus: z.nativeEnum(PaymentStatus, {
        message: t.validation.invalidValue,
      }),
      startDate: optionalDateString,
      endDate: optionalDateString,
      durationDays: optionalPositiveIntOrEmpty,
      sessionsCount: optionalPositiveIntOrEmpty,
      remainingSessions: optionalNonNegativeIntOrEmpty,
      autoRenew: z.boolean(),
      notes: z.string().trim().max(2000).optional(),
    })
    .superRefine((data, ctx) => {
      refineByPlanType(
        data,
        {
          sessionsRequired: t.subscription.errors.sessionsRequired,
          durationRequired: t.subscription.errors.durationRequired,
          startDateRequired: t.subscription.errors.startDateRequired,
          endBeforeStart: t.subscription.errors.endBeforeStart,
          remainingExceeds: t.subscription.errors.sessionsExceedTotal,
        },
        (path, message) => ctx.addIssue({ code: "custom", path: [path], message })
      )
    })
}

export type SubscriptionInput = z.infer<ReturnType<typeof buildSubscriptionSchema>>

export const subscriptionSchema = z
  .object({
    planType: z.nativeEnum(PlanType, {
      message: "PLAN_TYPE_INVALID",
    }),
    planName: z
      .union([
        z.literal(""),
        z.string().trim().min(2, "PLAN_NAME_MIN").max(120, "PLAN_NAME_MAX"),
      ])
      .optional(),
    status: z.nativeEnum(SubscriptionStatus, {
      message: "STATUS_INVALID",
    }),
    paymentStatus: z.nativeEnum(PaymentStatus, {
      message: "PAYMENT_INVALID",
    }),
    startDate: optionalDateString,
    endDate: optionalDateString,
    durationDays: optionalPositiveIntOrEmpty,
    sessionsCount: optionalPositiveIntOrEmpty,
    remainingSessions: optionalNonNegativeIntOrEmpty,
    autoRenew: z.boolean(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    refineByPlanType(
      data,
      {
        sessionsRequired: "SESSIONS_REQUIRED",
        durationRequired: "DURATION_REQUIRED",
        startDateRequired: "START_DATE_REQUIRED",
        endBeforeStart: "END_BEFORE_START",
        remainingExceeds: "REMAINING_EXCEEDS",
      },
      (path, message) => ctx.addIssue({ code: "custom", path: [path], message })
    )
  })

export function translateSubscriptionFieldError(
  t: Dictionary,
  message: string
): string {
  switch (message) {
    case "PLAN_NAME_MIN":
      return t.subscription.errors.planNameMin
    case "PLAN_NAME_MAX":
      return interpolate(t.validation.maxLength, { max: 120 })
    case "END_BEFORE_START":
      return t.subscription.errors.endBeforeStart
    case "REMAINING_EXCEEDS":
      return t.subscription.errors.sessionsExceedTotal
    case "SESSIONS_REQUIRED":
      return t.subscription.errors.sessionsRequired
    case "DURATION_REQUIRED":
      return t.subscription.errors.durationRequired
    case "START_DATE_REQUIRED":
      return t.subscription.errors.startDateRequired
    case "STATUS_INVALID":
    case "PAYMENT_INVALID":
    case "PLAN_TYPE_INVALID":
      return t.validation.invalidValue
    default:
      return t.validation.invalidValue
  }
}

export const renewSubscriptionSchema = z.object({
  newEndDate: optionalDateString,
  resetSessions: z.boolean(),
  paymentStatus: z.nativeEnum(PaymentStatus, {
    message: "PAYMENT_INVALID",
  }),
})

export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>
