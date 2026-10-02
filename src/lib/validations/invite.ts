import { z } from "zod"
import { Goal } from "@/lib/db/enums"

const optionalMetricNumber = (max = 500, label = "Must be a positive number") =>
  z
    .union([z.number(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .refine((v) => v === null || (typeof v === "number" && !Number.isNaN(v) && v > 0 && v <= max), {
      message: label,
    })
    .optional()
    .nullable()

const optionalMetricInt = (max = 100, label = "Must be a positive integer") =>
  z
    .union([z.number().int(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : Math.round(n)
    })
    .refine((v) => v === null || (Number.isInteger(v) && v > 0 && v <= max), {
      message: label,
    })
    .optional()
    .nullable()

const optionalRatio = z
  .union([z.number(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
  .optional()
  .transform((v) => {
    if (v === "" || v === undefined) return null
    const n = typeof v === "string" ? Number(v) : v
    return Number.isNaN(n) ? null : n
  })
  .refine((v) => v === null || (typeof v === "number" && v >= 0 && v <= 5), {
    message: "Must be between 0 and 5",
  })
  .optional()
  .nullable()

export const clientInBodySchema = z
  .object({
    heightCm: optionalMetricNumber(300, "Height must be between 1 and 300 cm"),
    age: optionalMetricInt(150, "Age must be between 1 and 150"),
    weightKg: optionalMetricNumber(500, "Weight must be between 1 and 500 kg"),
    muscleMassKg: optionalMetricNumber(300, "Muscle mass must be between 1 and 300 kg"),
    bodyFatKg: optionalMetricNumber(300, "Body fat must be positive"),
    bodyWaterPct: optionalMetricNumber(100, "Body water must be between 0 and 100%"),
    fatControlKg: z
      .union([z.number(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
      .optional()
      .transform((v) => {
        if (v === "" || v === undefined) return null
        const n = typeof v === "string" ? Number(v) : v
        return Number.isNaN(n) ? null : n
      })
      .optional()
      .nullable(),
    bmrKcal: optionalMetricInt(10000, "BMR must be positive"),
    fitnessScore: optionalMetricInt(100, "Fitness score must be between 0 and 100"),
    waistHipRatio: optionalRatio,
    visceralFatLevel: optionalMetricInt(50, "Visceral fat level must be between 1 and 50"),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
  })
  .optional()
  .nullable()

export const inviteBasicInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  birthDate: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => {
      const date = new Date(value)
      return !Number.isNaN(date.getTime())
    }, "Enter a valid date")
    .refine((value) => {
      const date = new Date(value)
      return date < new Date()
    }, "Date of birth must be in the past"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "Enter a valid 11-digit phone number"),
  goals: z.array(z.nativeEnum(Goal)).min(1, "Select at least one goal"),
  injuries: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
  healthConditions: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
  medications: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
  inbody: clientInBodySchema,
})

const inviteAccountFields = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  confirmPassword: z.string(),
})

export const joinClientSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be at most 100 characters"),
    phone: z
      .string()
      .trim()
      .regex(/^\d{11}$/, "Enter a valid 11-digit phone number"),
    goals: z.array(z.nativeEnum(Goal)).min(1, "Select at least one goal"),
    injuries: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
    healthConditions: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
    medications: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
    inbody: clientInBodySchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const inviteAccountSchema = inviteAccountFields.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
)

export const inviteAccountSchemaWithBasic = inviteBasicInfoSchema.merge(
  inviteAccountFields.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
)

export type InviteBasicInfoInput = z.infer<typeof inviteBasicInfoSchema>
export type InviteAccountInput = z.infer<typeof inviteAccountSchema>
export type JoinClientInput = z.infer<typeof joinClientSchema>
export type ClientInBodyInput = z.infer<typeof clientInBodySchema>
