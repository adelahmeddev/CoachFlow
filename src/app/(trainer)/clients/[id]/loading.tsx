import { Skeleton } from "@/components/ui/skeleton"

export default function ClientProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Header */}
      <Skeleton className="h-48 w-full rounded-[24px]" />

      {/* Tabs navigation skeleton */}
      <div className="flex gap-2 border-b pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  )
}