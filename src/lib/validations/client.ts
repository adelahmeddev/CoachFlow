import { z } from "zod"
import { ClientStatus, Goal, CoachingMode, WorkoutDisplayMode } from "@/lib/db/enums"

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, "Enter a valid 11-digit phone number")

export const clientCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  phone: z
    .union([phoneSchema, z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  birthDate: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((v) => (v ? new Date(`${v}T00:00:00Z`) : null)),
  goals: z.array(z.nativeEnum(Goal)).optional().default([]),
  status: z.enum(["INVITED", "PENDING_ASSESSMENT", "ACTIVE", "PAUSED"]),
  coachingMode: z.nativeEnum(CoachingMode).optional(),
  workoutDisplayMode: z.nativeEnum(WorkoutDisplayMode).optional(),
  injuries: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
  healthConditions: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
  medications: z.string().trim().max(1000, "Cannot exceed 1000 characters").optional().nullable(),
})

export type ClientCreateInput = z.infer<typeof clientCreateSchema>

export const clientsListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  goal: z.nativeEnum(Goal).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  addedWithin: z.coerce.number().int().positive().max(365).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
})

export type ClientsListQuery = z.infer<typeof clientsListQuerySchema>

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined || (typeof val === "number" && Number.isNaN(val)) ? null : Number(val)),
  z.number().nullable().optional()
)

export const createClientManuallySchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  password: z.string().min(6, "Password must be at least 6 characters"),
  birthDate: z.string().optional().nullable(),
  goals: z.array(z.nativeEnum(Goal)).optional().default([]),
  coachingMode: z.nativeEnum(CoachingMode).optional().default(CoachingMode.ONLINE),

  // Subscription assignment (optional)
  subscriptionPlanId: z.string().optional().nullable(),
  subscriptionPlanType: z.enum(["PERIOD", "SESSIONS"]).optional().nullable(),
  subscriptionDurationDays: optionalNumber,
  subscriptionSessionsCount: optionalNumber,
  subscriptionStartDate: z.string().optional().nullable(),
  
  // InBody metrics (all optional, safe against NaN and empty strings)
  inbodyDate: z.string().optional().nullable(),
  weightKg: optionalNumber,
  heightCm: optionalNumber,
  muscleMassKg: optionalNumber,
  bodyFatKg: optionalNumber,
  bodyWaterPct: optionalNumber,
  fatControlKg: optionalNumber,
  bmrKcal: optionalNumber,
  fitnessScore: optionalNumber,
  waistHipRatio: optionalNumber,
  visceralFatLevel: optionalNumber,

  // Health and Medical history
  injuries: z.string().optional().nullable(),
  healthConditions: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  neckPain: z.boolean().optional(),
  shoulderPain: z.boolean().optional(),
  backPain: z.boolean().optional(),
  kneePain: z.boolean().optional(),
})

export type CreateClientManuallyInput = z.infer<typeof createClientManuallySchema>

