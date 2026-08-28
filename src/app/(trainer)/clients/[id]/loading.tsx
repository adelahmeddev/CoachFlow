"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ClientDetailLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}