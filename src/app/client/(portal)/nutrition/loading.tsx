import { Skeleton } from "@/components/ui/skeleton"

export default function NutritionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Nutrition Plan Summary & Macros */}
      <Skeleton className="h-44 w-full rounded-[24px]" />

      {/* Meals list */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
