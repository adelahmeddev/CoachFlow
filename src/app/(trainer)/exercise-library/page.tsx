import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { listExercisesForTrainer } from "@/server/services/exercise.service"
import { ExerciseLibrarySplitView } from "@/components/features/exercise-library/exercise-library-split-view"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

import { pool } from "@/lib/db"
import type { LibraryExercise } from "@/server/services/exercise.service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.exerciseLibrary.title,
    description: t.exerciseLibrary.subtitle,
  }
}

export default async function ExerciseLibraryPage() {
  const { t } = await getI18n()
  const session = await getCurrentSession()
  const trainerProfileId = session?.user.trainerProfileId

  if (!trainerProfileId || session?.user.role !== "COACH") {
    redirect("/dashboard")
  }

  let exercises: LibraryExercise[] = []
  try {
    exercises = await listExercisesForTrainer(trainerProfileId)
  } catch (err) {
    console.error("Failed to list cached exercises for trainer:", err)
  }

  // Robust fallback: if cache is empty or failed, fetch directly from DB
  if (!exercises || exercises.length === 0) {
    try {
      const res = await pool.query<LibraryExercise>(
        `SELECT e.id,
                COALESCE(o.name, e.name) AS name,
                COALESCE(o."nameAr", e."nameAr") AS "nameAr",
                COALESCE(o."muscleGroup", e."muscleGroup") AS "muscleGroup",
                e.equipment,
                e.tags,
                e."defaultSets",
                e."defaultReps",
                e."defaultRestSeconds",
                COALESCE(o."youtubeUrl", e."youtubeUrl") AS "youtubeUrl",
                (e."trainerId" IS NULL) AS "isGlobal",
                (o."exerciseId" IS NOT NULL) AS "isCustomized",
                COALESCE(o.hidden, false) AS "hidden"
         FROM "Exercise" e
         LEFT JOIN "ExerciseOverride" o ON o."exerciseId" = e.id AND o."trainerId" = $1
         WHERE (e."trainerId" IS NULL AND COALESCE(o.hidden, false) = false) OR e."trainerId" = $1
         ORDER BY COALESCE(o."muscleGroup", e."muscleGroup") ASC, name ASC`,
        [trainerProfileId]
      )
      if (res.rows && res.rows.length > 0) {
        exercises = res.rows
      }
    } catch (dbErr) {
      console.error("Direct query failed in ExerciseLibraryPage:", dbErr)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-8.5rem)] max-h-[calc(100dvh-7.5rem)] md:max-h-[calc(100dvh-8.5rem)] overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
          {t.exerciseLibrary.title}
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t.exerciseLibrary.subtitle}
        </p>
      </div>

      {/* Main Split View */}
      <ExerciseLibrarySplitView initialExercises={exercises} />
    </div>
  )
}
