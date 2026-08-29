import { z } from "zod"
import { MealKind, QuantityUnit, SubstituteCategory } from "@/lib/db/enums"

function coerceNumber(v: unknown): unknown {
  if (v === null || v === undefined || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const n = Number(String(v).trim())
  return Number.isNaN(n) ? null : n
}

function coerceInt(v: unknown): unknown {
  const n = coerceNumber(v)
  return n === null ? null : Math.trunc(n as number)
}

function coerceGroupNumber(v: unknown): unknown {
  const n = coerceInt(v)
  if (n === null) return 1
  return Math.min(20, Math.max(1, n as number))
}

const optionalNumber = z.preprocess(coerceNumber, z.number().nullable())

const optionalInt = z.preprocess(coerceInt, z.number().int().nullable())

export const supplementDefSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().max(120).nullable().optional(),
  definition: z.string().trim().max(1000).nullable().optional(),
  definitionAr: z.string().trim().max(1000).nullable().optional(),
  importance: z.string().trim().max(500).nullable().optional(),
  importanceAr: z.string().trim().max(500).nullable().optional(),
})

export const substituteItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  nameAr: z.string().trim().max(160).nullable().optional(),
  amount: optionalNumber,
  unit: z.nativeEnum(QuantityUnit),
})

export const substituteGroupSchema = z.object({
  category: z.nativeEnum(SubstituteCategory),
  caloriesLabel: z.string().trim().max(60).nullable().optional(),
  items: z.array(substituteItemSchema).max(40),
})

export const mealItemSchema = z.object({
  foodName: z.string().trim().min(1).max(200),
  foodNameAr: z.string().trim().max(200).nullable().optional(),
  amount: optionalNumber,
  unit: z.nativeEnum(QuantityUnit),
  calories: optionalInt,
  groupNumber: z.preprocess(coerceGroupNumber, z.number().int().min(1).max(20)),
})

export const mealSchema = z.object({
  kind: z.nativeEnum(MealKind),
  name: z.string().trim().min(1).max(120),
  nameAr: z.string().trim().max(120).nullable().optional(),
  items: z.array(mealItemSchema).max(30),
})

const stringArray = z.array(z.string().trim().min(1).max(300)).max(30)

export const nutritionContentSchema = z.object({
  name: z.string().trim().min(1).max(160),
  isGlobal: z.boolean().optional(),
  calories: optionalInt,
  proteinGrams: optionalNumber,
  carbsGrams: optionalNumber,
  fatsGrams: optionalNumber,
  waterLiters: optionalNumber,
  coachMessage: z.string().trim().max(4000).nullable().optional(),
  guidelines: stringArray.optional().default([]),
  avoidFoods: stringArray.optional().default([]),
  recommendedFoods: stringArray.optional().default([]),
  supplementDefs: z.array(supplementDefSchema).max(20),
  substituteGroups: z.array(substituteGroupSchema).max(8),
  meals: z.array(mealSchema).max(15),
})

export type NutritionContentInput = z.infer<typeof nutritionContentSchema>
export type SupplementDefInput = z.infer<typeof supplementDefSchema>
export type SubstituteGroupInput = z.infer<typeof substituteGroupSchema>
export type SubstituteItemInput = z.infer<typeof substituteItemSchema>
export type MealInput = z.infer<typeof mealSchema>
export type MealItemInput = z.infer<typeof mealItemSchema>

export const assignTemplateSchema = z.object({
  clientIds: z.array(z.string().cuid()).min(1).max(200),
})
