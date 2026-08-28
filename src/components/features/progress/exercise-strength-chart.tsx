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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/client"
import { formatDate } from "@/lib/i18n/format"

export interface ExerciseStrengthSeries {
  exerciseId: string
  name: string
  points: { date: string | Date; weightKg: number }[]
}

interface ExerciseStrengthChartProps {
  series: ExerciseStrengthSeries[]
}

export function ExerciseStrengthChart({ series }: ExerciseStrengthChartProps) {
  const { t, locale } = useI18n()
  const [selectedId, setSelectedId] = useState<string>(
    series[0]?.exerciseId ?? ""
  )

  const selected = useMemo(
    () => series.find((item) => item.exerciseId === selectedId) ?? null,
    [series, selectedId]
  )

  if (series.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t.progress.noExerciseLogs}
      </p>
    )
  }

  const data = (selected?.points ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .map((point) => ({
      date: formatDate(point.date, locale),
      value: point.weightKg,
    }))

  return (
    <div className="space-y-4">
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder={t.progress.selectExercise} />
        </SelectTrigger>
        <SelectContent>
          {series.map((item) => (
            <SelectItem key={item.exerciseId} value={item.exerciseId}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {data.length < 2 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t.progress.chartEmpty}
        </p>
      ) : (
        <div dir="ltr" className="h-56 w-full sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
                width={35}
                tick={{ fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                formatter={(value) => [`${Number(value)} kg`, selected?.name ?? ""]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--popover-foreground)",
                  boxShadow: "var(--shadow-glass)",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={selected?.name ?? ""}
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
