"use client"

import { Flame, CalendarCheck, Scale, TrendingDown, TrendingUp } from "lucide-react"
import { useI18n } from "@/lib/i18n/client"
import { CoachHeroSection } from "@/components/features/client/coach-hero-section"
import { TodayWorkoutCard } from "@/components/features/client/home/today-workout-card"
import { WeeklySummaryCard } from "@/components/features/client/home/weekly-summary-card"
import { TrainerMessageCard } from "@/components/features/client/home/trainer-message-card"
import { CheckinCard } from "@/components/features/checkin/checkin-card"
import { BlogSection } from "@/components/features/blog/blog-section"
import type { BlogCardPost } from "@/components/features/blog/post-card"
import type { CheckinStatus } from "@/server/services/checkin.service"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface ClientHomeUIProps {
  data: {
    client: { streak: number }
    todayWorkout: any
    week: { summary: { done: number; planned: number }; entries: any[] }
    subscription: { status: any } | null
    progress: {
      currentWeight: number | null
      weightChange: number | null
      totalWorkouts: number
      latestAdherence: string | null
      sessionHistory: any[]
    }
    latestTrainerNotes: string | null
  }
  checkin: CheckinStatus
  posts: BlogCardPost[]
}

function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
  variant = "brand",
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  variant?: "brand" | "performance" | "energy" | "muted"
  delta?: number | null
}) {
  const gradient = {
    brand: "from-brand-500 to-brand-600 ring-brand-500/20",
    performance: "from-performance-500 to-performance-600 ring-performance-500/20",
    energy: "from-energy-500 to-brand-500 ring-energy-500/20",
    muted: "from-muted to-muted ring-border",
  }[variant]
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-medium">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px opacity-60",
          variant === "brand" && "bg-gradient-to-r from-transparent via-brand-500/20 to-transparent",
          variant === "performance" && "bg-gradient-to-r from-transparent via-performance-500/20 to-transparent",
          variant === "energy" && "bg-gradient-to-r from-transparent via-energy-500/20 to-transparent"
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground line-clamp-2 break-words">{label}</p>
          <p className="mt-1 flex min-w-0 items-baseline gap-1.5">
            <span className="min-w-0 flex-1 text-lg sm:text-xl font-extrabold tracking-tight tabular-nums leading-tight break-words">{value}</span>
            {delta !== undefined && delta !== null && delta !== 0 && (
              <span className={cn("inline-flex items-center text-xs font-bold", delta < 0 ? "text-emerald-600" : "text-amber-600")}>
                {delta < 0 ? <TrendingDown className="size-3 me-0.5" /> : <TrendingUp className="size-3 me-0.5" />}
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </p>
          {sub && <p className="mt-1 text-xs break-words text-muted-foreground line-clamp-2">{sub}</p>}
        </div>
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-soft ring-1", `bg-gradient-to-br ${gradient}`)}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

export function ClientHomeUI({ data, checkin, posts }: ClientHomeUIProps) {
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const streak = data.client.streak
  const { done, planned } = data.week.summary
  const pct = planned > 0 ? Math.round((done / planned) * 100) : 0
  const weight = data.progress.currentWeight
  const delta = data.progress.weightChange

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* HERO — full-bleed coach banner with greeting actions */}
      <CoachHeroSection latestPost={posts[0] ?? null} />

      {/* ACTION — today's workout is the hero CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.35 }}>
        <TodayWorkoutCard
          workout={data.todayWorkout}
          displayMode={data.todayWorkout?.workoutDisplayMode ?? "FULL"}
        />
      </motion.div>

      {/* PROGRESS — compact 3-metric rail */}
      <motion.div
        className="grid gap-3 sm:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
          <MetricTile
            icon={Flame}
            label={isAr ? "أيام متتالية" : "Streak"}
            value={`${streak} ${isAr ? "يوم" : "d"}`}
            sub={streak >= 7 ? (isAr ? "حماس عالي" : "on fire") : streak >= 3 ? (isAr ? "استمر" : "keep going") : isAr ? "ابدأ اليوم" : "start today"}
            variant="energy"
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
          <MetricTile
            icon={CalendarCheck}
            label={isAr ? "الأسبوع" : "This week"}
            value={`${done}/${planned}`}
            sub={isAr ? `${pct}% التزام` : `${pct}% done`}
            variant="brand"
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
          <MetricTile
            icon={Scale}
            label={isAr ? "الوزن" : "Weight"}
            value={weight != null ? `${weight.toFixed(1)} kg` : "—"}
            sub={delta != null ? (delta < 0 ? (isAr ? "نزول ممتاز" : "down") : delta > 0 ? (isAr ? "زيادة" : "up") : (isAr ? "ثابت" : "steady")) : (isAr ? "سجّل وزنك" : "log weight")}
            variant={delta != null && delta < 0 ? "performance" : "brand"}
            delta={delta != null ? Number(delta.toFixed(1)) : null}
          />
        </motion.div>
      </motion.div>

      {/* Weekly visual rail — tells the week story */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35 }}>
        <WeeklySummaryCard entries={data.week.entries} planned={planned} done={done} />
      </motion.div>

      {/* TWO COLUMN — recovery + coach */}
      <div className="grid gap-4 lg:grid-cols-5">
        <motion.div className="lg:col-span-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <CheckinCard initial={checkin} />
        </motion.div>
        <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          {data.latestTrainerNotes ? (
            <TrainerMessageCard notes={data.latestTrainerNotes} />
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">{isAr ? "مدربك متابعك — رسائله هتظهر هنا" : "Your coach is watching — messages appear here"}</p>
            </div>
          )}
          <div className="rounded-2xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                <CalendarCheck className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-none">{isAr ? "الالتزام الكلي" : "All-time"}</p>
                <p className="text-xs text-muted-foreground">{data.progress.totalWorkouts} {isAr ? "تمرين" : "workouts"}{data.progress.latestAdherence ? ` • ${data.progress.latestAdherence}` : ""}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CONTENT — blog rail */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <BlogSection posts={posts} />
      </motion.div>
    </div>
  )
}
