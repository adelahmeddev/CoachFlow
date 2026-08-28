"use server"

import bcrypt from "bcryptjs"
import { registerTrainer } from "@/server/services/auth.service"
import { getCurrentSession } from "@/server/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@/generated/prisma/enums"

export async function registerAction(input: {
  fullName: string
  phone: string
  password: string
  confirmPassword: string
}) {
  return registerTrainer(input)
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TRAINER")
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { ok: false, error: "User not found" }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  return { ok: true }
}
