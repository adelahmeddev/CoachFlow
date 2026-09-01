import { redirect } from "next/navigation"
import { getCurrentSession } from "@/server/auth"
import { getClientHomeData } from "@/server/services/client-portal.service"
import { GreetingCard } from "@/components/features/client/home/greeting-card"
import { TodayWorkoutCard } from "@/components/features/client/home/today-workout-card"
import { DailyChecklistCard } from "@/components/features/client/home/daily-checklist-card"
import { WeeklySummaryCard } from "@/components/features/client/home/weekly-summary-card"
import { QuickStatsRow } from "@/components/features/client/home/quick-stats-row"
import { TrainerMessageCard } from "@/components/features/client/home/trainer-message-card"
import { ProgressStatsRow } from "@/components/features/client/home/progress-stats-row"
import { SessionHistoryCard } from "@/components/features/client/home/session-history-card"

export default async function ClientHomePage() {
  const session = await getCurrentSession()
  const clientId = session?.user.clientProfileId

  if (!clientId) {
    redirect("/client/login")
  }

  const data = await getClientHomeData(clientId)

  if (!data) {
    redirect("/client/login")
  }

  const client = {
    id: data.client.id,
    fullName: data.client.fullName ?? "Client",
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <section
        className="w-full rounded-2xl bg-gradient-to-br from-brand-500 to-energy-500 p-6 text-center text-white"
      >
        <BrandLogo
          variant="mark"
          height={48}
          width={96}
          alt="NANOUSH"
          quality={95}
          className="mb-4 drop-shadow-2xl"
        />
        <h1 className="text-2xl font-extrabold tracking-tight">
          {isAr ? "اتصال ناجح — التصميم aktualisiert" : "Design Update Connected"}
        </h1>
        <p className="text-base mt-2">
          {isAr ? "تظهر التحديثات أعلاه" : "Updates appear above"}
        </p>
      </section>
      <GreetingCard client={client} streak={data.client.streak} />
      <TodayWorkoutCard workout={data.todayWorkout} />
    <QuickStatsRow
      workoutsDone={data.week.summary.done}
      workoutsPlanned={data.week.summary.planned}
      streak={data.client.streak}
      subscriptionStatus={data.subscription?.status ?? null}
    />
    {/* New Progress Stats */}
    <ProgressStatsRow
      currentWeight={data.progress.currentWeight}
      weightChange={data.progress.weightChange}
      totalWorkouts={data.progress.totalWorkouts}
      latestAdherence={data.progress.latestAdherence}
    />
      {data.latestTrainerNotes ? (
        <TrainerMessageCard notes={data.latestTrainerNotes} />
      ) : null}
      <DailyChecklistCard
        client={{
          streak: data.client.streak,
          hasWorkoutToday: data.todayWorkout.day !== null,
        }}
      />
    <WeeklySummaryCard
      entries={data.week.entries}
      planned={data.week.summary.planned}
      done={data.week.summary.done}
    />
    {/* Session History */}
    <SessionHistoryCard sessionHistory={data.progress.sessionHistory} />
    </div>
  )
}
