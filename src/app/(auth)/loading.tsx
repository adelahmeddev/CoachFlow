"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function AuthLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-6 p-6">
        <Skeleton className="h-8 w-3/4 mx-auto rounded" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}
