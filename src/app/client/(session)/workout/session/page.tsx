import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getSessionWorkout } from "@/server/services/client-portal.service"
import { SessionMode } from "@/components/features/client/workout/session-mode"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientWorkoutSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ dayId?: string }>
}) {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const { dayId } = await searchParams
  const { workout, lastTime } = await getSessionWorkout(clientId, dayId)

  if (!workout.day || workout.exercises.length === 0) {
    redirect("/client/workout/today")
  }

  return <SessionMode workout={workout} lastTime={lastTime} />
}
