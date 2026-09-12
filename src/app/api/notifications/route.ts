import { NextResponse } from "next/server"
import { getCurrentSession } from "@/server/auth"
import { listNotifications } from "@/server/services/notification.service"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const session = await getCurrentSession()
  if (
    !session?.user ||
    (session.user.role !== "COACH" && session.user.role !== "CLIENT")
  ) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = await listNotifications(session.user.id, {
    cursor: searchParams.get("cursor"),
    limit: 20,
    unreadOnly: searchParams.get("unread") === "1",
  })
  return NextResponse.json(page, {
    headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=10" },
  })
}
