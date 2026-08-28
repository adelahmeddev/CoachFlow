"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import { prisma } from "@/lib/prisma"

export async function resetClientPasswordAction(
  clientId: string,
  newPassword: string,
  forceChange: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "TRAINER")
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      userId: true,
      trainerId: true,
    },
  })

  if (!client) {
    return { ok: false, error: "CLIENT_NOT_FOUND" }
  }

  if (
    session.user.role === "TRAINER" &&
    client.trainerId !== session.user.trainerProfileId
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  if (!client.userId) {
    return { ok: false, error: "CLIENT_NO_ACCOUNT" }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: client.userId },
    data: { passwordHash, mustChangePassword: forceChange },
  })

  revalidatePath(`/clients/${clientId}`)
  invalidate([`client:${clientId}:profile`])
  return { ok: true }
}
