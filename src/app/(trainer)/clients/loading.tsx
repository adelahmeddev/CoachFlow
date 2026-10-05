import { Skeleton } from "@/components/ui/skeleton"

export default function ClientsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header and filters skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      {/* Clients grid/list skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
