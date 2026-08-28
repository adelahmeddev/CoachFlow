import { prisma } from "@/lib/prisma"
import { PlanType, SubscriptionStatus } from "@/generated/prisma/enums"
import type { Subscription } from "@/generated/prisma/client"
import type {
  RenewSubscriptionInput,
  SubscriptionInput,
} from "@/lib/validations/subscription"

const DAY_MS = 24 * 60 * 60 * 1000

type SubscriptionLike = {
  status: SubscriptionStatus
  createdAt: Date
}

/**
 * Shared "current subscription" selector.
 * Prefers the latest subscription with status ACTIVE or TRIAL,
 * otherwise falls back to the latest subscription by createdAt.
 * Input should be sorted by createdAt descending.
 */
export function pickCurrentSubscription<T extends SubscriptionLike>(
  subscriptions: T[]
): T | null {
  if (subscriptions.length === 0) return null
  return (
    subscriptions.find(
      (subscription) =>
        subscription.status === SubscriptionStatus.ACTIVE ||
        subscription.status === SubscriptionStatus.TRIAL
    ) ??
    subscriptions[0] ??
    null
  )
}

function toDateOrNull(value: string | undefined): Date | null {
  if (!value) return null
  return new Date(`${value}T00:00:00Z`)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

type NormalizedSubscriptionData = Pick<
  Subscription,
  | "planType"
  | "startDate"
  | "endDate"
  | "durationDays"
  | "sessionsCount"
  | "remainingSessions"
>

/**
 * Normalize form input by plan type:
 * - SESSIONS plans keep session counters and never carry a duration/end date.
 * - PERIOD plans carry a duration in days; the end date is derived
 *   from start date + duration when not provided explicitly.
 */
function normalizeSubscriptionData(
  data: SubscriptionInput
): NormalizedSubscriptionData {
  const startDate = toDateOrNull(data.startDate ?? "")
  const explicitEndDate = toDateOrNull(data.endDate ?? "")

  if (data.planType === PlanType.SESSIONS) {
    const sessionsCount =
      data.sessionsCount === "" || data.sessionsCount === undefined
        ? null
        : data.sessionsCount
    let remainingSessions =
      data.remainingSessions === "" || data.remainingSessions === undefined
        ? null
        : data.remainingSessions
    if (sessionsCount !== null && remainingSessions === null) {
      remainingSessions = sessionsCount
    }

    return {
      planType: PlanType.SESSIONS,
      startDate,
      endDate: null,
      durationDays: null,
      sessionsCount,
      remainingSessions,
    }
  }

  const durationDays =
    data.durationDays === "" || data.durationDays === undefined
      ? null
      : data.durationDays
  const endDate =
    explicitEndDate ??
    (startDate && durationDays ? addDays(startDate, durationDays) : null)

  return {
    planType: PlanType.PERIOD,
    startDate,
    endDate,
    durationDays,
    sessionsCount: null,
    remainingSessions: null,
  }
}

export async function getOwnedClient(
  clientId: string,
  trainerProfileId: string
) {
  return prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerProfileId },
    select: { id: true, fullName: true },
  })
}

export async function getCurrentSubscription(
  clientId: string,
  trainerProfileId: string
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const subscriptions = await prisma.subscription.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  })

  return pickCurrentSubscription(subscriptions)
}

export async function getClientSubscriptionData(
  clientId: string,
  trainerProfileId: string
) {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const subscriptions = await prisma.subscription.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  })

  return {
    client,
    subscriptions,
    currentSubscription: pickCurrentSubscription(subscriptions),
  }
}

export async function getSubscriptionForEdit(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  return prisma.subscription.findFirst({
    where: { id: subscriptionId, clientId: client.id },
  })
}

export async function createSubscription(
  clientId: string,
  trainerProfileId: string,
  data: SubscriptionInput
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const status = data.status
  const isCurrentStatus =
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL
  const normalized = normalizeSubscriptionData(data)

  return prisma.$transaction(async (tx) => {
    if (isCurrentStatus) {
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
    }

    return tx.subscription.create({
      data: {
        clientId: client.id,
        planName: (data.planName ?? "").trim(),
        planType: normalized.planType,
        status,
        paymentStatus: data.paymentStatus,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        durationDays: normalized.durationDays,
        sessionsCount: normalized.sessionsCount,
        remainingSessions: normalized.remainingSessions,
        autoRenew: data.autoRenew,
        notes: data.notes?.trim() || null,
      },
    })
  })
}

export async function updateSubscription(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string,
  data: SubscriptionInput
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, clientId: client.id },
    select: { id: true, status: true },
  })
  if (!subscription) return null

  const status = data.status
  const isCurrentStatus =
    status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL
  const normalized = normalizeSubscriptionData(data)

  return prisma.$transaction(async (tx) => {
    if (isCurrentStatus && subscription.status !== status) {
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
    }

    return tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        planName: (data.planName ?? "").trim(),
        planType: normalized.planType,
        status,
        paymentStatus: data.paymentStatus,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        durationDays: normalized.durationDays,
        sessionsCount: normalized.sessionsCount,
        remainingSessions: normalized.remainingSessions,
        autoRenew: data.autoRenew,
        notes: data.notes?.trim() || null,
      },
    })
  })
}

export async function updateSubscriptionStatus(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, clientId: client.id },
    select: { id: true },
  })
  if (!subscription) return null

  return prisma.$transaction(async (tx) => {
    if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIAL) {
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
    }

    return tx.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    })
  })
}

export async function renewSubscription(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string,
  data: RenewSubscriptionInput
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, clientId: client.id },
    select: {
      id: true,
      planType: true,
      durationDays: true,
      endDate: true,
      startDate: true,
      sessionsCount: true,
    },
  })
  if (!subscription) return null

  const newEndDate = toDateOrNull(data.newEndDate ?? "")

  // PERIOD plans without an explicit end date are extended by their
  // own duration from the later of today and the current end date.
  let periodEndDate: Date | undefined
  if (subscription.planType === PlanType.PERIOD && !newEndDate) {
    const durationDays = subscription.durationDays
    if (durationDays) {
      const now = new Date()
      const base =
        subscription.endDate && subscription.endDate > now
          ? subscription.endDate
          : now
      periodEndDate = addDays(base, durationDays)
    }
  }

  return prisma.$transaction(async (tx) => {
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

    return tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        paymentStatus: data.paymentStatus,
        ...(newEndDate || periodEndDate
          ? {
              endDate: newEndDate ?? periodEndDate!,
              startDate:
                subscription.startDate ?? toDateOrNull(data.newEndDate ?? "") ?? new Date(),
            }
          : {}),
        ...(data.resetSessions &&
        subscription.planType === PlanType.SESSIONS &&
        subscription.sessionsCount !== null
          ? { remainingSessions: subscription.sessionsCount }
          : {}),
      },
    })
  })
}

export async function consumeOneSession(
  clientId: string,
  trainerProfileId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const client = await getOwnedClient(clientId, trainerProfileId)
  if (!client) return null

  // Atomic conditional decrement — eliminates the read-check-write race condition.
  // The WHERE clause on remainingSessions > 0 ensures the decrement only happens
  // if sessions are still available at the moment of the write, not at the time
  // of a prior read. Two concurrent requests can no longer both "see" remaining > 0
  // and both decrement past zero.
  const updated = await prisma.subscription.updateMany({
    where: {
      id: subscriptionId,
      clientId: client.id,
      remainingSessions: { gt: 0 },
    },
    data: { remainingSessions: { decrement: 1 } },
  })

  if (updated.count === 0) return null

  // Fetch and return the updated record for the action layer.
  return prisma.subscription.findFirst({
    where: { id: subscriptionId, clientId: client.id },
  })
}