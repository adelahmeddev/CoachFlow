"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/services/notification.service"

async function requireUserId() {
  const session = await getCurrentSession()
  if (!session?.user) return null
  if (session.user.role !== "COACH" && session.user.role !== "CLIENT") return null
  return session.user.id
}

export async function listNotificationsAction(cursor?: string | null, unreadOnly?: boolean) {
  const userId = await requireUserId()
  if (!userId) return { ok: false as const, error: "UNAUTHORIZED" }
  const page = await listNotifications(userId, { cursor: cursor ?? null, unreadOnly: !!unreadOnly })
  return { ok: true as const, ...page }
}

export async function markNotificationReadAction(notificationId: string) {
  const userId = await requireUserId()
  if (!userId) return { ok: false as const, error: "UNAUTHORIZED" }
  await markNotificationRead(userId, notificationId)
  revalidatePath("/notifications")
  revalidatePath("/client/notifications")
  return { ok: true as const }
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId()
  if (!userId) return { ok: false as const, error: "UNAUTHORIZED" }
  const marked = await markAllNotificationsRead(userId)
  revalidatePath("/notifications")
  revalidatePath("/client/notifications")
  return { ok: true as const, marked }
}
