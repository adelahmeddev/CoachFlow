"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import { goalSchema, goalStatusSchema } from "@/lib/validations/goal"
import { createGoal, setGoalStatus, updateGoal } from "@/server/services/goal.service"

async function requireTrainerProfileId() {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "COACH" || !session.user.trainerProfileId) {
    return null
  }
  return session.user.trainerProfileId
}

function revalidateGoals(clientId: string) {
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=goals`)
  revalidatePath("/client/profile")
  revalidatePath("/dashboard")
}

export async function createGoalAction(clientId: string, input: unknown) {
  const trainerProfileId = await requireTrainerProfileId()
  if (!trainerProfileId) return { ok: false as const, error: "UNAUTHORIZED" }

  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const goal = await createGoal(clientId, trainerProfileId, parsed.data)
  if (!goal) return { ok: false as const, error: "NOT_FOUND" }
  revalidateGoals(clientId)
  return { ok: true as const, goalId: goal.id }
}

export async function updateGoalAction(goalId: string, clientId: string, input: unknown) {
  const trainerProfileId = await requireTrainerProfileId()
  if (!trainerProfileId) return { ok: false as const, error: "UNAUTHORIZED" }

  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const goal = await updateGoal(goalId, clientId, trainerProfileId, parsed.data)
  if (!goal) return { ok: false as const, error: "NOT_FOUND" }
  revalidateGoals(clientId)
  return { ok: true as const }
}

export async function setGoalStatusAction(goalId: string, clientId: string, input: unknown) {
  const trainerProfileId = await requireTrainerProfileId()
  if (!trainerProfileId) return { ok: false as const, error: "UNAUTHORIZED" }

  const parsed = goalStatusSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" }

  const goal = await setGoalStatus(goalId, clientId, trainerProfileId, parsed.data.status)
  if (!goal) return { ok: false as const, error: "NOT_FOUND" }
  revalidateGoals(clientId)
  return { ok: true as const }
}
