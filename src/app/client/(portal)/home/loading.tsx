import { Skeleton } from "@/components/ui/skeleton"

export default function ClientHomeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Coach & Welcome hero */}
      <Skeleton className="h-44 w-full rounded-[24px]" />

      {/* Today's Workout CTA */}
      <Skeleton className="h-32 w-full rounded-2xl" />

      {/* Daily Habits & Nutrition row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>

      {/* Recent Activity */}
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  )
}
