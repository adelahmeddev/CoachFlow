import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] rounded-2xl border overflow-hidden animate-pulse">
      {/* Conversations sidebar */}
      <div className="w-80 border-r p-4 space-y-3 hidden md:block">
        <Skeleton className="h-10 w-full rounded-xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat pane skeleton */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3 border-b pb-3">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-5 w-32 rounded" />
        </div>
        <div className="flex-1 space-y-3">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-16 w-80 rounded-2xl ml-auto" />
          <Skeleton className="h-10 w-48 rounded-2xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}
