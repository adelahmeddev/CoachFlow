import Link from "next/link"
import { Pencil } from "lucide-react"
import type { TrainingSplit, TrainingSplitDay } from "@/lib/db/types"
import { ScheduleMode } from "@/lib/db/enums"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getI18n } from "@/lib/i18n"
import { lookup } from "@/lib/i18n/lookup"
import { getPlanStatusBadgeVariant, getPlanStatusLabel, SPLIT_TYPE_LABELS, DAY_FOCUS_LABELS } from "@/lib/constants"
import { TrainingSplitStatusButtons } from "@/components/features/training-split/training-split-status-buttons"

interface ActiveSplitCardProps {
  split: TrainingSplit & { days: TrainingSplitDay[] }
  clientId: string
}

export async function ActiveSplitCard({ split, clientId }: ActiveSplitCardProps) {
  const { t, locale } = await getI18n()
  const isAr = locale === "ar"
  const isFixed = split.scheduleMode !== ScheduleMode.SEQUENTIAL

  const focusEmoji: Record<string, string> = {
    CHEST: "💪", BACK: "🦾", SHOULDERS: "🏋️", ARMS: "💪", LEGS: "🦵", GLUTES: "🍑", CORE: "🔥", CARDIO: "❤️",
    PUSH: "🔥", PULL: "🦍", UPPER: "💥", LOWER: "🏋️", FULL_BODY: "⚡", REST: "😴", SHOULDERS_ARMS: "💪", CUSTOM: "✨", MOBILITY: "🧘",
  }

  return (
    <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-muscle-500/[0.04] via-brand-500/[0.02] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-muscle-500/20 to-transparent" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between border-b bg-muted/20">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-muscle-500 to-brand-500 text-white text-sm shadow-soft">
                {focusEmoji[split.splitType] ?? "🏋️"}
              </span>
              <h3 className="text-base font-extrabold tracking-tight">{SPLIT_TYPE_LABELS[split.splitType]}</h3>
              <Badge variant={getPlanStatusBadgeVariant(split.status)} className="rounded-full">
                {getPlanStatusLabel(split.status)}
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-white/80 dark:bg-white/10">
                {isFixed
                  ? t.trainingSplit.scheduleModeFixed
                  : t.trainingSplit.scheduleModeSequential}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-card border px-2.5 py-1 font-medium">
                <span className="size-1.5 rounded-full bg-muscle-500" />
                {split.daysPerWeek} {isAr ? "أيام / أسبوع" : "days/week"}
              </span>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <span className="hidden sm:inline">{isAr ? "برنامج نشط" : "Active program"}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-xl bg-card gap-1.5">
              <Link href={`/clients/${clientId}/training-split/${split.id}/edit`}>
                <Pencil className="size-3.5" />
                {isAr ? "تعديل" : "Edit"}
              </Link>
            </Button>
            <TrainingSplitStatusButtons
              clientId={clientId}
              splitId={split.id}
              currentStatus={split.status}
              className="flex items-center gap-2"
            />
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {split.days.map((day) => (
              <div
                key={day.id}
                className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-soft transition-all hover:shadow-medium hover:-translate-y-0.5 hover:border-muscle-200 dark:hover:border-muscle-900/30"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full bg-gradient-to-br from-muscle-500/10 to-brand-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                      <span className="size-1.5 rounded-full bg-brand-500" />
                      {isAr ? `اليوم ${day.dayNumber}` : `Day ${day.dayNumber}`}
                    </span>
                    {isFixed && day.weekday ? (
                      <Badge variant="outline" className="rounded-full px-2 text-[11px] bg-card">
                        {lookup(t, `trainingSplit.weekdays.${day.weekday}`)}
                      </Badge>
                    ) : null}
                    {!isFixed ? (
                      <Badge variant="outline" className="rounded-full px-2 text-[11px] bg-card">
                        {lookup(t, "trainingSplit.stepLabel")} {day.dayNumber}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-muscle-500 text-white text-sm shadow-soft">
                      {focusEmoji[day.focus] ?? "💪"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-tight">
                        {day.focus === "CUSTOM"
                          ? day.customFocus || "Custom"
                          : DAY_FOCUS_LABELS[day.focus]}
                      </p>
                      {day.notes ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{day.notes}</p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground/60">{isAr ? "بدون ملاحظات" : "no notes"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {split.notes ? (
            <p className="rounded-xl border bg-muted/20 p-3 text-sm leading-relaxed text-muted-foreground">{split.notes}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
