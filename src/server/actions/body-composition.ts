"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import { pool } from "@/lib/db"
import { BodyCompositionSource } from "@/lib/db/enums"
import { bodyCompositionSchema, parseBodyCompositionDate } from "@/lib/validations/body-composition"
import {
  createBodyComposition,
  updateBodyComposition,
  deleteBodyComposition,
} from "@/server/services/body-composition.service"
import { z } from "zod"

const createSchema = bodyCompositionSchema

export async function createBodyCompositionAction(
  clientId: string,
  formData: unknown
) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false, error: "Unauthorized" as const }

  const isClient = session.user.role === "CLIENT"
  const isTrainer = session.user.role === "TRAINER"
  const isAdmin = session.user.role === "ADMIN"

  // Permission: client can only create for own id, trainer for own clients, admin read only (but allow? spec says admin read)
  if (isClient && session.user.clientProfileId !== clientId) {
    return { ok: false, error: "Forbidden" as const }
  }
  if (isTrainer) {
    const clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id"=$1 AND "trainerId"=$2 LIMIT 1`, [clientId, session.user.trainerProfileId!])
    const client = clientRes.rows[0]
    if (!client) return { ok: false, error: "Forbidden" as const }
  }
  if (isAdmin) {
    return { ok: false, error: "Forbidden" as const }
  }

  const parsed = createSchema.safeParse(formData)
  if (!parsed.success) {
    return { ok: false, error: "Validation failed" as const, fieldErrors: parsed.error.flatten().fieldErrors }
  }
  const date = parseBodyCompositionDate(parsed.data.date)
  if (!date) return { ok: false, error: "Invalid date" as const }

  const source = isClient ? BodyCompositionSource.CLIENT : BodyCompositionSource.COACH

  const created = await createBodyComposition(clientId, {
    date,
    source,
    weightKg: parsed.data.weightKg ?? null,
    muscleMassKg: parsed.data.muscleMassKg ?? null,
    bodyFatKg: parsed.data.bodyFatKg ?? null,
    bodyWaterPct: parsed.data.bodyWaterPct ?? null,
    fatControlKg: parsed.data.fatControlKg ?? null,
    bmrKcal: parsed.data.bmrKcal ?? null,
    fitnessScore: parsed.data.fitnessScore ?? null,
    waistHipRatio: parsed.data.waistHipRatio ?? null,
    visceralFatLevel: parsed.data.visceralFatLevel ?? null,
    notes: parsed.data.notes ?? null,
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=body-composition`)
  revalidatePath(`/client/profile`)
  revalidatePath(`/client/home`)
  return { ok: true as const, data: created }
}

export async function updateBodyCompositionAction(
  clientId: string,
  entryId: string,
  formData: unknown
) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false, error: "Unauthorized" as const }

  const isClient = session.user.role === "CLIENT"
  const isTrainer = session.user.role === "TRAINER"
  const isAdmin = session.user.role === "ADMIN"

  // Only coach can edit (including client entries), client cannot edit, admin read only
  if (isClient) return { ok: false, error: "Forbidden" as const }
  if (isAdmin) return { ok: false, error: "Forbidden" as const }
  if (isTrainer) {
    const clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id"=$1 AND "trainerId"=$2 LIMIT 1`, [clientId, session.user.trainerProfileId!])
    const client = clientRes.rows[0]
    if (!client) return { ok: false, error: "Forbidden" as const }
  }

  const parsed = bodyCompositionSchema.partial().safeParse(formData)
  if (!parsed.success) return { ok: false, error: "Validation failed" as const }

  const date = parsed.data.date ? parseBodyCompositionDate(parsed.data.date) : undefined
  if (parsed.data.date && !date) return { ok: false, error: "Invalid date" as const }

  const updated = await updateBodyComposition(entryId, clientId, {
    date: date ?? undefined,
    weightKg: parsed.data.weightKg,
    muscleMassKg: parsed.data.muscleMassKg,
    bodyFatKg: parsed.data.bodyFatKg,
    bodyWaterPct: parsed.data.bodyWaterPct,
    fatControlKg: parsed.data.fatControlKg,
    bmrKcal: parsed.data.bmrKcal,
    fitnessScore: parsed.data.fitnessScore,
    waistHipRatio: parsed.data.waistHipRatio,
    visceralFatLevel: parsed.data.visceralFatLevel,
    notes: parsed.data.notes,
  })

  revalidatePath(`/clients/${clientId}`)
  return { ok: true as const, data: updated }
}

export async function deleteBodyCompositionAction(clientId: string, entryId: string) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false, error: "Unauthorized" as const }

  const isClient = session.user.role === "CLIENT"
  const isTrainer = session.user.role === "TRAINER"
  const isAdmin = session.user.role === "ADMIN"

  // Only coach can delete ANY entry (including client entries)
  if (isClient) return { ok: false, error: "Forbidden" as const }
  if (isAdmin) return { ok: false, error: "Forbidden" as const }
  if (isTrainer) {
    const clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id"=$1 AND "trainerId"=$2 LIMIT 1`, [clientId, session.user.trainerProfileId!])
    const client = clientRes.rows[0]
    if (!client) return { ok: false, error: "Forbidden" as const }
  }

  await deleteBodyComposition(entryId, clientId)
  revalidatePath(`/clients/${clientId}`)
  return { ok: true as const }
}

export async function updateClientPainFlagsAction(
  clientId: string,
  data: { neckPain: boolean; shoulderPain: boolean; backPain: boolean; kneePain: boolean }
) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false, error: "Unauthorized" as const }

  const isClient = session.user.role === "CLIENT"
  const isTrainer = session.user.role === "TRAINER"
  const isAdmin = session.user.role === "ADMIN"

  if (isAdmin) return { ok: false, error: "Forbidden" as const }
  if (isClient && session.user.clientProfileId !== clientId) return { ok: false, error: "Forbidden" as const }
  if (isTrainer) {
    const clientRes = await pool.query(`SELECT "id" FROM "Client" WHERE "id"=$1 AND "trainerId"=$2 LIMIT 1`, [clientId, session.user.trainerProfileId!])
    const client = clientRes.rows[0]
    if (!client) return { ok: false, error: "Forbidden" as const }
  }

  const updatedRes = await pool.query(
    `UPDATE "Client" SET "neckPain"=$1, "shoulderPain"=$2, "backPain"=$3, "kneePain"=$4, "updatedAt"=NOW() WHERE "id"=$5 RETURNING *`,
    [data.neckPain, data.shoulderPain, data.backPain, data.kneePain, clientId]
  )
  const updated = updatedRes.rows[0]
  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/client/profile`)
  return { ok: true as const, data: updated }
}
