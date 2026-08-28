import { prisma } from "@/lib/prisma"
import { pickCurrentSubscription } from "@/server/services/subscription.service"

type ClientWithRelations = Awaited<ReturnType<typeof getClientProfile>>

export async function getClientProfile(clientId: string, trainerProfileId?: string) {
  const where = trainerProfileId
    ? { id: clientId, trainerId: trainerProfileId }
    : { id: clientId }

  const client = await prisma.client.findFirst({
    where,
  })

  if (!client) {
    return null
  }

  const [latestBodyComposition, latestSubscription, latestTrainingSplit] =
    await Promise.all([
      prisma.bodyComposition.findFirst({
        where: { clientId: client.id },
        orderBy: { date: "desc" },
      }),
      prisma.subscription.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.trainingSplit.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { days: { orderBy: { dayNumber: "asc" }, take: 10 } },
      }),
    ])

  return {
    client,
    latestBodyComposition: latestBodyComposition ?? null,
    latestSubscription: pickCurrentSubscription(latestSubscription),
    latestTrainingSplit:
      latestTrainingSplit.find((s) => s.status === "ACTIVE") ?? latestTrainingSplit[0] ?? null,
  }
}

export type ClientProfile = NonNullable<ClientWithRelations>
