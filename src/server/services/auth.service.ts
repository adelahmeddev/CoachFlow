import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string }

export async function registerTrainer(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, phone, password } = parsed.data

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { username: phone }],
    },
  })
  if (existing) {
    return {
      ok: false,
      formError: "An account with this phone number already exists",
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username: phone,
      phone,
      passwordHash,
      role: "TRAINER",
      trainerProfile: {
        create: {
          fullName,
          phone,
        },
      },
    },
  })

  return { ok: true, userId: user.id }
}
