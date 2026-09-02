"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  trainingSplitSchema,
  type TrainingSplitInput,
} from "@/lib/validations/training-split"
import {
  createTrainingSplit,
  updateTrainingSplit,
  updateTrainingSplitStatus,
} from "@/server/services/training-split.service"
import { PlanStatus } from "@/lib/db/enums"

export async function createTrainingSplitAction(
  clientId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session.user.trainerProfileId

  const parsed = trainingSplitSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const split = await createTrainingSplit(
    clientId,
    trainerProfileId,
    parsed.data as TrainingSplitInput
  )
  if (!split) {
    return { ok: false as const, error: "Client not found" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=training-split`)
  invalidate([
    `client:${clientId}:workout`,
    `client:${clientId}:profile`,
  ])
  return { ok: true as const, splitId: split.id }
}

export async function updateTrainingSplitAction(
  clientId: string,
  splitId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session.user.trainerProfileId

  const parsed = trainingSplitSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const split = await updateTrainingSplit(
    clientId,
    trainerProfileId,
    splitId,
    parsed.data as TrainingSplitInput
  )
  if (!split) {
    return { ok: false as const, error: "Training split not found" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=training-split`)
  invalidate([
    `client:${clientId}:workout`,
    `client:${clientId}:profile`,
  ])
  return { ok: true as const }
}

export async function updateTrainingSplitStatusAction(
  clientId: string,
  splitId: string,
  status: string
) {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session.user.trainerProfileId

  if (!Object.values(PlanStatus).includes(status as PlanStatus)) {
    return { ok: false as const, error: "Invalid status" }
  }

  const split = await updateTrainingSplitStatus(
    clientId,
    trainerProfileId,
    splitId,
    status as PlanStatus
  )
  if (!split) {
    return { ok: false as const, error: "Training split not found" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=training-split`)
  invalidate([
    `client:${clientId}:workout`,
    `client:${clientId}:profile`,
  ])
  return { ok: true as const }
}