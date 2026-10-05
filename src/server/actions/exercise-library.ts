"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import {
  createExercise,
  updateExercise,
  removeExercise,
  resetExercise,
  listHiddenExercises,
} from "@/server/services/exercise.service"
import {
  libraryExerciseSchema,
  type LibraryExerciseInput,
} from "@/lib/validations/exercise"

async function requireTrainer() {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    session.user.role !== "COACH" ||
    !session.user.trainerProfileId
  ) {
    throw new Error("UNAUTHORIZED")
  }
  return session.user.trainerProfileId
}

export async function createExerciseAction(input: unknown) {
  try {
    const trainerProfileId = await requireTrainer()
    const parsed = libraryExerciseSchema.safeParse(input)
    if (!parsed.success) {
      return {
        ok: false as const,
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const res = await createExercise(trainerProfileId, parsed.data)
    if (!res.ok) {
      return { ok: false as const, error: res.error }
    }

    revalidatePath("/exercise-library")
    return { ok: true as const, exercise: res.exercise }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to create exercise",
    }
  }
}

export async function updateExerciseAction(exerciseId: string, input: unknown) {
  try {
    const trainerProfileId = await requireTrainer()
    const parsed = libraryExerciseSchema.safeParse(input)
    if (!parsed.success) {
      return {
        ok: false as const,
        fieldErrors: parsed.error.flatten().fieldErrors,
      }
    }

    const res = await updateExercise(trainerProfileId, exerciseId, parsed.data)
    if (!res.ok) {
      return { ok: false as const, error: res.error }
    }

    revalidatePath("/exercise-library")
    return { ok: true as const }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to update exercise",
    }
  }
}

export async function removeExerciseAction(exerciseId: string) {
  try {
    const trainerProfileId = await requireTrainer()
    const res = await removeExercise(trainerProfileId, exerciseId)
    if (!res.ok) {
      return { ok: false as const, error: res.error }
    }

    revalidatePath("/exercise-library")
    return { ok: true as const }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to remove exercise",
    }
  }
}

export async function resetExerciseAction(exerciseId: string) {
  try {
    const trainerProfileId = await requireTrainer()
    const res = await resetExercise(trainerProfileId, exerciseId)
    if (!res.ok) {
      return { ok: false as const, error: res.error }
    }

    revalidatePath("/exercise-library")
    return { ok: true as const }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to reset exercise",
    }
  }
}

export async function getHiddenExercisesAction() {
  try {
    const trainerProfileId = await requireTrainer()
    const hidden = await listHiddenExercises(trainerProfileId)
    return { ok: true as const, hidden }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to fetch hidden exercises",
    }
  }
}
