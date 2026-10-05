import { Skeleton } from "@/components/ui/skeleton"

export default function WorkoutTodayLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}
