"use client"

import { useI18n } from "@/lib/i18n/client"
import { lookup } from "@/lib/i18n/lookup"
import { 
  Dumbbell, 
  ClipboardCheck, 
  Utensils, 
  Droplets, 
  Flame, 
  Trophy, 
  TrendingUp,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ActionItem {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline"
  badge?: string
  badgeColor?: string
  disabled?: boolean
}

interface DashboardActionCardProps {
  client: {
    id: string
    fullName: string
  }
  data: {
    client: { streak: number }
    todayWorkout: {
      day: { id: string; focus: string } | null
      status: string
      exercises?: any[]
    }
    week: {
      summary: { done: number; planned: number }
      entries: any[]
    }
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
}

export function DashboardActionCard({ client, data }: DashboardActionCardProps) {
  const { t, locale } = useI18n()
  const isAr = locale === "ar"
  const streak = data.client.streak
  const hasWorkoutToday = data.todayWorkout?.day !== null
  const workoutDone = data.week.summary.done
  const workoutPlanned = data.week.summary.planned
  const adherence = data.progress.latestAdherence
  const totalWorkouts = data.progress.totalWorkouts
  const weightChange = data.progress.weightChange

  const hasWorkoutToStart = hasWorkoutToday && data.todayWorkout?.status !== "DONE"
  const hasCheckinDue = data.latestTrainerNotes || (streak > 0 && streak % 7 === 0)
  const hasMealsToLog = true // Would come from nutrition data
  const hydrationTarget = 3000 // ml - would come from user settings
  const hydrationCurrent = 1500 // Would come from daily log

  const actions: ActionItem[] = [
    {
      id: "start-workout",
      label: hasWorkoutToday 
        ? (isAr ? "بدء تمرين اليوم" : "Start Today's Workout")
        : (isAr ? "لا تمرين مجدول اليوم" : "No Workout Scheduled Today"),
      description: hasWorkoutToday
        ? (isAr 
            ? `تركيز: ${data.todayWorkout.day?.focus || "تمرين كامل"} · ${data.todayWorkout.exercises?.length || 0} تمارين`
            : `Focus: ${data.todayWorkout.day?.focus || "Full Body"} · ${data.todayWorkout.exercises?.length || 0} exercises`)
        : (isAr ? "تواصل مع مدربك لجدولة تمرين" : "Contact your coach to schedule a workout"),
      icon: Dumbbell,
      color: "from-brand-500 to-energy-500",
      href: hasWorkoutToday ? `/client/workout/today?dayId=${data.todayWorkout.day?.id}` : "/client/week",
      variant: hasWorkoutToStart ? "primary" : "secondary",
      badge: hasWorkoutToStart ? (isAr ? "جاهز" : "Ready") : undefined,
      badgeColor: "bg-emerald-500",
      disabled: !hasWorkoutToStart,
    },
    {
      id: "check-in",
      label: isAr ? "تسجيل المتابعة الأسبوعية" : "Weekly Check-in",
      description: isAr 
        ? "سجل وزنك، قياساتك، ومستوى طاقتك"
        : "Log weight, measurements, and energy level",
      icon: ClipboardCheck,
      color: "from-muscle-500 to-brand-500",
      href: "/client/check-in",
      variant: "secondary",
      badge: streak > 0 && streak % 7 === 0 ? (isAr ? "مستحق" : "Due") : undefined,
      badgeColor: "bg-amber-500",
    },
    {
      id: "log-nutrition",
      label: isAr ? "تسجيل الوجبات" : "Log Meals",
      description: isAr 
        ? "سجل إفطارك، غداءك، وعشاءك لليوم"
        : "Log your breakfast, lunch, and dinner",
      icon: Utensils,
      color: "from-energy-500 to-performance-500",
      href: "/client/nutrition",
      variant: "secondary",
      badge: isAr ? "يوميًا" : "Daily",
      badgeColor: "bg-sky-500",
    },
    {
      id: "hydration",
      label: isAr ? "تتبع شرب الماء" : "Track Hydration",
      description: isAr 
        ? `${hydrationCurrent}ml / ${hydrationTarget}ml الهدف اليومي`
        : `${hydrationCurrent}ml / ${hydrationTarget}ml daily target`,
      icon: Droplets,
      color: "from-sky-500 to-brand-500",
      href: "/client/hydration",
      variant: "outline",
      badge: `${Math.round((hydrationCurrent / hydrationTarget) * 100)}%`,
      badgeColor: "bg-sky-500",
    },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 
    ? { ar: "صباح القوة 💪", en: "Morning Power" }
    : hour < 18 
      ? { ar: "نهارك جامد 🔥", en: "Strong Day" }
      : { ar: "مساء الإنجاز ✨", en: "Evening Grind" }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <section className="w-full rounded-2xl bg-gradient-to-br from-brand-500 to-energy-500 p-6 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.1] to-energy-500/[0.05]" aria-hidden="true" />
        <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -left-10 -bottom-10 size-24 rounded-full bg-white/05 blur-xl" aria-hidden="true" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-4">
            <Flame className="size-3.5" aria-hidden="true" />
            <span>{isAr ? greeting.ar : greeting.en}</span>
            <span className="size-1.5 rounded-full bg-white/40 ml-1" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {isAr ? "مرحباً بعودتك" : "Welcome back,"}{" "}
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent ml-1">
              {client.fullName}
            </span>
            {streak > 0 && (
              <span className="ml-2 text-xl" aria-label={isAr ? `سلسلة ${streak} أيام` : `${streak} day streak`}>
                🔥
              </span>
            )}
          </h1>
          <p className="mt-2 text-white/90 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            {hasWorkoutToStart 
              ? (isAr 
                  ? `تمارين ${data.todayWorkout.day?.focus || "اليوم"} جاهزة — ابدأ الآن!`
                  : `Today's ${data.todayWorkout.day?.focus || "workout"} is ready — let's go!`)
              : (streak > 0 
                  ? (isAr 
                      ? `سلسلة ${streak} أيام — استمر في العزيمة!`
                      : `${streak} day streak — keep the momentum!`)
                  : (isAr 
                      ? "جاهز لبدء رحلتك اليوم؟"
                      : "Ready to start your journey today?"))}
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill
          icon={Trophy}
          label={isAr ? "تمارين هذا الأسبوع" : "Workouts This Week"}
          value={`${workoutDone}/${workoutPlanned}`}
          color="from-brand-500 to-energy-500"
          trend={workoutDone > 0 ? "+1" : null}
        />
        <StatPill
          icon={Flame}
          label={isAr ? "سلسلة الأيام" : "Streak"}
          value={`${streak} ${isAr ? "يوم" : streak === 1 ? "day" : "days"}`}
          color="from-muscle-500 to-energy-500"
          trend={streak > 0 ? "+1" : null}
        />
        <StatPill
          icon={TrendingUp}
          label={isAr ? "إجمالي التمارين" : "Total Workouts"}
          value={totalWorkouts.toString()}
          color="from-performance-500 to-brand-500"
        />
        <StatPill
          icon={Droplets}
          label={isAr ? "الالتزام" : "Adherence"}
          value={adherence || (isAr ? "—" : "—")}
          color="from-sky-500 to-brand-500"
        />
      </div>

      {/* Action Cards Grid */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-energy-500">
                <TrendingUp className="size-5 text-white" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-semibold">
                {isAr ? "إجراءاتك التالية" : "Your Next Actions"}
              </CardTitle>
            </div>
            <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs">
              <TrendingUp className="size-3" aria-hidden="true" />
              {isAr ? "أولوية" : "Priority"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map((action) => (
              <ActionCard key={action.id} action={action} isAr={isAr} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Trophy}
          label={isAr ? "إجمالي التمارين" : "Total Workouts"}
          value={totalWorkouts.toString()}
          subtitle={isAr ? "طوال الفترة" : "all time"}
          color="from-brand-500 to-energy-500"
        />
        <MetricCard
          icon={TrendingUp}
          label={isAr ? "تغيير الوزن" : "Weight Change"}
          value={weightChange !== null ? `${weightChange > 0 ? "+" : ""}${weightChange}kg` : "—"}
          subtitle={weightChange !== null 
            ? (weightChange > 0 ? (isAr ? "زيادة" : "gained") : (isAr ? "نقصان" : "lost"))
            : (isAr ? "لا توجد بيانات" : "no data")}
          color={weightChange !== null && weightChange < 0 ? "from-emerald-500 to-green-600" : "from-muscle-500 to-brand-500"}
        />
      </div>
    </div>
  )
}

function StatPill({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  trend 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: string
  trend?: string | null
}) {
  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-sm group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" aria-hidden="true" />
      <div className="relative flex flex-col items-center text-center gap-1">
        <div className={`inline-flex items-center justify-center rounded-xl p-2 text-white bg-gradient-to-br ${color} group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="text-2xl font-extrabold tabular-nums text-white group-hover:scale-105 transition-transform duration-300">{value}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</span>
        {trend && (
          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold animate-pulse">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  color 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle: string
  color: string
}) {
  return (
    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0" aria-hidden="true" />
      <div className="relative flex flex-col items-center text-center gap-2">
        <div className={`inline-flex items-center justify-center rounded-xl p-2 text-white bg-gradient-to-br ${color}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <span className="text-2xl font-extrabold tabular-nums text-white">{value}</span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</span>
          <span className="text-[10px] text-white/50">{subtitle}</span>
        </div>
      </div>
    </div>
  )
}

function ActionCard({ 
  action, 
  isAr 
}: { 
  action: any
  isAr: boolean
}) {
  const Icon = action.icon
  const isPrimary = action.variant === "primary"
  const isSecondary = action.variant === "secondary"
  const isOutline = action.variant === "outline"
  const isDisabled = action.disabled

  const baseStyles = cn(
    "relative p-4 rounded-2xl transition-all duration-300 group",
    "bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-sm",
    "hover:border-white/20 hover:shadow-lg hover:shadow-brand-500/10",
    "focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:ring-offset-2 focus-within:ring-offset-background",
    isDisabled && "opacity-50 cursor-not-allowed"
  )

  const buttonStyles = cn(
    "w-full h-full flex flex-col items-start gap-3",
    isPrimary && "bg-gradient-to-br from-brand-500/10 to-energy-500/10 border-brand-500/20",
    isSecondary && "bg-gradient-to-br from-white/5 to-transparent border-white/10",
    isOutline && "bg-transparent border-white/10 hover:bg-white/5",
    isDisabled && "opacity-50 cursor-not-allowed"
  )

return (
    <div className={cn(baseStyles, buttonStyles)} onClick={() => !isDisabled && action.href && window.location.assign(action.href)} style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
      <div className="relative flex items-start gap-3">
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2",
              `bg-gradient-to-br ${action.color}`
            )}>
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white group-hover:text-brand-100 transition-colors">{action.label}</span>
                {action.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      action.badgeColor
                    )}
                  >
                    {action.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/70 leading-relaxed line-clamp-2">{action.description}</p>
              <div className="mt-2 flex items-center gap-1 text-white/50 group-hover:text-white/80 transition-colors">
                <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="text-[11px] font-medium">{isAr ? "افتح" : "Open"}</span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-energy-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" aria-hidden="true" />
        </div>
  )
}