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
  let closed = false
  let hb: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      let controllerRef: ReadableStreamDefaultController | null = controller

      const safeEnqueue = (chunk: Uint8Array) => {
        if (!closed && controllerRef) {
          try {
            controllerRef.enqueue(chunk)
          } catch {
            closed = true
            controllerRef = null
          }
        }
      }

      const send = (data: unknown) => {
        safeEnqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // heartbeat every 25s to keep connection alive
      hb = setInterval(() => {
        safeEnqueue(encoder.encode(`: heartbeat\n\n`))
      }, 25000)

      // initial ping
      send({ type: "connected", conversationId })

      unsubscribe = subscribe(conversationId, (msg) => {
        send(msg)
      })

      // cleanup on abort
      // @ts-ignore
      const abortHandler = () => {
        if (hb) clearInterval(hb)
        unsubscribe?.()
        if (!closed) {
          closed = true
          try {
            controllerRef?.close()
          } catch {}
        }
        controllerRef = null
      }
      // @ts-ignore
      req.signal?.addEventListener("abort", abortHandler)

      // also handle cancel via stream's cancel()
      return () => {
        abortHandler()
      }
    },
    cancel() {
      if (!closed) {
        closed = true
        if (hb) clearInterval(hb)
        unsubscribe?.()
      }
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
