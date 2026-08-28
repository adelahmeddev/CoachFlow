import { prisma } from "@/lib/prisma"
import { ClientStatus, Goal, SubscriptionStatus } from "@/generated/prisma/enums"
import {
  clientCreateSchema,
  type ClientCreateInput,
} from "@/lib/validations/client"

export async function createClientManually(
  trainerProfileId: string,
  input: unknown
) {
  const parsed = clientCreateSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data as ClientCreateInput

  // Validate trainer profile exists before FK create (prevents P2003)
  const trainerProfile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { id: true },
  })
  if (!trainerProfile) {
    return {
      ok: false as const,
      error: "Trainer profile not found. Please log out and log in again.",
    } as const
  }

  try {
    const client = await prisma.client.create({
      data: {
        trainerId: trainerProfileId,
        fullName: data.fullName,
        phone: data.phone ?? null,
        birthDate: data.birthDate ?? null,
        goal: data.goal ?? null,
        status: data.status,
      },
    })
    return { ok: true as const, clientId: client.id }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2003"
    ) {
      return {
        ok: false as const,
        error: "Trainer profile no longer exists. Please log out and log in again.",
      } as const
    }
    throw error
  }
}

export async function getTrainerClients(
  trainerProfileId: string,
  params: {
    q?: string
    goal?: Goal
    status?: ClientStatus
    page?: number
    perPage?: number
  }
) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10

  const where = {
    trainerId: trainerProfileId,
    ...(params.q
      ? {
          OR: [
            { fullName: { contains: params.q, mode: "insensitive" as const } },
            { phone: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params.status ? { status: params.status as ClientStatus } : {}),
    ...(params.goal ? { goal: params.goal as Goal } : {}),
  }

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        fullName: true,
        phone: true,
        birthDate: true,
        goal: true,
        status: true,
        basicInfoCompletedAt: true,
        createdAt: true,
      },
    }),
  ])

  // Filter to ACTIVE/TRIAL only at the DB level — avoids pulling all historical
  // subscriptions per client page and doing JS-level picking over an unbounded set.
  const subscriptions = await prisma.subscription.findMany({
    where: {
      clientId: { in: clients.map((client) => client.id) },
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientId: true,
      planName: true,
      status: true,
      createdAt: true,
    },
  })

  const subscriptionsByClient = new Map<string, typeof subscriptions>()
  for (const subscription of subscriptions) {
    // Keep only the first (most recent) active/trial sub per client.
    if (!subscriptionsByClient.has(subscription.clientId)) {
      subscriptionsByClient.set(subscription.clientId, [subscription])
    }
  }

  const rows = clients.map((client) => {
    const subs = subscriptionsByClient.get(client.id) ?? []
    const preferred = subs[0] ?? null
    return { ...client, subscription: preferred }
  })

  return {
    clients: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getTrainerClient(
  trainerProfileId: string,
  clientId: string
) {
  return prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerProfileId },
    include: {
      trainer: { select: { id: true, fullName: true } },
      bodyCompositions: { orderBy: { date: "desc" }, take: 3 },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 2 },
      trainingSplits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { days: { orderBy: { dayNumber: "asc" } } },
      },
      progressReviews: { orderBy: { reviewDate: "desc" }, take: 1 },
      workoutLogs: { orderBy: { date: "desc" }, take: 5 },
    },
  })
}

export async function deleteTrainerClient(
  trainerProfileId: string,
  clientId: string
): Promise<boolean> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, trainerId: trainerProfileId },
    select: { id: true, userId: true },
  })
  if (!client) return false

  // Delete client first — cascades subscriptions, splits, plans, logs via onDelete: Cascade
  // KEEP the linked User row so an active portal session can show
  // "No longer subscribed" instead of a generic invalid-credentials error on next login.
  // The orphaned CLIENT user will be detected in portal layout (client lookup by userId fails)
  // and shown the friendly farewell screen with sign-out.
  await prisma.client.delete({ where: { id: clientId } })
  return true
}
