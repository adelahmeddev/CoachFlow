import { z } from "zod"
import { Units, WeekStartDay } from "@/generated/prisma/enums"
import { LOCALES, type Locale } from "@/lib/i18n/config"
import { interpolate } from "@/lib/i18n/format"
import type { Dictionary } from "@/lib/i18n/messages/en"

const fullName = (t: Dictionary) =>
  z
    .string()
    .trim()
    .min(2, t.settings.profile.errors.fullNameMin)
    .max(100, t.settings.profile.errors.fullNameMax)

const phone = (t: Dictionary) =>
  z
    .string()
    .trim()
    .min(7, t.settings.profile.errors.phoneInvalid)
    .max(20, t.settings.profile.errors.phoneInvalid)
    .regex(/^[+\d][\d\s\-()]*$/, t.settings.profile.errors.phoneInvalid)

export function buildProfileSchema(t: Dictionary) {
  return z.object({
    fullName: fullName(t),
    phone: phone(t),
  })
}

export type ProfileInput = z.infer<ReturnType<typeof buildProfileSchema>>

export function buildSecuritySchema(t: Dictionary) {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t.settings.security.errors.currentRequired),
      newPassword: z
        .string()
        .min(8, interpolate(t.validation.minLength, { min: 8 }))
        .max(72, interpolate(t.validation.maxLength, { max: 72 })),
      confirmPassword: z.string().min(1, t.validation.required),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t.validation.passwordMismatch,
      path: ["confirmPassword"],
    })
}

export type SecurityInput = z.infer<ReturnType<typeof buildSecuritySchema>>

export const timezoneValues = [
  "UTC",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Johannesburg",
  "America/Chicago",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Baghdad",
  "Asia/Beirut",
  "Asia/Dubai",
  "Asia/Jakarta",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Riyadh",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
] as const

const timezone = z.string().trim().max(100).optional().nullable()

export function buildPreferencesSchema(t: Dictionary) {
  return z.object({
    language: z.enum(LOCALES, { message: t.validation.invalidValue }),
    units: z.nativeEnum(Units, { message: t.validation.invalidValue }),
    weekStartDay: z.nativeEnum(WeekStartDay, {
      message: t.validation.invalidValue,
    }),
    timezone: timezone,
  })
}

export type PreferencesInput = z.infer<ReturnType<typeof buildPreferencesSchema>>

export function buildNotificationsSchema() {
  return z.object({
    notifyReassessment: z.boolean().optional(),
    notifyInactivity: z.boolean(),
    notifySubscription: z.boolean(),
    weeklySummary: z.boolean(),
  })
}

export type NotificationsInput = z.infer<
  ReturnType<typeof buildNotificationsSchema>
>

export function buildBusinessSchema(t: Dictionary) {
  return z.object({
    businessName: z
      .string()
      .trim()
      .max(100, t.settings.business.errors.businessNameMax),
  })
}

export type BusinessInput = z.infer<ReturnType<typeof buildBusinessSchema>>

export function translateSettingsFieldError(
  t: Dictionary,
  message: string
): string {
  switch (message) {
    case "FULL_NAME_MIN":
      return t.settings.profile.errors.fullNameMin
    case "FULL_NAME_MAX":
      return t.settings.profile.errors.fullNameMax
    case "PHONE_INVALID":
      return t.settings.profile.errors.phoneInvalid
    case "CURRENT_REQUIRED":
      return t.settings.security.errors.currentRequired
    case "PASSWORD_MIN":
      return interpolate(t.validation.minLength, { min: 8 })
    case "PASSWORD_MAX":
      return interpolate(t.validation.maxLength, { max: 72 })
    case "PASSWORD_MISMATCH":
      return t.validation.passwordMismatch
    case "BUSINESS_NAME_MAX":
      return t.settings.business.errors.businessNameMax
    default:
      return t.validation.invalidValue
  }
}

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "FULL_NAME_MIN")
    .max(100, "FULL_NAME_MAX"),
  phone: z
    .string()
    .trim()
    .min(7, "PHONE_INVALID")
    .max(20, "PHONE_INVALID")
    .regex(/^[+\d][\d\s\-()]*$/, "PHONE_INVALID"),
})

export const securitySchema = z
  .object({
    currentPassword: z.string().min(1, "CURRENT_REQUIRED"),
    newPassword: z.string().min(8, "PASSWORD_MIN").max(72, "PASSWORD_MAX"),
    confirmPassword: z.string().min(1, "CURRENT_REQUIRED"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "PASSWORD_MISMATCH",
    path: ["confirmPassword"],
  })

export const preferencesSchema = z.object({
  language: z.enum(LOCALES, { message: "LANG_INVALID" }),
  units: z.nativeEnum(Units, { message: "UNITS_INVALID" }),
  weekStartDay: z.nativeEnum(WeekStartDay, { message: "WEEK_START_INVALID" }),
  timezone: timezone,
})

export const notificationsSchema = z.object({
  notifyReassessment: z.boolean().optional(),
  notifyInactivity: z.boolean(),
  notifySubscription: z.boolean(),
  weeklySummary: z.boolean(),
})

export const businessSchema = z.object({
  businessName: z.string().trim().max(100, "BUSINESS_NAME_MAX"),
})

export type SettingsLocales = Locale
