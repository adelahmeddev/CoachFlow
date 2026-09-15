"use server"

import { pool } from "@/lib/db"
import { getCurrentSession } from "@/server/auth"

export type SearchClientResult = {
  id: string
  fullName: string
  phone: string | null
  status: string
  goal: string | null
}

export type SearchTemplateResult = {
  id: string
  name: string
  type: "split" | "nutrition"
  detail?: string | null
}

export type SearchWorkspaceResult = {
  clients: SearchClientResult[]
  templates: SearchTemplateResult[]
}

export async function searchCoachWorkspaceAction(
  query: string
): Promise<{ ok: true; data: SearchWorkspaceResult } | { ok: false; error: string }> {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "COACH" && session.user.role !== "SUPER_ADMIN") ||
    !session.user.trainerProfileId
  ) {
    return { ok: false, error: "UNAUTHORIZED" }
  }

  const trainerProfileId = session.user.trainerProfileId
  const trimmed = query.trim()

  if (!trimmed) {
    return {
      ok: true,
      data: {
        clients: [],
        templates: [],
      },
    }
  }

  const searchPattern = `%${trimmed}%`

  try {
    const [clientsRes, splitsRes, nutritionRes] = await Promise.all([
      pool.query<SearchClientResult>(
        `SELECT "id", "fullName", "phone", "status", "goal"
         FROM "Client"
         WHERE "trainerId" = $1
           AND ("fullName" ILIKE $2 OR "phone" ILIKE $2)
         ORDER BY "createdAt" DESC
         LIMIT 8`,
        [trainerProfileId, searchPattern]
      ),
      pool.query<{ id: string; name: string; splitType: string }>(
        `SELECT "id", "name", "splitType"
         FROM "TrainingSplitTemplate"
         WHERE "trainerId" = $1
           AND "name" ILIKE $2
         ORDER BY "createdAt" DESC
         LIMIT 4`,
        [trainerProfileId, searchPattern]
      ),
      pool.query<{ id: string; name: string; calories: number | null }>(
        `SELECT "id", "name", "calories"
         FROM "NutritionTemplate"
         WHERE ("trainerId" = $1 OR "isGlobal" = true)
           AND "name" ILIKE $2
         ORDER BY "createdAt" DESC
         LIMIT 4`,
        [trainerProfileId, searchPattern]
      ),
    ])

    const templates: SearchTemplateResult[] = [
      ...splitsRes.rows.map((s) => ({
        id: s.id,
        name: s.name,
        type: "split" as const,
        detail: s.splitType,
      })),
      ...nutritionRes.rows.map((n) => ({
        id: n.id,
        name: n.name,
        type: "nutrition" as const,
        detail: n.calories ? `${n.calories} kcal` : null,
      })),
    ]

    return {
      ok: true,
      data: {
        clients: clientsRes.rows,
        templates,
      },
    }
  } catch (err) {
    console.error("[searchCoachWorkspaceAction] failed", err)
    return { ok: false, error: "SEARCH_FAILED" }
  }
}
