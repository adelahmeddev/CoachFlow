import { pool } from "@/lib/db"
import type { BodyComposition, Client, Subscription, TrainingSplit, TrainingSplitDay } from "@/lib/db/types"
import { pickCurrentSubscription } from "@/server/services/subscription.service"

type ClientWithRelations = Awaited<ReturnType<typeof getClientProfile>>

export async function getClientProfile(clientId: string, trainerProfileId?: string) {
  const clientRes = trainerProfileId
    ? await pool.query<Client>(
        `SELECT * FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
        [clientId, trainerProfileId]
      )
    : await pool.query<Client>(`SELECT * FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])

  const client = (clientRes.rows[0] as Client) ?? null

  if (!client) {
    return null
  }

  const [latestBodyCompositionRes, latestSubscriptionRes, latestTrainingSplitRes] =
    await Promise.all([
      pool.query<BodyComposition>(
        `SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 1`,
        [client.id]
      ),
      pool.query<Subscription>(
        `SELECT * FROM "Subscription" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 3`,
        [client.id]
      ),
      pool.query<TrainingSplit>(
        `SELECT * FROM "TrainingSplit" WHERE "clientId" = $1 ORDER BY "createdAt" DESC LIMIT 3`,
        [client.id]
      ),
    ])

  const latestBodyComposition = (latestBodyCompositionRes.rows[0] as BodyComposition) ?? null

  const latestSubscription = pickCurrentSubscription(latestSubscriptionRes.rows as Subscription[])

  const rawSplits = latestTrainingSplitRes.rows as TrainingSplit[]

  let splitsWithDays: (TrainingSplit & { days: TrainingSplitDay[] })[] = []

  if (rawSplits.length > 0) {
    const daysResults = await Promise.all(
      rawSplits.map((split) =>
        pool.query<TrainingSplitDay>(
          `SELECT * FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC LIMIT 10`,
          [split.id]
        )
      )
    )

    splitsWithDays = rawSplits.map((split, i) => ({
      ...split,
      days: daysResults[i]!.rows as TrainingSplitDay[],
    }))
  }

  const latestTrainingSplit =
    splitsWithDays.find((s) => s.status === "ACTIVE") ??
    splitsWithDays[0] ??
    null

  return {
    client,
    latestBodyComposition,
    latestSubscription,
    latestTrainingSplit,
  }
}

export type ClientProfile = NonNullable<ClientWithRelations>
