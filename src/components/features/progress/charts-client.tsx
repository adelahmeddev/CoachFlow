"use client"

import dynamic from "next/dynamic"
import { ChartSkeleton } from "@/components/features/progress/chart-skeleton"

export const WeightProgressChartLazy = dynamic(
  () =>
    import("@/components/features/progress/weight-progress-chart").then(
      (m) => m.WeightProgressChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const MeasurementsProgressChartLazy = dynamic(
  () =>
    import("@/components/features/progress/measurements-progress-chart").then(
      (m) => m.MeasurementsProgressChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const StrengthProgressChartLazy = dynamic(
  () =>
    import("@/components/features/progress/strength-progress-chart").then(
      (m) => m.StrengthProgressChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const ExerciseStrengthChartLazy = dynamic(
  () =>
    import("@/components/features/progress/exercise-strength-chart").then(
      (m) => m.ExerciseStrengthChart
    ),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
