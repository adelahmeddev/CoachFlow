import { NextRequest, NextResponse } from "next/server"
import { getCurrentSession } from "@/server/auth"
import { getConversationById, getMessages } from "@/server/services/message.service"

export async function GET(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get("conversationId")
  const cursor = searchParams.get("cursor") ?? undefined
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 })

  const conv = await getConversationById(conversationId)
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // RBAC
  const role = session.user.role
  if (role === "TRAINER") {
    if (conv.trainerId !== session.user.trainerProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } else if (role === "CLIENT") {
    if (conv.client.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { messages, nextCursor } = await getMessages(conversationId, { cursor, take: 30 })
  return NextResponse.json({ messages, nextCursor })
}
