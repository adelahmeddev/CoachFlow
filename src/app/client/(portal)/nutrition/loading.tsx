"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function NutritionLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
