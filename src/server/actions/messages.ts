"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/server/auth"
import { sendMessageSchema } from "@/lib/validations/message"
import {
  sendMessage,
  markMessagesAsRead,
  getConversationById,
} from "@/server/services/message.service"

export async function sendMessageAction(input: unknown) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false as const, error: "Unauthorized" }

  const parsed = sendMessageSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().formErrors.join(", ") || "Invalid input" }
  }
  const { body, clientId, conversationId } = parsed.data
  const role = session.user.role
  const senderId = session.user.id

  if (role !== "TRAINER" && role !== "CLIENT") {
    return { ok: false as const, error: "Forbidden" }
  }

  try {
    let trainerId: string | undefined
    let clientUserId: string | undefined

    if (role === "TRAINER") {
      trainerId = session.user.trainerProfileId
      if (!trainerId) return { ok: false as const, error: "No trainer profile" }
    } else {
      clientUserId = senderId
    }

    const result = await sendMessage({
      trainerId,
      clientUserId,
      clientId,
      conversationId,
      senderId,
      senderRole: role,
      body,
    })

    // revalidate both sides
    revalidatePath("/messages")
    revalidatePath(`/messages/${result.conversationId}`)
    revalidatePath("/client/messages")
    if (clientId) revalidatePath(`/clients/${clientId}`)
    if (result.conversationId) {
      const conv = await getConversationById(result.conversationId)
      if (conv) {
        revalidatePath(`/messages/${conv.clientId}`)
      }
    }

    return { ok: true as const, conversationId: result.conversationId, messageId: result.message.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send"
    if (msg === "Forbidden" || msg === "Conversation not found" || msg === "Client not found") {
      return { ok: false as const, error: msg }
    }
    return { ok: false as const, error: "Failed to send message" }
  }
}

export async function markMessagesReadAction(conversationId: string) {
  const session = await getCurrentSession()
  if (!session?.user) return { ok: false as const, error: "Unauthorized" }
  const role = session.user.role
  if (role !== "TRAINER" && role !== "CLIENT") return { ok: false as const, error: "Forbidden" }

  const conv = await getConversationById(conversationId)
  if (!conv) return { ok: false as const, error: "Conversation not found" }

  // RBAC check
  if (role === "TRAINER") {
    if (conv.trainerId !== session.user.trainerProfileId) return { ok: false as const, error: "Forbidden" }
  } else {
    if (conv.client.userId !== session.user.id) return { ok: false as const, error: "Forbidden" }
  }

  await markMessagesAsRead(conversationId, session.user.id, role)
  revalidatePath("/messages")
  revalidatePath(`/messages/${conversationId}`)
  revalidatePath("/client/messages")
  return { ok: true as const }
}
