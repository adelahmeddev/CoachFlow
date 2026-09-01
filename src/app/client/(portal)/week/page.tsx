import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientWeekBoard } from "@/server/services/week.service"
import { WeekBoard } from "@/components/features/client/week/week-board"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientWeekPage() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const data = await getClientWeekBoard(clientId)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <WeekBoard
        mode={data.mode}
        board={data.board}
        summary={data.summary}
        rangeStartKey={data.rangeStartKey}
        rangeEndKey={data.rangeEndKey}
      />
    </div>
  )
}
