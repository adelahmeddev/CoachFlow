import { z } from "zod"

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username, phone or email is required"),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z
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

export type RegisterInput = z.infer<typeof registerSchema>
