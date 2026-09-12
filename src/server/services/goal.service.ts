import { pool, generateId } from "@/lib/db"
import { GoalStatus, type GoalType } from "@/lib/db/enums"
import type { ClientGoal } from "@/lib/db/types"
import { goalProgress } from "@/lib/goals"
import type { GoalInput } from "@/lib/validations/goal"

export interface GoalWithProgress extends ClientGoal {
  /** Resolved current value (InBody-synced for auto types, stored otherwise). */
  resolvedCurrent: number | null
  progress: number | null
  autoSynced: boolean
}

async function assertClientOwnedByTrainer(clientId: string, trainerId: string) {
  const res = await pool.query(
    `SELECT "id", "trainerId" FROM "Client" WHERE "id" = $1 LIMIT 1`,
    [clientId]
  )
  const client = res.rows[0] as { id: string; trainerId: string } | undefined
  if (!client || client.trainerId !== trainerId) return null
  return client
}

type InBodyLatest = {
  weightKg: number | null
  bodyFatKg: number | null
  muscleMassKg: number | null
} | null

async function getLatestInBodyValues(clientId: string): Promise<InBodyLatest> {
  const res = await pool.query(
    `SELECT "weightKg", "bodyFatKg", "muscleMassKg" FROM "BodyComposition"
     WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT 1`,
    [clientId]
  )
  return (res.rows[0] as InBodyLatest | undefined) ?? null
}

function resolveGoal(goal: ClientGoal, inbody: InBodyLatest): GoalWithProgress {
  let resolvedCurrent = goal.currentValue
  let autoSynced = false
  if (goal.type === "WEIGHT" && inbody?.weightKg != null) {
    resolvedCurrent = inbody.weightKg
    autoSynced = true
  } else if (goal.type === "BODY_FAT" && inbody?.bodyFatKg != null) {
    resolvedCurrent = inbody.bodyFatKg
    autoSynced = true
  } else if (goal.type === "MUSCLE" && inbody?.muscleMassKg != null) {
    resolvedCurrent = inbody.muscleMassKg
    autoSynced = true
  }
  return {
    ...goal,
    resolvedCurrent,
    progress: goalProgress(goal.startValue, resolvedCurrent, goal.targetValue),
    autoSynced,
  }
}

/** All goals for a client (history intact — never deleted on new creation). */
export async function listGoalsForClient(clientId: string): Promise<GoalWithProgress[]> {
  const [goalsRes, inbody] = await Promise.all([
    pool.query<ClientGoal>(
      `SELECT * FROM "ClientGoal" WHERE "clientId" = $1 ORDER BY "createdAt" DESC`,
      [clientId]
    ),
    getLatestInBodyValues(clientId),
  ])
  return (goalsRes.rows as ClientGoal[]).map((g) => resolveGoal(g, inbody))
}

export async function listGoalsForClientOfTrainer(
  clientId: string,
  trainerId: string
): Promise<GoalWithProgress[] | null> {
  const owned = await assertClientOwnedByTrainer(clientId, trainerId)
  if (!owned) return null
  return listGoalsForClient(clientId)
}

export async function createGoal(
  clientId: string,
  trainerId: string,
  input: GoalInput
): Promise<ClientGoal | null> {
  const owned = await assertClientOwnedByTrainer(clientId, trainerId)
  if (!owned) return null
  const res = await pool.query<ClientGoal>(
    `INSERT INTO "ClientGoal" ("id", "clientId", "trainerId", "type", "title", "startValue", "currentValue", "targetValue", "unit", "deadline", "status", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"GoalType", $5, $6, $7, $8, $9, $10, 'ACTIVE'::"GoalStatus", NOW(), NOW())
     RETURNING *`,
    [
      generateId(),
      clientId,
      trainerId,
      input.type as GoalType,
      input.title.trim(),
      input.startValue ?? null,
      input.currentValue ?? null,
      input.targetValue,
      input.unit?.trim() ? input.unit.trim() : null,
      input.deadline,
    ]
  )
  return res.rows[0] as ClientGoal
}

export async function updateGoal(
  goalId: string,
  clientId: string,
  trainerId: string,
  input: GoalInput
): Promise<ClientGoal | null> {
  const owned = await assertClientOwnedByTrainer(clientId, trainerId)
  if (!owned) return null
  const res = await pool.query<ClientGoal>(
    `UPDATE "ClientGoal" SET "type" = $1::"GoalType", "title" = $2, "startValue" = $3,
       "currentValue" = $4, "targetValue" = $5, "unit" = $6, "deadline" = $7, "updatedAt" = NOW()
     WHERE "id" = $8 AND "clientId" = $9 RETURNING *`,
    [
      input.type as GoalType,
      input.title.trim(),
      input.startValue ?? null,
      input.currentValue ?? null,
      input.targetValue,
      input.unit?.trim() ? input.unit.trim() : null,
      input.deadline,
      goalId,
      clientId,
    ]
  )
  return (res.rows[0] as ClientGoal | undefined) ?? null
}

/** Status transitions only (ACHIEVED/PAUSED/CANCELLED/ACTIVE) — rows are kept. */
export async function setGoalStatus(
  goalId: string,
  clientId: string,
  trainerId: string,
  status: GoalStatus
): Promise<ClientGoal | null> {
  const owned = await assertClientOwnedByTrainer(clientId, trainerId)
  if (!owned) return null
  const res = await pool.query<ClientGoal>(
    `UPDATE "ClientGoal" SET "status" = $1::"GoalStatus", "updatedAt" = NOW()
     WHERE "id" = $2 AND "clientId" = $3 RETURNING *`,
    [status, goalId, clientId]
  )
  return (res.rows[0] as ClientGoal | undefined) ?? null
}

/** Nearest ACTIVE goal deadline per client (batched — for needs-action). */
export async function getActiveGoalDeadlines(
  clientIds: string[]
): Promise<Map<string, { deadline: Date; title: string }>> {
  const out = new Map<string, { deadline: Date; title: string }>()
  if (clientIds.length === 0) return out
  const res = await pool.query<{ clientId: string; deadline: Date; title: string }>(
    `SELECT DISTINCT ON ("clientId") "clientId", "deadline", "title" FROM "ClientGoal"
     WHERE "clientId"::text = ANY($1)
       AND "status" = 'ACTIVE'::"GoalStatus" AND "deadline" IS NOT NULL
     ORDER BY "clientId", "deadline" ASC`,
    [clientIds]
  )
  for (const row of res.rows as { clientId: string; deadline: Date; title: string }[]) {
    out.set(row.clientId, { deadline: row.deadline, title: row.title })
  }
  return out
}
