import { z } from "zod"
import { ClientStatus, Goal } from "@/lib/db/enums"

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
  goal: z.nativeEnum(Goal).nullable().optional(),
  status: z.enum(["INVITED", "PENDING_ASSESSMENT", "ACTIVE", "PAUSED"]),
})

export type ClientCreateInput = z.infer<typeof clientCreateSchema>

export const clientsListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  goal: z.nativeEnum(Goal).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
})

export type ClientsListQuery = z.infer<typeof clientsListQuerySchema>
