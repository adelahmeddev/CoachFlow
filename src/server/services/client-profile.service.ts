import { pool } from "@/lib/db"
import type { BodyComposition, Client, Subscription, TrainingSplit, TrainingSplitDay } from "@/lib/db/types"
import { pickCurrentSubscription } from "@/server/services/subscription.service"

type ClientWithRelations = Awaited<ReturnType<typeof getClientProfile>>

export async function getClientProfile(clientId: string, trainerProfileId?: string) {
  let clientRes
  try {
    clientRes = trainerProfileId
      ? await pool.query<Client>(
          `SELECT * FROM "Client" WHERE "id" = $1 AND "trainerId" = $2 LIMIT 1`,
          [clientId, trainerProfileId]
        )
      : await pool.query<Client>(`SELECT * FROM "Client" WHERE "id" = $1 LIMIT 1`, [clientId])
  } catch (err) {
    console.error("[client-profile] client fetch failed", err)
    throw new Error("timeout exceeded when trying to connect")
  }

  const client = (clientRes.rows[0] as Client) ?? null

  if (!client) {
    return null
  }

  // Use allSettled to avoid total failure if one query times out
  const results = await Promise.allSettled([
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

  const latestBodyCompositionRes = results[0].status === "fulfilled" ? results[0].value : { rows: [] } as unknown as { rows: BodyComposition[] }
  const latestSubscriptionRes = results[1].status === "fulfilled" ? results[1].value : { rows: [] } as unknown as { rows: Subscription[] }
  const latestTrainingSplitRes = results[2].status === "fulfilled" ? results[2].value : { rows: [] } as unknown as { rows: TrainingSplit[] }

  if (results.some(r => r.status === "rejected")) {
    console.warn("[client-profile] partial data failure, returning degraded", results.filter(r=>r.status==="rejected"))
  }

  const latestBodyComposition = (latestBodyCompositionRes.rows[0] as BodyComposition) ?? null

  const latestSubscription = pickCurrentSubscription(latestSubscriptionRes.rows as Subscription[])

  const rawSplits = latestTrainingSplitRes.rows as TrainingSplit[]

  let splitsWithDays: (TrainingSplit & { days: TrainingSplitDay[] })[] = []

  if (rawSplits.length > 0) {
    const daysSettled = await Promise.allSettled(
      rawSplits.map((split) =>
        pool.query<TrainingSplitDay>(
          `SELECT * FROM "TrainingSplitDay" WHERE "splitId" = $1 ORDER BY "dayNumber" ASC LIMIT 10`,
          [split.id]
        )
      )
    )

    splitsWithDays = rawSplits.map((split, i) => {
      const res = daysSettled[i]
      const rows = res && res.status === "fulfilled" ? (res.value.rows as TrainingSplitDay[]) : []
      if (res && res.status === "rejected") console.warn("[client-profile] days fetch failed for", split.id, res.reason)
      return {
        ...split,
        days: rows,
      }
    })
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
