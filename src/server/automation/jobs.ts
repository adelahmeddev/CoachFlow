import { generateId, withTransaction, type PgClient } from "@/lib/db"

/**
 * P0 automation: subscription lifecycle + reminders.
 *
 * Serverless-safe design (no setInterval, no in-memory state):
 * - Triggered externally (Vercel Cron / any scheduler) via /api/automation/run.
 * - Mutual exclusion across instances/restarts via a Postgres advisory
 *   transaction lock — overlapping runs exit immediately with locked:true.
 * - Every notification carries a dedupeKey with a UNIQUE constraint, so
 *   retries and overlapping milestones never double-notify (idempotent).
 * - Subscription state is derived from authoritative DB rows only.
 * - History is never deleted or rewritten — expiry only flips status,
 *   using the same ACTIVE/TRIAL → EXPIRED semantics as the manual flows.
 */

export interface AutomationSummary {
  ranAt: string
  locked: boolean
  expiredSubscriptions: number
  clientReminders: number
  coachReminders: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function dayKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfTodayUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/** ISO week key for weekly-dedupe (e.g. "2026-W36"). */
function weekKeyUTC(d: Date): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = (tmp.getUTCDay() + 6) % 7
  tmp.setUTCDate(tmp.getUTCDate() - day + 3)
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
  const fday = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fday + 3)
  const week = 1 + Math.round((tmp.getTime() - firstThursday.getTime()) / (7 * DAY_MS))
  return `${tmp.getUTCFullYear()}-W${week}`
}

type Tx = PgClient

async function insertReminder(
  tx: Tx,
  input: {
    userId: string | null
    type: string
    titleKey: string
    bodyKey: string
    params: Record<string, string | number>
    link: string | null
    dedupeKey: string
  },
  counters: { client: number; coach: number },
  audience: "client" | "coach"
): Promise<void> {
  if (!input.userId) return
  const res = await tx.query(
    `INSERT INTO "Notification" ("id", "userId", "type", "titleKey", "bodyKey", "params", "link", "dedupeKey", "createdAt")
     SELECT $1, $2, $3::"NotificationType", $4, $5, $6::jsonb, $7, $8, NOW()
     WHERE EXISTS (SELECT 1 FROM "User" WHERE "id" = $2)
     ON CONFLICT ("dedupeKey") DO NOTHING`,
    [
      generateId(),
      input.userId,
      input.type,
      input.titleKey,
      input.bodyKey,
      JSON.stringify(input.params),
      input.link,
      input.dedupeKey,
    ]
  )
  if ((res.rowCount ?? 0) > 0) counters[audience] += 1
}

export async function runAutomationJobs(now: Date = new Date()): Promise<AutomationSummary> {
  const ranAt = now.toISOString()
  const today = startOfTodayUTC(now)
  const todayKey = dayKeyUTC(today)
  const weekKey = weekKeyUTC(today)

  return withTransaction(async (tx) => {
    const lockRes = await tx.query(
      `SELECT pg_try_advisory_xact_lock(hashtext('coachflow-automation-v1')) AS locked`
    )
    if (!(lockRes.rows[0] as { locked: boolean }).locked) {
      return { ranAt, locked: false, expiredSubscriptions: 0, clientReminders: 0, coachReminders: 0 }
    }

    const counters = { client: 0, coach: 0 }

    // 1. Expire overdue PERIOD subscriptions (status flip only — history kept).
    const expiredRes = await tx.query<{ id: string }>(
      `UPDATE "Subscription" SET "status" = 'EXPIRED'::"SubscriptionStatus", "updatedAt" = NOW()
       WHERE "status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")
         AND "planType" = 'PERIOD'::"PlanType"
         AND "endDate" IS NOT NULL AND "endDate" < $1
       RETURNING "id"`,
      [today]
    )
    const expiredSubscriptions = expiredRes.rowCount ?? 0

    // 1b. Expiry notices for subscriptions flipped by this run (they no
    // longer match the ACTIVE reminder query below, so notify from RETURNING).
    if (expiredSubscriptions > 0) {
      const expIds = (expiredRes.rows as { id: string }[]).map((r) => r.id)
      const expPh = expIds.map((_, i) => `$${i + 1}`).join(",")
      const expRes = await tx.query<{
        id: string
        clientId: string
        clientUserId: string | null
        clientName: string | null
        trainerUserId: string | null
      }>(
        `SELECT s."id", s."clientId", c."userId" AS "clientUserId",
                c."fullName" AS "clientName", tp."userId" AS "trainerUserId"
         FROM "Subscription" s
         JOIN "Client" c ON c."id" = s."clientId"
         JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
         WHERE s."id" IN (${expPh})`,
        expIds
      )
      for (const sub of expRes.rows as Array<{
        id: string; clientId: string; clientUserId: string | null;
        clientName: string | null; trainerUserId: string | null;
      }>) {
        await insertReminder(
          tx,
          {
            userId: sub.clientUserId,
            type: "SUBSCRIPTION_STATUS",
            titleKey: "subscriptionTitle",
            bodyKey: "subscriptionExpiredBody",
            params: {},
            link: "/client/profile",
            dedupeKey: `sub:${sub.id}:c:expired`,
          },
          counters,
          "client"
        )
        await insertReminder(
          tx,
          {
            userId: sub.trainerUserId,
            type: "SUBSCRIPTION_STATUS",
            titleKey: "subExpiredCoachTitle",
            bodyKey: "subExpiredCoachBody",
            params: { name: sub.clientName ?? "" },
            link: `/clients/${sub.clientId}?tab=subscription`,
            dedupeKey: `sub:${sub.id}:coach:expired`,
          },
          counters,
          "coach"
        )
      }
    }

    // 2. Subscription reminders (T-7 / T-3 / T-1 / T-0) + expiry notices.
    const subsRes = await tx.query<{
      id: string
      clientId: string
      status: string
      endDate: Date | null
      clientUserId: string | null
      clientName: string | null
      trainerUserId: string | null
    }>(
      `SELECT s."id", s."clientId", s."status", s."endDate",
              c."userId" AS "clientUserId", c."fullName" AS "clientName",
              tp."userId" AS "trainerUserId"
       FROM "Subscription" s
       JOIN "Client" c ON c."id" = s."clientId"
       JOIN "TrainerProfile" tp ON tp."id" = c."trainerId"
       WHERE s."status" IN ('ACTIVE'::"SubscriptionStatus", 'TRIAL'::"SubscriptionStatus")
         AND s."planType" = 'PERIOD'::"PlanType"
         AND s."endDate" IS NOT NULL`
    )
    for (const sub of subsRes.rows as Array<{
      id: string; clientId: string; status: string; endDate: Date | null;
      clientUserId: string | null; clientName: string | null; trainerUserId: string | null;
    }>) {
      if (!sub.endDate) continue
      // Calendar-day granularity: endDates are stored as UTC midnights, but
      // rounding keeps ad-hoc timestamps on the same milestone.
      const endDay = startOfTodayUTC(new Date(sub.endDate))
      const daysLeft = Math.round((endDay.getTime() - today.getTime()) / DAY_MS)
      const name = sub.clientName ?? ""

      if ([7, 3, 1].includes(daysLeft)) {
        await insertReminder(
          tx,
          {
            userId: sub.clientUserId,
            type: "SUBSCRIPTION_STATUS",
            titleKey: "subscriptionTitle",
            bodyKey: "subscriptionExpiringBody",
            params: { n: daysLeft },
            link: "/client/profile",
            dedupeKey: `sub:${sub.id}:c:${daysLeft}`,
          },
          counters,
          "client"
        )
      }
      if (daysLeft === 3 || daysLeft <= 0) {
        // Coach: heads-up shortly before and at expiry (needs-action covers the rest).
        await insertReminder(
          tx,
          {
            userId: sub.trainerUserId,
            type: "SUBSCRIPTION_EXPIRING",
            titleKey: daysLeft <= 0 ? "subExpiredCoachTitle" : "subExpiringCoachTitle",
            bodyKey: daysLeft <= 0 ? "subExpiredCoachBody" : "subExpiringCoachBody",
            params: daysLeft <= 0 ? { name } : { name, n: daysLeft },
            link: `/clients/${sub.clientId}?tab=subscription`,
            dedupeKey: `sub:${sub.id}:coach:${daysLeft <= 0 ? "expired" : daysLeft}`,
          },
          counters,
          "coach"
        )
      }
      if (daysLeft <= 0) {
        await insertReminder(
          tx,
          {
            userId: sub.clientUserId,
            type: "SUBSCRIPTION_STATUS",
            titleKey: "subscriptionTitle",
            bodyKey: "subscriptionExpiredBody",
            params: {},
            link: "/client/profile",
            dedupeKey: `sub:${sub.id}:c:expired`,
          },
          counters,
          "client"
        )
      }
    }

    // 3. Daily client reminders (ACTIVE clients only).
    const clientsRes = await tx.query<{
      id: string
      userId: string | null
      trainerId: string
    }>(
      `SELECT "id", "userId", "trainerId" FROM "Client"
       WHERE "status" = 'ACTIVE'::"ClientStatus"`
    )
    const clients = clientsRes.rows as { id: string; userId: string | null; trainerId: string }[]

    if (clients.length > 0) {
      const ids = clients.map((c) => c.id)
      const ph = ids.map((_, i) => `$${i + 1}`).join(",")

      // NOTE: sequential awaits — a single pg Client cannot run concurrent
      // queries, and all of this must stay inside the advisory-lock transaction.
      const activeSplitRes = await tx.query<{ clientId: string }>(
        `SELECT DISTINCT "clientId" FROM "TrainingSplit"
         WHERE "clientId" IN (${ph}) AND "status" = 'ACTIVE'::"PlanStatus"`,
        ids
      )
      const workoutTodayRes = await tx.query<{ clientId: string }>(
        `SELECT DISTINCT "clientId" FROM "ExerciseLog"
         WHERE "clientId" IN (${ph}) AND "date" >= $${ids.length + 1}`,
        [...ids, today]
      )
      const checkinTodayRes = await tx.query<{ clientId: string }>(
        `SELECT DISTINCT "clientId" FROM "DailyLog"
         WHERE "clientId" IN (${ph}) AND "date" >= $${ids.length + 1}
           AND ("energyLevel" IS NOT NULL OR "sleepHours" IS NOT NULL
                OR "moodLevel" IS NOT NULL OR ("notes" IS NOT NULL AND "notes" != ''))`,
        [...ids, today]
      )
      const inbodyRes = await tx.query<{ clientId: string; lastDate: Date }>(
        `SELECT "clientId", MAX("date") AS "lastDate" FROM "BodyComposition"
         WHERE "clientId" IN (${ph}) GROUP BY "clientId"`,
        ids
      )
      const lastActivityRes = await tx.query<{ clientId: string; lastDate: Date }>(
        `SELECT "clientId", MAX("date") AS "lastDate" FROM "ExerciseLog"
         WHERE "clientId" IN (${ph}) GROUP BY "clientId"`,
        ids
      )

      const hasSplit = new Set(
        (activeSplitRes.rows as { clientId: string }[]).map((r) => r.clientId)
      )
      const workedToday = new Set(
        (workoutTodayRes.rows as { clientId: string }[]).map((r) => r.clientId)
      )
      const checkedToday = new Set(
        (checkinTodayRes.rows as { clientId: string }[]).map((r) => r.clientId)
      )
      const lastInbody = new Map(
        (inbodyRes.rows as { clientId: string; lastDate: Date }[]).map((r) => [r.clientId, new Date(r.lastDate)])
      )
      const lastActivity = new Map(
        (lastActivityRes.rows as { clientId: string; lastDate: Date }[]).map((r) => [r.clientId, new Date(r.lastDate)])
      )

      // Trainer user lookup for weekly coach nudges (one query).
      const trainerIds = [...new Set(clients.map((c) => c.trainerId))]
      const tph = trainerIds.map((_, i) => `$${i + 1}`).join(",")
      const trainersRes = await tx.query<{ id: string; userId: string; fullName: string | null }>(
        `SELECT "id", "userId", "fullName" FROM "TrainerProfile" WHERE "id" IN (${tph})`,
        trainerIds
      )
      const trainerById = new Map(
        (trainersRes.rows as { id: string; userId: string }[]).map((r) => [r.id, r.userId])
      )
      const clientNameById = new Map<string, string | null>()
      const namesRes = await tx.query<{ id: string; fullName: string | null }>(
        `SELECT "id", "fullName" FROM "Client" WHERE "id" IN (${ph})`,
        ids
      )
      for (const r of namesRes.rows as { id: string; fullName: string | null }[]) {
        clientNameById.set(r.id, r.fullName)
      }

      for (const client of clients) {
        if (hasSplit.has(client.id) && !workedToday.has(client.id)) {
          await insertReminder(
            tx,
            {
              userId: client.userId,
              type: "WORKOUT_REMINDER",
              titleKey: "workoutReminderTitle",
              bodyKey: "workoutReminderBody",
              params: {},
              link: "/client/workout/today",
              dedupeKey: `rem:workout:${client.id}:${todayKey}`,
            },
            counters,
            "client"
          )
        }
        if (!checkedToday.has(client.id)) {
          await insertReminder(
            tx,
            {
              userId: client.userId,
              type: "CHECKIN_REMINDER",
              titleKey: "checkinReminderTitle",
              bodyKey: "checkinReminderBody",
              params: {},
              link: "/client/home",
              dedupeKey: `rem:checkin:${client.id}:${todayKey}`,
            },
            counters,
            "client"
          )
        }
        const lastBc = lastInbody.get(client.id)
        const staleDays = lastBc ? Math.floor((today.getTime() - lastBc.getTime()) / DAY_MS) : null
        if (staleDays === null || staleDays > 30) {
          await insertReminder(
            tx,
            {
              userId: client.userId,
              type: "PROGRESS_REMINDER",
              titleKey: "progressReminderTitle",
              bodyKey: "progressReminderBody",
              params: {},
              link: "/client/profile",
              dedupeKey: `rem:progress:${client.id}:${weekKey}`,
            },
            counters,
            "client"
          )
        }

        // Coach weekly nudge for clients inactive 5+ days (never-active
        // clients are covered by the needs-action feed instead).
        const lastAct = lastActivity.get(client.id)
        const inactiveDays = lastAct ? Math.floor((today.getTime() - lastAct.getTime()) / DAY_MS) : null
        if (inactiveDays !== null && inactiveDays >= 5) {
          await insertReminder(
            tx,
            {
              userId: trainerById.get(client.trainerId) ?? null,
              type: "CLIENT_INACTIVE",
              titleKey: "clientInactiveTitle",
              bodyKey: "clientInactiveBody",
              params: { name: clientNameById.get(client.id) ?? "", n: inactiveDays },
              link: `/clients/${client.id}`,
              dedupeKey: `inactive:${client.id}:${weekKey}`,
            },
            counters,
            "coach"
          )
        }
      }
    }

    return {
      ranAt,
      locked: true,
      expiredSubscriptions,
      clientReminders: counters.client,
      coachReminders: counters.coach,
    }
  })
}
