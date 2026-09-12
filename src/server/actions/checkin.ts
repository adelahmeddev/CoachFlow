"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import { checkInSchema } from "@/lib/validations/checkin"
import { saveCheckin } from "@/server/services/checkin.service"
import { getRecipientPair, notifySafe } from "@/server/services/notification.service"

function todayDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export async function saveCheckinAction(input: unknown) {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId
  if (!session?.user || session.user.role !== "CLIENT" || !clientId) {
    return { ok: false as const, error: "UNAUTHORIZED" }
  }

  const parsed = checkInSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const status = await saveCheckin(clientId, parsed.data)
  revalidatePath("/client/home")
  // One notification per client per day (dedupeKey) — edits don't re-notify.
  const pair = await getRecipientPair(clientId)
  if (pair?.trainerUserId) {
    await notifySafe({
      userId: pair.trainerUserId,
      type: "CHECKIN_ACTIVITY",
      titleKey: "checkinTitle",
      bodyKey: "checkinBody",
      params: {
        name: pair.clientName ?? "",
        energy: parsed.data.energyLevel,
        mood: parsed.data.moodLevel,
        sleep: parsed.data.sleepHours,
      },
      link: `/clients/${clientId}`,
      dedupeKey: `checkin:${clientId}:${todayDayKey()}`,
    })
  }
  return { ok: true as const, status }
}
