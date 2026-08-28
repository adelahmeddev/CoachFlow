import { prisma } from "@/lib/prisma"
import {
  PaymentStatus,
  PlanType,
  SubscriptionStatus,
} from "@/generated/prisma/enums"
import type { SubscriptionPlan } from "@/generated/prisma/client"
import type { SubscriptionPlanInput } from "@/lib/validations/subscription-plan"
import { invalidate } from "@/lib/cache"

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().split("T")[0]}T00:00:00Z`)
}

async function getOwnedPlan(
  planId: string,
  trainerProfileId: string
): Promise<SubscriptionPlan | null> {
  return prisma.subscriptionPlan.findFirst({
    where: { id: planId, trainerId: trainerProfileId },
  })
}

export async function getTrainerSubscriptionPlans(trainerProfileId: string) {
  return prisma.subscriptionPlan.findMany({
    where: { trainerId: trainerProfileId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getSubscriptionPlanForEdit(
  planId: string,
  trainerProfileId: string
) {
  return getOwnedPlan(planId, trainerProfileId)
}

export async function createSubscriptionPlan(
  trainerProfileId: string,
  data: SubscriptionPlanInput
): Promise<SubscriptionPlan> {
  const isSessions = data.planType === PlanType.SESSIONS

  return prisma.subscriptionPlan.create({
    data: {
      trainerId: trainerProfileId,
      name: data.name.trim(),
      planType: data.planType,
      sessionsCount:
        isSessions && data.sessionsCount !== "" && data.sessionsCount !== undefined
          ? data.sessionsCount
          : null,
      durationDays:
        !isSessions && data.durationDays !== "" && data.durationDays !== undefined
          ? data.durationDays
          : null,
      notes: data.notes?.trim() || null,
    },
  })
}

export async function updateSubscriptionPlan(
  planId: string,
  trainerProfileId: string,
  data: SubscriptionPlanInput
): Promise<SubscriptionPlan | null> {
  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return null

  const isSessions = data.planType === PlanType.SESSIONS

  return prisma.subscriptionPlan.update({
    where: { id: plan.id },
    data: {
      name: data.name.trim(),
      planType: data.planType,
      sessionsCount:
        isSessions && data.sessionsCount !== "" && data.sessionsCount !== undefined
          ? data.sessionsCount
          : null,
      durationDays:
        !isSessions && data.durationDays !== "" && data.durationDays !== undefined
          ? data.durationDays
          : null,
      notes: data.notes?.trim() || null,
    },
  })
}

export async function duplicateSubscriptionPlan(
  planId: string,
  trainerProfileId: string
): Promise<SubscriptionPlan | null> {
  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return null

  return prisma.subscriptionPlan.create({
    data: {
      trainerId: trainerProfileId,
      name: `${plan.name} (Copy)`,
      planType: plan.planType,
      sessionsCount: plan.sessionsCount,
      durationDays: plan.durationDays,
      notes: plan.notes,
    },
  })
}

export async function deleteSubscriptionPlan(
  planId: string,
  trainerProfileId: string
): Promise<boolean> {
  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return false

  await prisma.subscriptionPlan.delete({ where: { id: plan.id } })
  return true
}

/**
 * Assign a plan to a client as their current active subscription.
 * The plan snapshot (name, type, sessions/duration) is copied onto the
 * subscription so later edits to the plan do not alter active ones.
 */
export async function assignSubscriptionPlanToClient(
  clientId: string,
  trainerProfileId: string,
  planId: string
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerProfileId },
    select: { id: true },
  })
  if (!client) return null

  const plan = await getOwnedPlan(planId, trainerProfileId)
  if (!plan) return null

  const startDate = todayUtc()
  const isPeriod = plan.planType === PlanType.PERIOD

  const subscription = await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: {
        clientId: client.id,
        OR: [
          { status: SubscriptionStatus.ACTIVE },
          { status: SubscriptionStatus.TRIAL },
        ],
      },
      data: { status: SubscriptionStatus.EXPIRED },
    })

    return tx.subscription.create({
      data: {
        clientId: client.id,
        planId: plan.id,
        planName: plan.name,
        planType: plan.planType,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate: isPeriod && plan.durationDays ? addDays(startDate, plan.durationDays) : null,
        durationDays: isPeriod ? plan.durationDays : null,
        sessionsCount: isPeriod ? null : plan.sessionsCount,
        remainingSessions: isPeriod ? null : plan.sessionsCount,
        paymentStatus: PaymentStatus.NOT_REQUIRED,
      },
    })
  })

  invalidate([
    `client:${client.id}:profile`,
    `trainer:${trainerProfileId}:clients`,
    `trainer:${trainerProfileId}:dashboard`,
    "admin:stats",
  ])

  return subscription
}
