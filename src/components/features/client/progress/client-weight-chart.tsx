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
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { formatDate } from "@/lib/i18n/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale } from "lucide-react"

export interface WeightDataPoint {
  date: string // ISO string
  weightKg: number
  source: "body-composition" | "daily-log" | "assessment"
}

interface ClientWeightChartProps {
  points: WeightDataPoint[]
}

export function ClientWeightChart({ points }: ClientWeightChartProps) {
  const { t, locale } = useI18n()

  if (points.length < 2) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-sky-500" />
            <CardTitle>{lookup(t, "client.progress.weight")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            {lookup(t, "client.progress.chartNotEnoughData")}
          </p>
        </CardContent>
      </Card>
    )
  }

  const data = points.map((p) => ({
    date: formatDate(p.date, locale),
    weight: p.weightKg,
  }))

  const min = Math.floor(Math.min(...points.map((p) => p.weightKg)) - 2)
  const max = Math.ceil(Math.max(...points.map((p) => p.weightKg)) + 2)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-sky-500" />
          <CardTitle>{lookup(t, "client.progress.weight")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                fontSize={10}
                tickMargin={8}
                tick={{ fill: "var(--muted-foreground)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                fontSize={10}
                width={42}
                domain={[min, max]}
                tick={{ fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `${v} kg`}
              />
              <Tooltip
                formatter={(value) => [
                  `${Number(value).toFixed(1)} kg`,
                  lookup(t, "client.progress.weight"),
                ]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--popover-foreground)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ r: 3, fill: "#0ea5e9" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
