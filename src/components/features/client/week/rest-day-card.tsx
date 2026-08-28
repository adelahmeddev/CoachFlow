"use client"

import { Droplets, Footprints, MoonStar, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

export function RestDayCard({ extraWorkout }: { extraWorkout?: boolean }) {
  const { t } = useI18n()

  const tips = [
    { icon: MoonStar, text: t.client.week.restTips.sleep },
    { icon: Droplets, text: t.client.week.restTips.water },
    { icon: Footprints, text: t.client.week.restTips.stretch },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-brand-500/10 to-brand-600/10 p-4 dark:from-brand-500/15 dark:to-brand-600/10">
        <span className="text-3xl" aria-hidden="true">
          💤
        </span>
        <div>
          <p className="font-semibold">{t.client.week.restDay}</p>
          <p className="text-sm text-muted-foreground">{t.client.week.recoveryTip}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {tips.map((tip) => (
          <li
            key={tip.text}
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-white/40 p-3 text-sm",
              "dark:bg-white/5"
            )}
          >
            <tip.icon className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <span>{tip.text}</span>
          </li>
        ))}
      </ul>

      {extraWorkout ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
          {t.client.week.extraWorkout}
        </p>
      ) : null}
    </div>
  )
}
