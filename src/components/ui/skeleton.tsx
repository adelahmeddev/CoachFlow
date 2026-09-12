import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "shimmer rounded-[var(--radius-md)] bg-muted dark:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function SkeletonText({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-text"
      className={cn("shimmer h-3 rounded-full bg-muted dark:bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCircle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton-circle"
      className={cn(
        "shimmer size-10 shrink-0 rounded-full bg-muted dark:bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCircle }
