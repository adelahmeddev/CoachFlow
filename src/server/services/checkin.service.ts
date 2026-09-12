import { pool, generateId } from "@/lib/db"
import { calcStreak, isCheckInRow, toDayKey, type StreakResult } from "@/lib/checkin"
import type { CheckInInput } from "@/lib/validations/checkin"

export interface CheckinStatus extends StreakResult {
  today: {
    energyLevel: number | null
    sleepHours: number | null
    moodLevel: number | null
    note: string | null
  } | null
}

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

type DailyLogCheckinRow = {
  date: Date
  energyLevel: number | null
  sleepHours: number | null
  moodLevel: number | null
  notes: string | null
}

/**
 * Today's check-in + streak for one client. Two indexed queries max:
 * today's row, then recent day-keys for the streak window.
 */
export async function getCheckinStatus(clientId: string): Promise<CheckinStatus> {
  const today = utcMidnight(new Date())
  const todayRes = await pool.query<DailyLogCheckinRow>(
    `SELECT "date", "energyLevel", "sleepHours", "moodLevel", "notes"
     FROM "DailyLog" WHERE "clientId" = $1 AND "date" = $2 LIMIT 1`,
    [clientId, today]
  )
  const todayRow = (todayRes.rows[0] as DailyLogCheckinRow | undefined) ?? null

  const historyRes = await pool.query<DailyLogCheckinRow>(
    `SELECT "date", "energyLevel", "sleepHours", "moodLevel", "notes"
     FROM "DailyLog" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 400`,
    [clientId]
  )
  const dayKeys = (historyRes.rows as DailyLogCheckinRow[])
    .filter(isCheckInRow)
    .map((r) => toDayKey(new Date(r.date)))

  const streak = calcStreak(dayKeys, toDayKey(today))

  return {
    ...streak,
    today:
      todayRow && isCheckInRow({ ...todayRow, notes: todayRow.notes })
        ? {
            energyLevel: todayRow.energyLevel,
            sleepHours: todayRow.sleepHours,
            moodLevel: todayRow.moodLevel,
            note: todayRow.notes,
          }
        : null,
  }
}

/**
 * Save today's check-in. Upserts ONLY the check-in fields of today's
 * DailyLog row so weight/water/nutrition data logged elsewhere is preserved.
 */
export async function saveCheckin(
  clientId: string,
  input: CheckInInput
): Promise<CheckinStatus> {
  const today = utcMidnight(new Date())
  const existingRes = await pool.query<{ id: string }>(
    `SELECT "id" FROM "DailyLog" WHERE "clientId" = $1 AND "date" = $2 LIMIT 1`,
    [clientId, today]
  )
  const existing = existingRes.rows[0] as { id: string } | undefined
  const note = input.note?.trim() ? input.note.trim() : null

  if (existing) {
    await pool.query(
      `UPDATE "DailyLog" SET "energyLevel" = $1, "sleepHours" = $2, "moodLevel" = $3, "notes" = $4, "updatedAt" = NOW() WHERE "id" = $5`,
      [input.energyLevel, input.sleepHours, input.moodLevel, note, existing.id]
    )
  } else {
    await pool.query(
      `INSERT INTO "DailyLog" ("id", "clientId", "date", "energyLevel", "sleepHours", "moodLevel", "notes", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [generateId(), clientId, today, input.energyLevel, input.sleepHours, input.moodLevel, note]
    )
  }

  return getCheckinStatus(clientId)
}

export interface CoachCheckinOverview {
  checkedInToday: Array<{ id: string; fullName: string | null }>
  missing: Array<{ id: string; fullName: string | null; lastCheckIn: string | null }>
}

/**
 * Batched coach overview: which ACTIVE clients checked in today and who is
 * missing. Exactly 2 queries regardless of client count (no N+1).
 */
export async function getCoachCheckinOverview(
  trainerProfileId: string
): Promise<CoachCheckinOverview> {
  const today = utcMidnight(new Date())

  const clientsRes = await pool.query<{ id: string; fullName: string | null }>(
    `SELECT "id", "fullName" FROM "Client"
     WHERE "trainerId" = $1 AND "status" = 'ACTIVE'::"ClientStatus"
     ORDER BY "fullName" ASC NULLS LAST, "createdAt" DESC`,
    [trainerProfileId]
  )
  const clients = clientsRes.rows as { id: string; fullName: string | null }[]
  if (clients.length === 0) return { checkedInToday: [], missing: [] }

  const ids = clients.map((c) => c.id)
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",")
  // Latest check-in-bearing log per client, one GROUP BY query.
  const lastRes = await pool.query<{ clientId: string; lastDate: Date }>(
    `SELECT "clientId", MAX("date") AS "lastDate" FROM "DailyLog"
     WHERE "clientId" IN (${placeholders})
       AND ("energyLevel" IS NOT NULL OR "sleepHours" IS NOT NULL
            OR "moodLevel" IS NOT NULL OR ("notes" IS NOT NULL AND "notes" != ''))
     GROUP BY "clientId"`,
    ids
  )
  const lastByClient = new Map<string, string>()
  for (const row of lastRes.rows as { clientId: string; lastDate: Date }[]) {
    lastByClient.set(row.clientId, toDayKey(new Date(row.lastDate)))
  }

  const todayKey = toDayKey(today)
  const checkedInToday: CoachCheckinOverview["checkedInToday"] = []
  const missing: CoachCheckinOverview["missing"] = []
  for (const c of clients) {
    const last = lastByClient.get(c.id) ?? null
    if (last === todayKey) checkedInToday.push({ id: c.id, fullName: c.fullName })
    else missing.push({ id: c.id, fullName: c.fullName, lastCheckIn: last })
  }
  return { checkedInToday, missing }
}
