import { NextResponse } from "next/server"
import { getCurrentSession } from "@/server/auth"
import { countUnreadNotifications } from "@/server/services/notification.service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "COACH" && session.user.role !== "CLIENT")
  ) {
    return NextResponse.json({ count: 0 }, { status: 401 })
  }

  try {
    const count = await countUnreadNotifications(session.user.id)
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=10" } }
    )
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
