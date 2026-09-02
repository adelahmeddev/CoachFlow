"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  progressReviewSchema,
  workoutLogSchema,
  type ProgressReviewInput,
  type WorkoutLogInput,
} from "@/lib/validations/progress"
import {
  createProgressReview,
  createWorkoutLog,
  deleteWorkoutLog,
} from "@/server/services/progress.service"

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "COACH" &&
      session.user.trainerProfileId
  )
}

export async function createProgressReviewAction(
  clientId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = progressReviewSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const review = await createProgressReview(
    clientId,
    trainerProfileId,
    parsed.data as ProgressReviewInput
  )
  if (!review) {
    return { ok: false as const, error: "Client not found" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=progress`)
  invalidate([
    `client:${clientId}:progress`,
    `trainer:${trainerProfileId}:dashboard`,
    `trainer:${trainerProfileId}:clients`,
  ])
  return { ok: true as const }
}

export async function createWorkoutLogAction(
  clientId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = workoutLogSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const log = await createWorkoutLog(
    clientId,
    trainerProfileId,
    parsed.data as WorkoutLogInput
  )
  if (!log) {
    return { ok: false as const, error: "Client not found" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=progress`)
  invalidate([
    `client:${clientId}:progress`,
    `trainer:${trainerProfileId}:dashboard`,
    `trainer:${trainerProfileId}:clients`,
  ])
  return { ok: true as const }
}

export async function deleteWorkoutLogAction(
  clientId: string,
  logId: string
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const deleted = await deleteWorkoutLog(
    clientId,
    trainerProfileId,
    logId
  )
  if (!deleted) {
    return { ok: false as const, error: "Workout log not found" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=progress`)
  invalidate([
    `client:${clientId}:progress`,
    `trainer:${trainerProfileId}:dashboard`,
    `trainer:${trainerProfileId}:clients`,
  ])
  return { ok: true as const }
}