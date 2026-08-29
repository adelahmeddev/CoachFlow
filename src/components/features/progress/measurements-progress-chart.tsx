"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { formatDate } from "@/lib/format"
import type { BodyComposition } from "@/lib/db/types"

interface MeasurementsProgressChartProps {
  bodyCompositions: BodyComposition[]
  // Back-compat
  assessments?: BodyComposition[]
}

export function MeasurementsProgressChart({
  bodyCompositions,
  assessments,
}: MeasurementsProgressChartProps) {
  const list = bodyCompositions ?? assessments ?? []
  const data = list
    .filter(
      (a) =>
        (a.bodyFatKg !== null && a.bodyFatKg !== undefined) ||
        (a.waistHipRatio !== null && a.waistHipRatio !== undefined)
    )
    .map((a) => ({
      date: formatDate((a as unknown as { date: Date }).date),
      bodyFat: a.bodyFatKg as number | null,
      waistHipRatio: a.waistHipRatio as number | null,
    }))

  if (data.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Add more InBody records to see trends.
      </p>
    )
  }

  return (
    <div dir="ltr" className="h-64 sm:h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            fontSize={10}
            tickMargin={8}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <YAxis
            fontSize={10}
            width={40}
            tick={{ fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            formatter={(value, name) => {
              const n = String(name)
              if (n.includes("Ratio")) return `${Number(value).toFixed(2)}`
              return `${Number(value).toFixed(1)} kg`
            }}
            contentStyle={{
              backgroundColor: "var(--popover)",
              borderColor: "var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--popover-foreground)",
              boxShadow: "var(--shadow-glass)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="bodyFat"
            name="Body Fat (kg)"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="waistHipRatio"
            name="Waist-Hip Ratio"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
