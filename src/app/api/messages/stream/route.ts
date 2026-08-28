import { getCurrentSession } from "@/server/auth"
import { getConversationById } from "@/server/services/message.service"
import { subscribe } from "@/server/realtime/message-bus"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getCurrentSession()
  if (!session?.user) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get("conversationId")
  if (!conversationId) return new Response("conversationId required", { status: 400 })

  const conv = await getConversationById(conversationId)
  if (!conv) return new Response("Not found", { status: 404 })

  const role = session.user.role
  if (role === "TRAINER") {
    if (conv.trainerId !== session.user.trainerProfileId) return new Response("Forbidden", { status: 403 })
  } else if (role === "CLIENT") {
    if (conv.client.userId !== session.user.id) return new Response("Forbidden", { status: 403 })
  } else {
    return new Response("Forbidden", { status: 403 })
  }

  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // heartbeat every 25s to keep connection alive
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {}
      }, 25000)

      // initial ping
      send({ type: "connected", conversationId })

      unsubscribe = subscribe(conversationId, (msg) => {
        send(msg)
      })

      // cleanup on abort
      // @ts-ignore
      req.signal?.addEventListener("abort", () => {
        clearInterval(hb)
        unsubscribe?.()
        try {
          controller.close()
        } catch {}
      })
    },
    cancel() {
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
