"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { formatDate } from "@/lib/format"
import type { BodyComposition } from "@/generated/prisma/client"

interface WeightProgressChartProps {
  bodyCompositions: BodyComposition[]
  // Back-compat: allow assessments prop
  assessments?: BodyComposition[]
}

export function WeightProgressChart({ bodyCompositions, assessments }: WeightProgressChartProps) {
  const list = bodyCompositions ?? assessments ?? []
  const data = list
    .filter((a) => a.weightKg !== null && a.weightKg !== undefined)
    .map((a) => ({
      date: formatDate((a as unknown as { date: Date }).date),
      weight: a.weightKg as number,
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
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)} kg`, "Weight"]}
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
            dataKey="weight"
            name="Weight (kg)"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
