import { pool } from "@/lib/db"
import { withCache } from "@/lib/cache"

export async function listGlobalExercises() {
  return withCache(
    async () => {
      const res = await pool.query(
        `SELECT "id", "name", "nameAr", "muscleGroup", "equipment", "tags", "defaultSets", "defaultReps", "defaultRestSeconds", "youtubeUrl"
         FROM "Exercise"
         WHERE "isGlobal" = true
         ORDER BY "muscleGroup" ASC, "name" ASC`
      )
      return res.rows as {
        id: string
        name: string
        nameAr: string | null
        muscleGroup: string
        equipment: string | null
        tags: string[]
        defaultSets: number | null
        defaultReps: number | null
        defaultRestSeconds: number | null
        youtubeUrl: string | null
      }[]
    },
    ["exercises-global"],
    ["exercises"],
    3600
  )()
}
