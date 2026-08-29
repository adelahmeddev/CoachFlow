import { z } from "zod"
import {
  ClientStatus,
  Goal,
  PaymentStatus,
  SubscriptionStatus,
} from "@/lib/db/enums"
import { interpolate } from "@/lib/i18n/format"
import type { Dictionary } from "@/lib/i18n/messages/en"

export function buildResetClientPasswordSchema(t: Dictionary) {
  return z.object({
    clientId: z.string().min(1),
    newPassword: z
      .string()
      .min(6, interpolate(t.validation.minLength, { min: 6 })),
    forceChange: z.boolean().default(true),
  })
}

export type ResetClientPasswordInput = z.infer<
  ReturnType<typeof buildResetClientPasswordSchema>
>

export function buildCreateTrainerSchema(t: Dictionary) {
  return z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, interpolate(t.validation.minLength, { min: 2 }))
        .max(100, interpolate(t.validation.maxLength, { max: 100 })),
      phone: z
        .string()
        .trim()
        .regex(/^\d{11}$/, t.validation.invalidPhone),
      password: z
        .string()
        .min(8, interpolate(t.validation.minLength, { min: 8 }))
        .max(72, interpolate(t.validation.maxLength, { max: 72 })),
      confirmPassword: z.string().min(1, t.validation.required),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.admin.createTrainer.errors.passwordMismatch,
      path: ["confirmPassword"],
    })
}

export function translateTrainerFieldError(
  t: Dictionary,
  message: string
): string {
  switch (message) {
    case "FULL_NAME_MIN":
      return interpolate(t.validation.minLength, { min: 2 })
    case "FULL_NAME_MAX":
      return interpolate(t.validation.maxLength, { max: 100 })
    case "PHONE_INVALID":
      return t.validation.invalidPhone
    case "PASSWORD_MIN":
      return interpolate(t.validation.minLength, { min: 8 })
    case "PASSWORD_MAX":
      return interpolate(t.validation.maxLength, { max: 72 })
    case "PASSWORD_MISMATCH":
      return t.admin.createTrainer.errors.passwordMismatch
    default:
      return t.validation.invalidValue
  }
}

export const createTrainerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "FULL_NAME_MIN")
      .max(100, "FULL_NAME_MAX"),
    phone: z
      .string()
      .trim()
      .regex(/^\d{11}$/, "PHONE_INVALID"),
    password: z
      .string()
      .min(8, "PASSWORD_MIN")
      .max(72, "PASSWORD_MAX"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "PASSWORD_MISMATCH",
    path: ["confirmPassword"],
  })

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>

export const adminTrainersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
})

export type AdminTrainersQuery = z.infer<typeof adminTrainersQuerySchema>

export const adminClientsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  trainerId: z.string().trim().max(64).optional(),
  goal: z.nativeEnum(Goal).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
})

export type AdminClientsQuery = z.infer<typeof adminClientsQuerySchema>

export const adminSubscriptionsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
})

export type AdminSubscriptionsQuery = z.infer<typeof adminSubscriptionsQuerySchema>