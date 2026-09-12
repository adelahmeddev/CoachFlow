"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Flame, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/client"
import { interpolate } from "@/lib/i18n/format"
import { saveCheckinAction } from "@/server/actions/checkin"
import type { CheckinStatus } from "@/server/services/checkin.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { motion } from "@/components/motion"
import { haptics } from "@/lib/haptics"
import { CelebrationBurst } from "@/components/ui/celebration-burst"

function ScalePicker({
  value,
  onChange,
  low,
  high,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  low: string
  high: string
  ariaLabel: string
}) {
  return (
    <div>
      <div className="flex gap-1.5" role="radiogroup" aria-label={ariaLabel}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            role="radio"
            whileTap={{ scale: 0.91 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            aria-checked={value === n}
            aria-label={`${n}`}
            onClick={() => {
              haptics.selection()
              onChange(n)
            }}
            className={cn(
              "flex h-11 flex-1 items-center justify-center rounded-xl border text-base font-bold tabular-nums transition-colors",
              value === n
                ? "border-brand-500 bg-brand-500 text-white shadow-soft"
                : "border-border bg-card text-muted-foreground hover:border-brand-300 hover:text-foreground"
            )}
          >
            {n}
          </motion.button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

function motivation(streak: number, t: { level1: string; level3: string; level7: string; level30: string }): string | null {
  if (streak >= 30) return t.level30
  if (streak >= 7) return t.level7
  if (streak >= 3) return t.level3
  if (streak >= 1) return t.level1
  return null
}

export function CheckinCard({ initial }: { initial: CheckinStatus }) {
  const { t } = useI18n()
  const [status, setStatus] = useState<CheckinStatus>(initial)
  const [energy, setEnergy] = useState(initial.today?.energyLevel ?? 3)
  const [mood, setMood] = useState(initial.today?.moodLevel ?? 3)
  const [sleep, setSleep] = useState(
    initial.today?.sleepHours != null ? String(initial.today.sleepHours) : ""
  )
  const [note, setNote] = useState(initial.today?.note ?? "")
  const [pending, startTransition] = useTransition()
  const [showCelebration, setShowCelebration] = useState(false)

  function onSubmit() {
    const sleepNum = sleep.trim() === "" ? 0 : Number(sleep)
    if (Number.isNaN(sleepNum) || sleepNum < 0 || sleepNum > 24) {
      toast.error(t.toasts.error)
      return
    }
    startTransition(async () => {
      const result = await saveCheckinAction({
        energyLevel: energy,
        sleepHours: sleepNum,
        moodLevel: mood,
        note,
      })
      if (result.ok) {
        setStatus(result.status)
        setShowCelebration(true)
        haptics.success()
        toast.success(t.checkin.doneTitle)
      } else {
        toast.error(t.toasts.error)
      }
    })
  }

  const msg = motivation(status.current, t.checkin)

  return (
    <>
      {showCelebration && <CelebrationBurst onComplete={() => setShowCelebration(false)} />}
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-brand-500/[0.06] to-transparent py-4 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold min-w-0 flex-1">{t.checkin.title}</CardTitle>
            {status.current > 0 ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-soft transition-transform",
                  status.current >= 7
                    ? "bg-gradient-to-r from-energy-500 via-amber-500 to-brand-500 text-white animate-streak-radiance"
                    : "bg-energy-500/10 text-energy-700 dark:text-energy-300"
                )}
              >
                <Flame className={cn("size-3.5", status.current >= 3 && "animate-flame")} />
                {interpolate(t.checkin.streakDays, { n: status.current })}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t.checkin.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {status.checkedInToday ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-3 rounded-xl border border-performance-500/30 bg-performance-500/5 p-3"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-performance-600 animate-checkmark" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{t.checkin.doneTitle}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.checkin.doneSubtitle}</p>
                {msg ? <p className="mt-1 text-xs font-medium">{msg}</p> : null}
              </div>
            </motion.div>
          ) : null}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold">{t.checkin.energy}</p>
          <ScalePicker value={energy} onChange={setEnergy} low={t.checkin.energyLow} high={t.checkin.energyHigh} ariaLabel={t.checkin.energy} />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold">{t.checkin.mood}</p>
          <ScalePicker value={mood} onChange={setMood} low={t.checkin.energyLow} high={t.checkin.energyHigh} ariaLabel={t.checkin.mood} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkin-sleep" className="text-xs font-semibold">
            {t.checkin.sleep}
          </label>
          <input
            id="checkin-sleep"
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="7.5"
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-base tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="checkin-note" className="text-xs font-semibold">
            {t.checkin.note}
          </label>
          <Textarea
            id="checkin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.checkin.notePlaceholder}
            rows={2}
            maxLength={500}
          />
        </div>

        <Button onClick={onSubmit} disabled={pending} className="w-full rounded-xl">
          {pending ? <Loader2 className="size-4 animate-spin me-2" /> : null}
          {status.checkedInToday ? t.checkin.update : t.checkin.submit}
        </Button>
      </CardContent>
    </Card>
  </>
  )
}
