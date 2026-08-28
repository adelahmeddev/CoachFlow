import { z } from "zod"
import { Goal } from "@/generated/prisma/enums"

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
    .min(6, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[+\d][\d\s\-()]*$/, "Enter a valid phone number"),
  goal: z.nativeEnum(Goal, {
    message: "Select a goal",
  }),
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
      .min(6, "Enter a valid phone number")
      .max(20, "Enter a valid phone number")
      .regex(/^[+\d][\d\s\-()]*$/, "Enter a valid phone number"),
    goal: z.nativeEnum(Goal, {
      message: "Select a goal",
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string(),
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
