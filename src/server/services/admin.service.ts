import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import {
  ClientStatus,
  PaymentStatus,
  SubscriptionStatus,
} from "@/generated/prisma/enums"
import {
  createTrainerSchema,
  type AdminClientsQuery,
  type AdminSubscriptionsQuery,
  type AdminTrainersQuery,
} from "@/lib/validations/admin"
import { pickCurrentSubscription } from "@/server/services/subscription.service"
import { withCache, toIso } from "@/lib/cache"

export async function getAdminDashboardStats() {
  return withCache(
    async () => {
      const [
        totalTrainers,
        totalClients,
        activeSubscriptions,
        pendingAssessments,
        recentTrainers,
        recentClients,
      ] = await Promise.all([
        prisma.trainerProfile.count(),
        prisma.client.count(),
        prisma.subscription.count({
          where: {
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
            },
          },
        }),
        prisma.client.count({
          where: { status: ClientStatus.PENDING_ASSESSMENT },
        }),
        prisma.trainerProfile.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdAt: true,
          },
        }),
        prisma.client.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            fullName: true,
            status: true,
            createdAt: true,
            trainer: { select: { fullName: true } },
          },
        }),
      ])

      return {
        totalTrainers,
        totalClients,
        activeSubscriptions,
        pendingAssessments,
        recentTrainers: recentTrainers.map((trainer) => ({
          ...trainer,
          createdAt: toIso(trainer.createdAt)!,
        })),
        recentClients: recentClients.map((client) => ({
          ...client,
          createdAt: toIso(client.createdAt)!,
        })),
      }
    },
    ["admin-dashboard-stats"],
    ["admin:stats"],
    300
  )()
}

export async function getAdminTrainers(params: AdminTrainersQuery) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10

  const where = params.q
    ? {
        OR: [
          { fullName: { contains: params.q, mode: "insensitive" as const } },
          { phone: { contains: params.q, mode: "insensitive" as const } },
        ],
      }
    : {}

  const [total, trainers] = await Promise.all([
    prisma.trainerProfile.count({ where }),
    prisma.trainerProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        fullName: true,
        phone: true,
        createdAt: true,
        user: { select: { username: true } },
        _count: { select: { clients: true } },
      },
    }),
  ])

  return {
    trainers,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getAdminTrainerOptions() {
  return prisma.trainerProfile.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  })
}

export async function getAdminClients(params: AdminClientsQuery) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10

  const where = {
    ...(params.trainerId ? { trainerId: params.trainerId } : {}),
    ...(params.goal ? { goal: params.goal } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.q
      ? {
          OR: [
            { fullName: { contains: params.q, mode: "insensitive" as const } },
            { phone: { contains: params.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
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
        goal: true,
        status: true,
        birthDate: true,
        basicInfoCompletedAt: true,
        createdAt: true,
        trainer: { select: { id: true, fullName: true } },
      },
    }),
  ])

  const subscriptions = await prisma.subscription.findMany({
    where: { clientId: { in: clients.map((client) => client.id) } },
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
    const list = subscriptionsByClient.get(subscription.clientId) ?? []
    list.push(subscription)
    subscriptionsByClient.set(subscription.clientId, list)
  }

  const rows = clients.map((client) => {
    const subs = subscriptionsByClient.get(client.id) ?? []
    return { ...client, subscription: pickCurrentSubscription(subs) ?? null }
  })

  return {
    clients: rows,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function getAdminSubscriptions(params: AdminSubscriptionsQuery) {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10

  const where = {
    ...(params.status ? { status: params.status as SubscriptionStatus } : {}),
    ...(params.paymentStatus
      ? { paymentStatus: params.paymentStatus as PaymentStatus }
      : {}),
    ...(params.q
      ? {
          OR: [
            { planName: { contains: params.q, mode: "insensitive" as const } },
            {
              client: {
                fullName: { contains: params.q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  }

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        planName: true,
        planType: true,
        status: true,
        paymentStatus: true,
        startDate: true,
        endDate: true,
        durationDays: true,
        sessionsCount: true,
        remainingSessions: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            fullName: true,
            trainer: { select: { fullName: true } },
          },
        },
      },
    }),
  ])

  return {
    subscriptions,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  }
}

export async function createTrainer(data: unknown) {
  const parsed = createTrainerSchema.safeParse(data)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, phone, password } = parsed.data

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { username: phone }],
    },
  })
  if (existing) {
    return { ok: false as const, code: "PHONE_EXISTS" as const }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username: phone,
      phone,
      passwordHash,
      role: "TRAINER",
      trainerProfile: {
        create: {
          fullName,
          phone,
        },
      },
    },
    select: { id: true },
  })

  return { ok: true as const, userId: user.id }
}