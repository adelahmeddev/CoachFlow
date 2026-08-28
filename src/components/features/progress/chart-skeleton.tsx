import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-64 w-full flex-col gap-4 rounded-[var(--radius-md)]",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-1 items-end gap-2 px-1 pb-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="flex-1"
            style={{
              height: `${40 + ((index * 13) % 55)}%`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
