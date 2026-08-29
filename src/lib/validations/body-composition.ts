import { z } from "zod"
import { BodyCompositionSource } from "@/lib/db/enums"

const optionalFloat = z
  .union([z.number(), z.string().transform((v) => (v === "" ? "" : Number(v))), z.literal("")])
  .optional()
  .transform((v) => {
    if (v === "" || v === undefined) return null
    const num = typeof v === "string" ? Number(v) : v
    if (Number.isNaN(num)) return null
    return num
  })
  .refine((v) => v === null || (typeof v === "number" && !Number.isNaN(v) && v >= 0), {
    message: "Must be a positive number",
  })
  .optional()

const optionalInt = z
  .union([z.number().int(), z.string().transform((v) => (v === "" ? "" : Number(v))), z.literal("")])
  .optional()
  .transform((v) => {
    if (v === "" || v === undefined) return null
    const num = typeof v === "string" ? Number(v) : v
    if (Number.isNaN(num)) return null
    return Math.round(num)
  })
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0), {
    message: "Must be a positive integer",
  })
  .optional()

const optionalRatio = z
  .union([z.number(), z.string().transform((v) => (v === "" ? "" : Number(v))), z.literal("")])
  .optional()
  .transform((v) => {
    if (v === "" || v === undefined) return null
    const num = typeof v === "string" ? Number(v) : v
    if (Number.isNaN(num)) return null
    return num
  })
  .refine((v) => v === null || (typeof v === "number" && v >= 0 && v <= 5), {
    message: "Must be between 0 and 5",
  })
  .optional()

export const bodyCompositionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  source: z.nativeEnum(BodyCompositionSource).optional().default(BodyCompositionSource.COACH),
  weightKg: z
    .union([z.number().positive(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .refine((v) => v === null || (typeof v === "number" && v > 0 && v < 500), {
      message: "Weight must be between 0 and 500 kg",
    })
    .optional()
    .nullable(),
  muscleMassKg: z
    .union([z.number().positive(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .refine((v) => v === null || (typeof v === "number" && v > 0 && v < 300), {
      message: "Must be positive",
    })
    .optional()
    .nullable(),
  bodyFatKg: z
    .union([z.number().positive(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .optional()
    .nullable(),
  bodyWaterPct: z
    .union([z.number().min(0).max(100), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .refine((v) => v === null || (typeof v === "number" && v >= 0 && v <= 100), {
      message: "Must be between 0 and 100",
    })
    .optional()
    .nullable(),
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
  bmrKcal: z
    .union([z.number().positive(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .optional()
    .nullable(),
  fitnessScore: z
    .union([z.number().int().min(0).max(100), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : Math.round(n)
    })
    .optional()
    .nullable(),
  waistHipRatio: z
    .union([z.number().positive(), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : n
    })
    .refine((v) => v === null || (typeof v === "number" && v > 0 && v < 5), {
      message: "Must be between 0 and 5",
    })
    .optional()
    .nullable(),
  visceralFatLevel: z
    .union([z.number().int().min(0).max(60), z.string().transform((v) => (v.trim() === "" ? "" : Number(v))), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined) return null
      const n = typeof v === "string" ? Number(v) : v
      return Number.isNaN(n) ? null : Math.round(n)
    })
    .optional()
    .nullable(),
  notes: z.string().trim().max(2000, "Notes must be at most 2000 characters").optional().nullable(),
})

export type BodyCompositionInput = z.infer<typeof bodyCompositionSchema>

export const bodyCompositionUpdateSchema = bodyCompositionSchema.partial().extend({
  date: z.string().min(1, "Date is required").optional(),
})

export type BodyCompositionUpdateInput = z.infer<typeof bodyCompositionUpdateSchema>

export function parseBodyCompositionDate(value: string): Date | null {
  if (!value) return null
  const d = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}
