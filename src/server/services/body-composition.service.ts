import { pool, generateId } from "@/lib/db"
import { BodyCompositionSource } from "@/lib/db/enums"
import type { BodyComposition } from "@/lib/db/types"

export interface BodyCompositionInput {
  date: Date
  source: BodyCompositionSource
  weightKg?: number | null
  muscleMassKg?: number | null
  bodyFatKg?: number | null
  bodyWaterPct?: number | null
  fatControlKg?: number | null
  bmrKcal?: number | null
  fitnessScore?: number | null
  waistHipRatio?: number | null
  visceralFatLevel?: number | null
  notes?: string | null
}

export async function getBodyCompositions(clientId: string): Promise<BodyComposition[]> {
  const res = await pool.query<BodyComposition>(
    `SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC`,
    [clientId]
  )
  return res.rows as BodyComposition[]
}

export async function getLatestBodyCompositions(clientId: string, take = 2): Promise<BodyComposition[]> {
  const res = await pool.query<BodyComposition>(
    `SELECT * FROM "BodyComposition" WHERE "clientId" = $1 ORDER BY "date" DESC LIMIT $2`,
    [clientId, take]
  )
  return res.rows as BodyComposition[]
}

export async function getBodyCompositionById(id: string, clientId: string): Promise<BodyComposition | null> {
  const res = await pool.query<BodyComposition>(
    `SELECT * FROM "BodyComposition" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [id, clientId]
  )
  return (res.rows[0] as BodyComposition) ?? null
}

export async function createBodyComposition(
  clientId: string,
  data: BodyCompositionInput
): Promise<BodyComposition> {
  const id = generateId()
  const res = await pool.query<BodyComposition>(
    `INSERT INTO "BodyComposition" ("id", "clientId", "date", "source", "weightKg", "muscleMassKg", "bodyFatKg", "bodyWaterPct", "fatControlKg", "bmrKcal", "fitnessScore", "waistHipRatio", "visceralFatLevel", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"BodyCompositionSource", $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
     RETURNING *`,
    [
      id,
      clientId,
      data.date,
      data.source,
      data.weightKg ?? null,
      data.muscleMassKg ?? null,
      data.bodyFatKg ?? null,
      data.bodyWaterPct ?? null,
      data.fatControlKg ?? null,
      data.bmrKcal ?? null,
      data.fitnessScore ?? null,
      data.waistHipRatio ?? null,
      data.visceralFatLevel ?? null,
      data.notes ?? null,
    ]
  )
  return res.rows[0] as BodyComposition
}

export async function updateBodyComposition(
  id: string,
  clientId: string,
  data: Partial<BodyCompositionInput>
): Promise<BodyComposition> {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.date !== undefined) {
    fields.push(`"date" = $${idx++}`)
    values.push(data.date)
  }
  if (data.source !== undefined) {
    fields.push(`"source" = $${idx++}::"BodyCompositionSource"`)
    values.push(data.source)
  }
  if (data.weightKg !== undefined) {
    fields.push(`"weightKg" = $${idx++}`)
    values.push(data.weightKg)
  }
  if (data.muscleMassKg !== undefined) {
    fields.push(`"muscleMassKg" = $${idx++}`)
    values.push(data.muscleMassKg)
  }
  if (data.bodyFatKg !== undefined) {
    fields.push(`"bodyFatKg" = $${idx++}`)
    values.push(data.bodyFatKg)
  }
  if (data.bodyWaterPct !== undefined) {
    fields.push(`"bodyWaterPct" = $${idx++}`)
    values.push(data.bodyWaterPct)
  }
  if (data.fatControlKg !== undefined) {
    fields.push(`"fatControlKg" = $${idx++}`)
    values.push(data.fatControlKg)
  }
  if (data.bmrKcal !== undefined) {
    fields.push(`"bmrKcal" = $${idx++}`)
    values.push(data.bmrKcal)
  }
  if (data.fitnessScore !== undefined) {
    fields.push(`"fitnessScore" = $${idx++}`)
    values.push(data.fitnessScore)
  }
  if (data.waistHipRatio !== undefined) {
    fields.push(`"waistHipRatio" = $${idx++}`)
    values.push(data.waistHipRatio)
  }
  if (data.visceralFatLevel !== undefined) {
    fields.push(`"visceralFatLevel" = $${idx++}`)
    values.push(data.visceralFatLevel)
  }
  if (data.notes !== undefined) {
    fields.push(`"notes" = $${idx++}`)
    values.push(data.notes)
  }

  fields.push(`"updatedAt" = NOW()`)

  const sql = `UPDATE "BodyComposition" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`
  values.push(id)

  const res = await pool.query<BodyComposition>(sql, values)
  return res.rows[0] as BodyComposition
}

export async function deleteBodyComposition(id: string, clientId: string): Promise<BodyComposition | null> {
  const existing = await pool.query<BodyComposition>(
    `SELECT * FROM "BodyComposition" WHERE "id" = $1 AND "clientId" = $2 LIMIT 1`,
    [id, clientId]
  )
  if (!existing.rows[0]) return null
  const res = await pool.query<BodyComposition>(`DELETE FROM "BodyComposition" WHERE "id" = $1 RETURNING *`, [id])
  return (res.rows[0] as BodyComposition) ?? null
}

export function calculateDelta(
  latest: Record<string, number | null | undefined>,
  previous: Record<string, number | null | undefined>,
  field: string
): number | null {
  const a = latest[field]
  const b = previous[field]
  if (a == null || b == null) return null
  return +(a - b).toFixed(2)
}

export const BODY_COMPOSITION_FIELDS = [
  "weightKg",
  "muscleMassKg",
  "bodyFatKg",
  "bodyWaterPct",
  "fatControlKg",
  "bmrKcal",
  "fitnessScore",
  "waistHipRatio",
  "visceralFatLevel",
] as const
