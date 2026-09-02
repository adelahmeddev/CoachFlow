"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  sessionLogSchema,
  type SessionLogInput,
} from "@/lib/validations/session-log"
import { createSessionLogs } from "@/server/services/session-log.service"

function isAuthorized(session: Awaited<ReturnType<typeof getCurrentSession>>) {
  return Boolean(
    session?.user &&
      session.user.role === "COACH" &&
      session.user.trainerProfileId
  )
}

export async function createSessionLogAction(
  clientId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!isAuthorized(session)) {
    return { ok: false as const, error: "Unauthorized" }
  }
  const trainerProfileId = session!.user!.trainerProfileId!

  const parsed = sessionLogSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const logs = await createSessionLogs(
    clientId,
    trainerProfileId,
    parsed.data as SessionLogInput
  )
  if (!logs) {
    return { ok: false as const, error: "Session could not be saved" }
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath(`/clients/${clientId}?tab=progress`)
  invalidate([
    `client:${clientId}:progress`,
    `client:${clientId}:workout`,
    `trainer:${trainerProfileId}:dashboard`,
    `trainer:${trainerProfileId}:clients`,
  ])
  return { ok: true as const }
}
