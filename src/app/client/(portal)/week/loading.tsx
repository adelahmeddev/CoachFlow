"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function WeekLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-24 shrink-0" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
