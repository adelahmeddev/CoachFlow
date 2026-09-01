import { NextResponse } from "next/server"
import { getCurrentSession } from "@/server/auth"
import { countUnreadForTrainer, countUnreadForClient } from "@/server/services/message.service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await getCurrentSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = session.user.role
  let count = 0
  try {
    if (role === "TRAINER") {
      const trainerId = session.user.trainerProfileId
      if (trainerId) count = await countUnreadForTrainer(trainerId)
    } else if (role === "CLIENT") {
      count = await countUnreadForClient(session.user.id)
    }
  } catch (err) {
    console.error("[unread-count] failed, returning 0", err)
    count = 0
  }

  // Browser cache 5s + server in-memory 10s (see message.service) => polling every 30s
  // hits DB at most once per 10s instead of every request. Also reduces
  // "Compiling /api/messages/unread-count" noise: response is instant after warmup.
  return NextResponse.json({ count }, {
    headers: {
      "Cache-Control": "private, max-age=5, stale-while-revalidate=10",
    },
  })
}
