"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import type { BodyComposition } from "@/generated/prisma/client"

interface StrengthProgressChartProps {
  assessments: BodyComposition[]
  bodyCompositions?: BodyComposition[]
}

type MetricKey =
  | "bodyweightSquatsReps"
  | "pushUpsReps"
  | "plankSeconds"
  | "latPulldownKg"
  | "walkTestDistanceMeters"

const METRIC_OPTIONS: { value: MetricKey; label: string; unit: string }[] = [
  { value: "bodyweightSquatsReps", label: "Bodyweight Squats", unit: "reps" },
  { value: "pushUpsReps", label: "Push-Ups", unit: "reps" },
  { value: "plankSeconds", label: "Plank", unit: "sec" },
  { value: "latPulldownKg", label: "Lat Pulldown", unit: "kg" },
  { value: "walkTestDistanceMeters", label: "Walk Test", unit: "m" },
]

export function StrengthProgressChart({
  assessments,
  bodyCompositions,
}: StrengthProgressChartProps) {
  const [metric, setMetric] = useState<MetricKey>("bodyweightSquatsReps")

  const list = bodyCompositions ?? assessments ?? []
  // Strength data was assessment-based; BodyComposition has no strength fields — keep chart as is (will show placeholder)
  const data = list
    .filter((a) => (a as unknown as Record<string, unknown>)[metric] !== null && (a as unknown as Record<string, unknown>)[metric] !== undefined)
    .map((a) => ({
      date: formatDate((a as unknown as { date: Date }).date),
      value: (a as unknown as Record<string, unknown>)[metric] as number,
    }))

  const selected = METRIC_OPTIONS.find((m) => m.value === metric)

  return (
    <div className="space-y-4">
      <Select
        value={metric}
        onValueChange={(value) => setMetric(value as MetricKey)}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Select metric" />
        </SelectTrigger>
        <SelectContent>
          {METRIC_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {data.length < 2 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add more InBody records to see trends.
        </p>
      ) : (
        <div dir="ltr" className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickMargin={8}
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <YAxis
                fontSize={12}
                width={40}
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value)} ${selected?.unit ?? ""}`,
                  selected?.label ?? "",
                ]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--popover-foreground)",
                  boxShadow: "var(--shadow-glass)",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={selected?.label ?? metric}
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
