"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  subscriptionSchema,
  renewSubscriptionSchema,
  type SubscriptionInput,
  type RenewSubscriptionInput,
} from "@/lib/validations/subscription"
import {
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  renewSubscription,
  consumeOneSession,
} from "@/server/services/subscription.service"
import { SubscriptionStatus } from "@/lib/db/enums"

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "TRAINER" &&
      session.user.trainerProfileId
  )
}

export async function createSubscriptionAction(
  clientId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const subscription = await createSubscription(
    clientId,
    trainerProfileId,
    parsed.data as SubscriptionInput
  )
  if (!subscription) {
    return { ok: false as const, error: "Client not found" }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=subscription`)
  invalidate([
    `client:${clientId}:profile`,
    `trainer:${session!.user!.trainerProfileId!}:clients`,
    `trainer:${session!.user!.trainerProfileId!}:dashboard`,
    "admin:stats",
  ])
  return { ok: true as const, subscriptionId: subscription.id }
}

export async function updateSubscriptionAction(
  clientId: string,
  subscriptionId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = subscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const subscription = await updateSubscription(
    clientId,
    trainerProfileId,
    subscriptionId,
    parsed.data as SubscriptionInput
  )
  if (!subscription) {
    return { ok: false as const, error: "Subscription not found" }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=subscription`)
  invalidate([
    `client:${clientId}:profile`,
    `trainer:${session!.user!.trainerProfileId!}:clients`,
    `trainer:${session!.user!.trainerProfileId!}:dashboard`,
    "admin:stats",
  ])
  return { ok: true as const }
}

export async function updateSubscriptionStatusAction(
  clientId: string,
  subscriptionId: string,
  status: string
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  if (!Object.values(SubscriptionStatus).includes(status as SubscriptionStatus)) {
    return { ok: false as const, error: "Invalid status" }
  }

  const subscription = await updateSubscriptionStatus(
    clientId,
    trainerProfileId,
    subscriptionId,
    status as SubscriptionStatus
  )
  if (!subscription) {
    return { ok: false as const, error: "Subscription not found" }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=subscription`)
  invalidate([
    `client:${clientId}:profile`,
    `trainer:${session!.user!.trainerProfileId!}:clients`,
    `trainer:${session!.user!.trainerProfileId!}:dashboard`,
    "admin:stats",
  ])
  return { ok: true as const }
}

export async function renewSubscriptionAction(
  clientId: string,
  subscriptionId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = renewSubscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const subscription = await renewSubscription(
    clientId,
    trainerProfileId,
    subscriptionId,
    parsed.data as RenewSubscriptionInput
  )
  if (!subscription) {
    return { ok: false as const, error: "Subscription not found" }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=subscription`)
  invalidate([
    `client:${clientId}:profile`,
    `trainer:${session!.user!.trainerProfileId!}:clients`,
    `trainer:${session!.user!.trainerProfileId!}:dashboard`,
    "admin:stats",
  ])
  return { ok: true as const }
}

export async function consumeSessionAction(
  clientId: string,
  subscriptionId: string
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const subscription = await consumeOneSession(
    clientId,
    trainerProfileId,
    subscriptionId
  )
  if (!subscription) {
    return { ok: false as const, error: "No remaining sessions" }
  }

  revalidatePath("/clients")
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=subscription`)
  invalidate([
    `client:${clientId}:profile`,
    `trainer:${session!.user!.trainerProfileId!}:clients`,
    `trainer:${session!.user!.trainerProfileId!}:dashboard`,
    "admin:stats",
  ])
  return { ok: true as const, remainingSessions: subscription.remainingSessions }
}