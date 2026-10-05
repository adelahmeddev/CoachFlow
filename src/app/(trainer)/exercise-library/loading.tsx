import { Skeleton } from "@/components/ui/skeleton"

export default function ExerciseLibraryLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
