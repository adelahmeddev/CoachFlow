import { NextResponse } from "next/server"
import { getCurrentSession } from "@/server/auth"
import { countUnreadForTrainer, countUnreadForClient } from "@/server/services/message.service"

export async function GET() {
  const session = await getCurrentSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = session.user.role
  let count = 0
  if (role === "TRAINER") {
    const trainerId = session.user.trainerProfileId
    if (trainerId) count = await countUnreadForTrainer(trainerId)
  } else if (role === "CLIENT") {
    count = await countUnreadForClient(session.user.id)
  }

  return NextResponse.json({ count })
}
