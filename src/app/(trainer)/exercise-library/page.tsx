import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { listExercisesForTrainer } from "@/server/services/exercise.service"
import { ExerciseLibraryTable } from "@/components/features/exercise-library/exercise-library-table"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

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

  const exercises = await listExercisesForTrainer(trainerProfileId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t.exerciseLibrary.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.exerciseLibrary.subtitle}
        </p>
      </div>

      {/* Main library table */}
      <ExerciseLibraryTable initialExercises={exercises} />
    </div>
  )
}
