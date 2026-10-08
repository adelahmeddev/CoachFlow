"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Globe, Dumbbell, PieChart as PieChartIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/client"

interface CoachingModePieChartProps {
  onlineCount: number
  inPersonCount: number
}

const COLORS = {
  online: "#3b82f6",   // Blue 500
  inPerson: "#10b981", // Emerald 500
}

export function CoachingModePieChart({
  onlineCount,
  inPersonCount,
}: CoachingModePieChartProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const safeOnline = Number.isFinite(onlineCount) ? onlineCount : 0
  const safeInPerson = Number.isFinite(inPersonCount) ? inPersonCount : 0
  const total = safeOnline + safeInPerson

  const onlinePct = total > 0 ? Math.round((safeOnline / total) * 100) : 0
  const inPersonPct = total > 0 ? 100 - onlinePct : 0

  const data = [
    {
      name: isAr ? "أونلاين (Online)" : "Online",
      value: safeOnline,
      color: COLORS.online,
    },
    {
      name: isAr ? "حضوري (In-Person)" : "In-Person",
      value: safeInPerson,
      color: COLORS.inPerson,
    },
  ]

  return (
    <Card className="overflow-hidden border bg-card shadow-soft">
      <CardHeader className="py-4 border-b bg-gradient-to-r from-brand-500/[0.04] to-transparent">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-soft">
              <PieChartIcon className="size-4" />
            </span>
            <CardTitle className="min-w-0 flex-1 break-words text-sm font-bold tracking-tight">
              {isAr ? "توزيع نظام التدريب (أونلاين / حضوري)" : "Coaching Mode (Online vs In-Person)"}
            </CardTitle>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">
            {total} {isAr ? "متدرب" : "total"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
              <PieChartIcon className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {isAr ? "لا يوجد متدربين بعد" : "No athletes yet"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[28ch]">
              {isAr
                ? "بمجرد إضافة متدربين سيظهر هنا توزيع الأونلاين والحضوري"
                : "Add athletes to see your Online vs In-Person breakdown"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Donut / Pie Chart */}
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={total > 0 && safeOnline > 0 && safeInPerson > 0 ? 4 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${value} ${isAr ? "متدرب" : "athletes"}`,
                      "",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total label */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tabular-nums leading-none text-foreground">
                  {total}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isAr ? "إجمالي" : "Athletes"}
                </span>
              </div>
            </div>

            {/* Breakdown Legend Cards */}
            <div className="grid w-full flex-1 grid-cols-1 gap-2.5">
              {/* Online */}
              <div className="flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                    <Globe className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {isAr ? "تدريب أونلاين" : "Online Coaching"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {onlinePct}% {isAr ? "من المتدربين" : "of athletes"}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-lg font-black tabular-nums text-blue-500">
                    {safeOnline}
                  </span>
                  <span className="block text-[10px] font-semibold text-muted-foreground">
                    {isAr ? "متدرب" : "athletes"}
                  </span>
                </div>
              </div>

              {/* In-Person */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
                    <Dumbbell className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {isAr ? "تدريب حضوري" : "In-Person Coaching"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {inPersonPct}% {isAr ? "من المتدربين" : "of athletes"}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-lg font-black tabular-nums text-emerald-500">
                    {safeInPerson}
                  </span>
                  <span className="block text-[10px] font-semibold text-muted-foreground">
                    {isAr ? "متدرب" : "athletes"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
