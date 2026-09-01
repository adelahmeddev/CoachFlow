"use client"

import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { Flame, Sparkles, Calendar } from "lucide-react"

export function GreetingCard({
  client,
  streak = 0,
}: {
  client: { fullName: string }
  streak?: number
}) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const date = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? "صباح القوة" : hour < 18 ? "نهارك جامد" : "مساء الإنجاز"
  const greetingEn = hour < 12 ? "Morning Power" : hour < 18 ? "Strong Day" : "Evening Grind"

  return (
    <div className="relative overflow-hidden rounded-[20px] border bg-card shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.08] via-energy-500/[0.05] to-transparent" aria-hidden="true" />
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br from-brand-500/20 to-energy-500/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -left-10 -bottom-10 size-24 rounded-full bg-gradient-to-br from-performance-500/10 to-brand-500/5 blur-xl" aria-hidden="true" />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3 min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
              <Sparkles className="size-3.5" />
              <span>{isAr ? greetingKey : greetingEn}</span>
              <span className="size-1 rounded-full bg-brand-500/40" aria-hidden="true" />
              <span className="font-medium text-muted-foreground hidden sm:inline">{date}</span>
            </div>
            <h1 className="text-balance text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
              {lookup(t, "client.home.greeting")},{" "}
              <span className="bg-gradient-to-r from-brand-600 to-energy-600 bg-clip-text text-transparent">
                {client.fullName}
              </span>{" "}
              <span aria-hidden="true">{streak >= 7 ? "🔥" : streak >= 3 ? "💪" : "👋"}</span>
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
              <Calendar className="size-3" />
              {date}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {streak > 0
                ? isAr
                  ? `عامل ${streak} يوم متتالي — كمل يا وحش!`
                  : `${streak} day streak — keep it up!`
                : isAr
                  ? "جاهز تكسّر النهاردة؟"
                  : "Ready to crush it today?"}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {streak > 0 ? (
              <div className="inline-flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-energy-500 to-brand-500 px-4 py-3 text-white shadow-soft ring-1 ring-white/20">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest opacity-90">
                  <Flame className="size-3.5 fill-white/20 animate-flame" />
                  {isAr ? "أيام متتالية" : "Streak"}
                </span>
                <span className="text-2xl font-extrabold tabular-nums leading-none">{streak}</span>
                <span className="text-[11px] opacity-80">{isAr ? "يوم 🔥" : "days"}</span>
              </div>
            ) : (
              <div className="inline-flex flex-col items-center gap-1 rounded-2xl border bg-muted/40 px-4 py-3">
                <span className="text-xs font-medium text-muted-foreground">{isAr ? "ابدأ السلسلة" : "Start streak"}</span>
                <span className="text-lg">🔥</span>
                <span className="text-[11px] text-muted-foreground">{isAr ? "أول يوم" : "day 1"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
