"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  createClientManually,
  deleteTrainerClient,
} from "@/server/services/client.service"

export async function createClientManuallyAction(input: {
  fullName: string
  phone?: string
  birthDate?: string
  goal?: string
  status: string
}) {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return { ok: false as const, error: "Unauthorized" }
  }

  const result = await createClientManually(
    session.user.trainerProfileId,
    input
  )

  if (!result.ok) {
    return result
  }

  revalidatePath("/clients")
  revalidatePath("/dashboard")
  invalidate([
    `trainer:${session.user.trainerProfileId}:clients`,
    `trainer:${session.user.trainerProfileId}:dashboard`,
  ])

  return { ok: true as const, clientId: result.clientId }
}

export async function deleteClientAction(clientId: string) {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "TRAINER" ||
    !session.user.trainerProfileId
  ) {
    return { ok: false as const, error: "Unauthorized" }
  }

  const deleted = await deleteTrainerClient(
    session.user.trainerProfileId,
    clientId
  )
  if (!deleted) {
    return { ok: false as const, error: "Client not found" }
  }

  revalidatePath("/clients")
  revalidatePath("/dashboard")
  revalidatePath(`/clients/${clientId}`)
  invalidate([
    `trainer:${session.user.trainerProfileId}:clients`,
    `trainer:${session.user.trainerProfileId}:dashboard`,
    `client:${clientId}:profile`,
  ])

  return { ok: true as const }
}
