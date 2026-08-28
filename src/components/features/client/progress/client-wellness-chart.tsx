"use client"

import { useMemo, useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Activity } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { formatDate } from "@/lib/i18n/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface DailyLogPoint {
  date: string // ISO string
  energyLevel: number | null
  moodLevel: number | null
  sleepHours: number | null
}

type Metric = "energy" | "mood" | "sleep"

const METRIC_CONFIG: Record<
  Metric,
  { color: string; domain: [number, number]; unit: string }
> = {
  energy: { color: "#f59e0b", domain: [1, 5], unit: "" },
  mood: { color: "#8b5cf6", domain: [1, 5], unit: "" },
  sleep: { color: "#06b6d4", domain: [0, 12], unit: "h" },
}

interface ClientWellnessChartProps {
  points: DailyLogPoint[]
}

export function ClientWellnessChart({ points }: ClientWellnessChartProps) {
  const { t, locale } = useI18n()
  const [metric, setMetric] = useState<Metric>("energy")

  const config = METRIC_CONFIG[metric]

  const labelMap: Record<Metric, string> = {
    energy: lookup(t, "client.home.energy"),
    mood: lookup(t, "client.home.mood"),
    sleep: lookup(t, "client.home.sleep"),
  }

  const data = useMemo(() => {
    return points
      .map((p) => {
        const value =
          metric === "energy"
            ? p.energyLevel
            : metric === "mood"
              ? p.moodLevel
              : p.sleepHours
        if (value == null) return null
        return { date: formatDate(p.date, locale), value }
      })
      .filter((p): p is { date: string; value: number } => p !== null)
  }, [points, metric, locale])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-brand-500" />
          <CardTitle>{lookup(t, "client.progress.wellness")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={metric}
          onValueChange={(v) => setMetric(v as Metric)}
        >
          <TabsList>
            <TabsTrigger value="energy">
              {lookup(t, "client.home.energy")}
            </TabsTrigger>
            <TabsTrigger value="mood">
              {lookup(t, "client.home.mood")}
            </TabsTrigger>
            <TabsTrigger value="sleep">
              {lookup(t, "client.home.sleep")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {data.length < 2 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {lookup(t, "client.progress.chartNotEnoughData")}
          </p>
        ) : (
          <div className="h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
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
                  width={30}
                  domain={config.domain}
                  tick={{ fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) =>
                    config.unit ? `${v}${config.unit}` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    config.unit
                      ? `${Number(value)}${config.unit}`
                      : String(value),
                    labelMap[metric],
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
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: config.color }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
