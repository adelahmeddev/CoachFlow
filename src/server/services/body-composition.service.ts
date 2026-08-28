import { prisma } from "@/lib/prisma"
import { BodyCompositionSource } from "@/generated/prisma/enums"

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

export async function getBodyCompositions(clientId: string) {
  return prisma.bodyComposition.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
  })
}

export async function getLatestBodyCompositions(clientId: string, take = 2) {
  return prisma.bodyComposition.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
    take,
  })
}

export async function getBodyCompositionById(id: string, clientId: string) {
  return prisma.bodyComposition.findFirst({ where: { id, clientId } })
}

export async function createBodyComposition(
  clientId: string,
  data: BodyCompositionInput
) {
  return prisma.bodyComposition.create({
    data: {
      clientId,
      date: data.date,
      source: data.source,
      weightKg: data.weightKg ?? null,
      muscleMassKg: data.muscleMassKg ?? null,
      bodyFatKg: data.bodyFatKg ?? null,
      bodyWaterPct: data.bodyWaterPct ?? null,
      fatControlKg: data.fatControlKg ?? null,
      bmrKcal: data.bmrKcal ?? null,
      fitnessScore: data.fitnessScore ?? null,
      waistHipRatio: data.waistHipRatio ?? null,
      visceralFatLevel: data.visceralFatLevel ?? null,
      notes: data.notes ?? null,
    },
  })
}

export async function updateBodyComposition(
  id: string,
  clientId: string,
  data: Partial<BodyCompositionInput>
) {
  return prisma.bodyComposition.update({
    where: { id },
    data: {
      date: data.date,
      weightKg: data.weightKg,
      muscleMassKg: data.muscleMassKg,
      bodyFatKg: data.bodyFatKg,
      bodyWaterPct: data.bodyWaterPct,
      fatControlKg: data.fatControlKg,
      bmrKcal: data.bmrKcal,
      fitnessScore: data.fitnessScore,
      waistHipRatio: data.waistHipRatio,
      visceralFatLevel: data.visceralFatLevel,
      notes: data.notes,
    },
  })
}

export async function deleteBodyComposition(id: string, clientId: string) {
  // ensure belongs to client
  const existing = await prisma.bodyComposition.findFirst({ where: { id, clientId } })
  if (!existing) return null
  return prisma.bodyComposition.delete({ where: { id } })
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
