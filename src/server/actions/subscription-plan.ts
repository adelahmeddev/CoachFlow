"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  subscriptionPlanSchema,
  type SubscriptionPlanInput,
} from "@/lib/validations/subscription-plan"
import {
  assignSubscriptionPlanToClient,
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  duplicateSubscriptionPlan,
  updateSubscriptionPlan,
} from "@/server/services/subscription-plan.service"

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "TRAINER" &&
      session.user.trainerProfileId
  )
}

function revalidatePlans() {
  revalidatePath("/subscription-plans")
}

export async function createSubscriptionPlanAction(input: unknown) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = subscriptionPlanSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const plan = await createSubscriptionPlan(
    trainerProfileId,
    parsed.data as SubscriptionPlanInput
  )

  revalidatePlans()
  invalidate([`trainer:${trainerProfileId}:subscription-plans`])
  return { ok: true as const, planId: plan.id }
}

export async function updateSubscriptionPlanAction(
  planId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = subscriptionPlanSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const plan = await updateSubscriptionPlan(
    planId,
    trainerProfileId,
    parsed.data as SubscriptionPlanInput
  )
  if (!plan) {
    return { ok: false as const, error: "Plan not found" }
  }

  revalidatePlans()
  invalidate([`trainer:${trainerProfileId}:subscription-plans`])
  return { ok: true as const }
}

export async function duplicateSubscriptionPlanAction(planId: string) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const plan = await duplicateSubscriptionPlan(planId, trainerProfileId)
  if (!plan) {
    return { ok: false as const, error: "Plan not found" }
  }

  revalidatePlans()
  invalidate([`trainer:${trainerProfileId}:subscription-plans`])
  return { ok: true as const, planId: plan.id }
}

export async function deleteSubscriptionPlanAction(planId: string) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const deleted = await deleteSubscriptionPlan(planId, trainerProfileId)
  if (!deleted) {
    return { ok: false as const, error: "Plan not found" }
  }

  revalidatePlans()
  invalidate([`trainer:${trainerProfileId}:subscription-plans`])
  return { ok: true as const }
}

export async function assignSubscriptionPlanAction(
  clientId: string,
  planId: string
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const subscription = await assignSubscriptionPlanToClient(
    clientId,
    trainerProfileId,
    planId
  )
  if (!subscription) {
    return { ok: false as const, error: "Client or plan not found" }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=subscription`)
  return { ok: true as const, subscriptionId: subscription.id }
}
