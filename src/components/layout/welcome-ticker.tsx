"use client"

import {
  Sparkles,
  Dumbbell,
  Flame,
  Trophy,
  Droplets,
  Target,
  Apple,
  CalendarDays,
  Clock,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/client"

/**
 * Sticky welcome ticker riding at the bottom of the sticky site header.
 * Direction-aware marquee (right in RTL, left in LTR), pauses on hover,
 * honors prefers-reduced-motion via the animate-marquee utility.
 * Status pills use Lucide SVG icons — no raw Unicode emojis.
 */
export function WelcomeTicker({
  clientName,
  streak,
  waterLiters,
}: {
  clientName: string
  streak: number
  waterLiters?: number | null
}) {
  const { locale } = useI18n()
  const isAr = locale === "ar"

  const date = new Date().toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const pills = isAr
    ? [
        <span
          key="greet"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white/90"
        >
          <Sparkles className="size-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>أهلاً {clientName}</span>
          <span className="text-white/30">•</span>
          <span>جاهز للتمرين اليوم؟</span>
          <Dumbbell className="size-3.5 text-red-400 shrink-0" aria-hidden="true" />
        </span>,
        <span
          key="streak"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#961112]/25 border border-[#961112]/50 text-xs font-semibold text-red-200 shadow-[0_0_12px_rgba(150,17,18,0.3)]"
        >
          <Flame className="size-3.5 text-orange-400 fill-orange-400/20 shrink-0 animate-pulse" aria-hidden="true" />
          <span>
            الاستمرارية:{" "}
            <strong className="tabular-nums font-bold text-white">{streak}</strong>{" "}
            أيام متتالية
          </span>
          <Trophy className="size-3.5 text-amber-400 shrink-0" aria-hidden="true" />
        </span>,
        <span
          key="water"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-200"
        >
          <Droplets className="size-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
          <span>
            هدف المياه:{" "}
            <strong className="tabular-nums text-white">{waterLiters || 3}L</strong>
          </span>
          <span className="text-cyan-500/40">•</span>
          <Target className="size-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          <span>التزم بالماكروز</span>
          <Apple className="size-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
        </span>,
        <span
          key="date"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-300"
        >
          <CalendarDays className="size-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">{date}</span>
          <span className="text-white/20">•</span>
          <Clock className="size-3 text-neutral-500 shrink-0" aria-hidden="true" />
        </span>,
      ]
    : [
        <span
          key="greet"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white/90"
        >
          <Sparkles className="size-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Welcome, {clientName}</span>
          <span className="text-white/30">•</span>
          <span>Ready to train today?</span>
          <Dumbbell className="size-3.5 text-red-400 shrink-0" aria-hidden="true" />
        </span>,
        <span
          key="streak"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#961112]/25 border border-[#961112]/50 text-xs font-semibold text-red-200 shadow-[0_0_12px_rgba(150,17,18,0.3)]"
        >
          <Flame className="size-3.5 text-orange-400 fill-orange-400/20 shrink-0 animate-pulse" aria-hidden="true" />
          <span>
            Streak:{" "}
            <strong className="tabular-nums font-bold text-white">{streak}</strong>{" "}
            days
          </span>
          <Trophy className="size-3.5 text-amber-400 shrink-0" aria-hidden="true" />
        </span>,
        <span
          key="water"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-200"
        >
          <Droplets className="size-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
          <span>
            Water goal:{" "}
            <strong className="tabular-nums text-white">{waterLiters || 3}L</strong>
          </span>
          <span className="text-cyan-500/40">•</span>
          <Target className="size-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          <span>Hit your macros</span>
          <Apple className="size-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
        </span>,
        <span
          key="date"
          className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-300"
        >
          <CalendarDays className="size-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">{date}</span>
          <span className="text-white/20">•</span>
          <Clock className="size-3 text-neutral-500 shrink-0" aria-hidden="true" />
        </span>,
      ]

  return (
    <div
      role="marquee"
      aria-label={isAr ? "شريط الترحيب" : "Welcome ticker"}
      className="flex h-9 items-center overflow-hidden whitespace-nowrap border-b border-white/10 bg-background/70 text-xs font-medium text-foreground/80 backdrop-blur-md"
    >
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
        {[0, 1].map((half) => (
          <div key={half} aria-hidden={half === 1} className="flex shrink-0 items-center gap-2.5 px-2">
            {pills}
          </div>
        ))}
      </div>
    </div>
  )
}
