"use client"

import { useI18n } from "@/lib/i18n/client"
import { TodayWorkoutCard } from "@/components/features/client/home/today-workout-card"
import { DailyChecklistCard } from "@/components/features/client/home/daily-checklist-card"
import { WeeklySummaryCard } from "@/components/features/client/home/weekly-summary-card"
import { QuickStatsRow } from "@/components/features/client/home/quick-stats-row"
import { TrainerMessageCard } from "@/components/features/client/home/trainer-message-card"
import { ProgressStatsRow } from "@/components/features/client/home/progress-stats-row"
import { SessionHistoryCard } from "@/components/features/client/home/session-history-card"
import { DashboardActionCard } from "@/components/features/client/home/DashboardActionCard"

interface ClientHomeUIProps {
  client: {
    id: string
    fullName: string
  }
  data: {
    client: { streak: number }
    todayWorkout: any
    week: {
      summary: { done: number; planned: number }
      entries: any[]
    }
    subscription: { status: any } | null
    progress: {
      currentWeight: number | null
      weightChange: number | null
      totalWorkouts: number
      latestAdherence: string | null
      sessionHistory: any[]
    }
    latestTrainerNotes: string | null
  }
}

export function ClientHomeUI({ client, data }: ClientHomeUIProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <DashboardActionCard client={client} data={data} />
      <TodayWorkoutCard workout={data.todayWorkout} />
      <QuickStatsRow
        workoutsDone={data.week.summary.done}
        workoutsPlanned={data.week.summary.planned}
        streak={data.client.streak}
        subscriptionStatus={data.subscription?.status ?? null}
      />
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
      <SessionHistoryCard sessionHistory={data.progress.sessionHistory} />
    </div>
  )
}