import { Skeleton } from "@/components/ui/skeleton"

export default function ExerciseLibraryLoading() {
  return (
    <div className="flex flex-col gap-4 flex-1 h-full min-h-0">
      <div className="space-y-1.5 shrink-0">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      {/* Split View Skeleton */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-[520px] h-[calc(100vh-13rem)] rounded-2xl border border-border/80 bg-card overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 border-e border-border/80 flex-col p-3 space-y-2 bg-card/60">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl mt-2" />
          <div className="space-y-1.5 pt-2 flex-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-9 w-full rounded-xl shrink-0" />
        </div>

        {/* Panel skeleton */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          <div className="p-4 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-2xl" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-36 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>

          <div className="p-3 border-b border-border/60 flex items-center justify-between">
            <Skeleton className="h-9 w-64 rounded-xl" />
            <Skeleton className="h-8 w-48 rounded-xl" />
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-12 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
