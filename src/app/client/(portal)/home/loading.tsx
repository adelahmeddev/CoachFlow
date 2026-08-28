"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
