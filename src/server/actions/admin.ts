"use server"

import { revalidatePath } from "next/cache"
import { invalidate } from "@/lib/cache"
import { getCurrentSession } from "@/server/auth"
import {
  createTrainer,
  suspendCoach,
  activateCoach,
  getAdminCoachDetails,
} from "@/server/services/admin.service"
import {
  setCoachSubscription,
  extendCoachSubscription,
  setSubscriptionStatus,
} from "@/server/services/coach-subscription.service"
import { CoachSubscriptionStatus } from "@/lib/db/enums"
import { setCoachSubscriptionSchema } from "@/lib/validations/admin"

export async function adminCreateTrainerAction(input: unknown) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, code: "UNAUTHORIZED" as const }
  }

  const result = await createTrainer(input)
  if (!result.ok) {
    if ("fieldErrors" in result) {
      return { ok: false as const, fieldErrors: result.fieldErrors }
    }
    return { ok: false as const, code: result.code }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/trainers")
  invalidate(["admin:stats"])
  return { ok: true as const, userId: result.userId }
}

export async function adminSuspendCoachAction(coachId: string) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const suspended = await suspendCoach(coachId)
  if (!suspended) {
    return { ok: false as const, error: "COACH_NOT_FOUND" }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/trainers")
  revalidatePath(`/admin/trainers/${coachId}`)
  invalidate(["admin:stats", "admin:trainers"])
  return { ok: true as const }
}

export async function adminActivateCoachAction(coachId: string) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const activated = await activateCoach(coachId)
  if (!activated) {
    return { ok: false as const, error: "COACH_NOT_FOUND" }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/trainers")
  revalidatePath(`/admin/trainers/${coachId}`)
  invalidate(["admin:stats", "admin:trainers"])
  return { ok: true as const }
}

export async function adminGetCoachDetailsAction(coachId: string) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return null
  }

  return getAdminCoachDetails(coachId)
}

// ─── Simple manual subscription (admin only) ──────────────────────────────

export async function adminSetCoachSubscriptionAction(
  coachId: string,
  input: unknown
) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = setCoachSubscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "INVALID_INPUT", fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { startDate, durationDays, endDate, amountPaid, paymentDate, notes, status } = parsed.data

  // Server-side endDate calculation: if endDate not provided, calc from duration
  const finalEndDate = endDate ?? new Date(new Date(startDate).getTime() + (durationDays ?? 30) * 24 * 60 * 60 * 1000)

  try {
    const sub = await setCoachSubscription({
      coachId,
      startDate: new Date(startDate),
      endDate: finalEndDate,
      amountPaid: Number(amountPaid),
      paymentDate: new Date(paymentDate),
      notes: notes ?? null,
      status: (status as CoachSubscriptionStatus) ?? CoachSubscriptionStatus.ACTIVE,
    })
    revalidatePath(`/admin/trainers/${coachId}`)
    revalidatePath("/admin")
    revalidatePath("/admin/subscriptions")
    invalidate(["admin:stats"])
    return { ok: true as const, subscription: sub }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function adminExtendCoachSubscriptionAction(
  coachId: string,
  extendDays: number,
  extra?: { amountPaid?: number; paymentDate?: string; notes?: string }
) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }
  if (!Number.isFinite(extendDays) || extendDays <= 0 || extendDays > 365) {
    return { ok: false as const, error: "INVALID_DURATION" }
  }
  try {
    const sub = await extendCoachSubscription(
      coachId,
      extendDays,
      extra?.amountPaid,
      extra?.paymentDate ? new Date(extra.paymentDate) : undefined,
      extra?.notes ?? null
    )
    revalidatePath(`/admin/trainers/${coachId}`)
    revalidatePath("/admin")
    revalidatePath("/admin/subscriptions")
    invalidate(["admin:stats"])
    return { ok: true as const, subscription: sub }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function adminSetCoachSubscriptionStatusAction(
  coachId: string,
  status: string
) {
  const session = await getCurrentSession()
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }
  if (!Object.values(CoachSubscriptionStatus).includes(status as CoachSubscriptionStatus)) {
    return { ok: false as const, error: "INVALID_STATUS" }
  }
  try {
    const sub = await setSubscriptionStatus(coachId, status as CoachSubscriptionStatus)
    revalidatePath(`/admin/trainers/${coachId}`)
    revalidatePath("/admin/subscriptions")
    invalidate(["admin:stats"])
    return { ok: true as const, subscription: sub }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}
