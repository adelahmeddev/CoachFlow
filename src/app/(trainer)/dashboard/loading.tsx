import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Header Skeleton */}
      <Skeleton className="h-44 w-full rounded-[24px]" />

      {/* 4 Stat Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Focus & Today Gym Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>

      {/* Needs Action & Recent Clients Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  )
}
