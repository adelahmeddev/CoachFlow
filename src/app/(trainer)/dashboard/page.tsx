import { CalendarClock, CheckCircle2, Clock3, Users, Flame, ArrowLeft, Zap, Trophy, Target, Dumbbell, Sparkles } from "lucide-react"
import Link from "next/link"
import { getCurrentSession } from "@/server/auth"
import { getDashboardData } from "@/server/services/dashboard.service"
import { StatCard } from "@/components/features/dashboard/stat-card"
import { RecentClientsVisual } from "@/components/features/dashboard/recent-clients"
import {
  DashboardEmpty,
  DashboardQuickActions,
} from "@/components/features/dashboard/dashboard-empty"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getI18n } from "@/lib/i18n"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: t.dashboard.title,
    description: t.dashboard.subtitle,
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return { ar: "صباح القوة 💪", en: "Morning Power" }
  if (hour < 18) return { ar: "نهارك جامد 🔥", en: "Strong Day" }
  return { ar: "مساء الإنجاز ✨", en: "Evening Grind" }
}

export default async function DashboardPage() {
  const { t, locale } = await getI18n()
  const session = await getCurrentSession()
  const isAr = locale === "ar"
  const greeting = getGreeting()

  const trainerProfileId = session?.user.trainerProfileId
  if (!trainerProfileId) {
    return (
      <div className="space-y-6">
        <DashboardEmpty />
      </div>
    )
  }

  let stats, recentClients: Awaited<ReturnType<typeof getDashboardData>>["recentClients"]
  try {
    const data = await getDashboardData(trainerProfileId)
    stats = data.stats
    recentClients = data.recentClients
  } catch (err) {
    console.error("[dashboard] failed to load", err)
    // Degraded fallback — avoids ErrorBoundary crash from "Connection terminated"
    stats = {
      totalClients: 0,
      pendingAssessment: 0,
      activeClients: 0,
      recentlyAdded: 0,
      deltas: { totalClients: 0, pendingAssessment: 0, activeClients: 0, recentlyAdded: 0 },
    }
    recentClients = []
  }
  const todayStr = new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const pendingCount = stats.pendingAssessment
  const activeCount = stats.activeClients

  return (
    <div className="space-y-6">
      {/* HERO — Coach Workspace Header */}
      <div className="relative overflow-hidden rounded-[24px] border bg-card shadow-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.08] via-energy-500/[0.05] to-transparent" aria-hidden="true" />
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br from-brand-500/20 to-energy-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-12 -bottom-12 size-32 rounded-full bg-gradient-to-br from-muscle-500/10 to-brand-500/10 blur-2xl" aria-hidden="true" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-500/15 dark:bg-brand-500/15 dark:text-brand-300">
                <Flame className="size-3.5" />
                <span>{isAr ? greeting.ar : greeting.en}</span>
                <span className="hidden sm:inline text-brand-600/60 dark:text-brand-300/60">•</span>
                <span className="hidden sm:inline font-medium text-muted-foreground">{todayStr}</span>
              </div>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-[30px] leading-tight">
                {isAr ? (
                  <>
                    أهلاً يا كوتش <span className="bg-gradient-to-r from-brand-600 to-energy-600 bg-clip-text text-transparent">{session?.user.name ?? ""}</span>
                  </>
                ) : (
                  <>Welcome back, <span className="bg-gradient-to-r from-brand-600 to-energy-600 bg-clip-text text-transparent">{session?.user.name ?? ""}</span></>
                )}
              </h1>
              <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
                {pendingCount > 0
                  ? (isAr ? `عندك ${pendingCount} بطل محتاج متابعة النهاردة — خليك سريع 🔥` : `${pendingCount} athletes need your attention today`)
                  : (isAr ? "يومك شكله هادي — وقت تراجع تقدم الأبطال وتجهز برامج جديدة" : "Calm day — perfect to review progress and plan")}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="gap-1.5 bg-white/80 dark:bg-white/5 backdrop-blur">
                  <Trophy className="size-3 text-energy-600" />
                  {activeCount} {isAr ? "بيتمرنوا" : "active"}
                </Badge>
                <Badge variant="outline" className="gap-1.5 bg-white/80 dark:bg-white/5">
                  <Target className="size-3 text-brand-600" />
                  {stats.totalClients} {isAr ? "بطل" : "athletes"}
                </Badge>
                {pendingCount > 0 && (
                  <Badge className="gap-1.5 bg-gradient-to-r from-muscle-500 to-brand-500 text-white shadow-soft animate-pulse-glow">
                    <Zap className="size-3 fill-white/30" />
                    {pendingCount} {isAr ? "محتاج متابعة" : "need check-in"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row shrink-0">
              <DashboardQuickActions />
              <Button asChild className="gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-soft hover:brightness-110">
                <Link href="/clients">
                  <Users className="size-4" />
                  {isAr ? "شوف كل الأبطال" : "All Athletes"}
                  <ArrowLeft className="size-4 rtl:-scale-x-100 hidden sm:inline" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* STATS — Fitness variants */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>*]:animate-in [&>*]:fade-in-50 [&>*]:slide-in-from-bottom-2 motion-reduce:[&>*]:animate-none">
        <div className="contents [&>*]:[animation-delay:0ms]"><StatCard
          label={t.dashboard.totalClients}
          value={stats.totalClients}
          iconName="users"
          delta={stats.deltas.totalClients}
          variant="brand"
          sublabel={isAr ? "إجمالي الأبطال" : "total athletes"}
        /></div>
        <div className="contents [&>*]:[animation-delay:60ms]"><StatCard
          label={t.dashboard.pendingAssessment}
          value={stats.pendingAssessment}
          iconName="clock"
          delta={stats.deltas.pendingAssessment}
          variant="muscle"
          sublabel={isAr ? "محتاج متابعة فورية" : "needs attention"}
        /></div>
        <div className="contents [&>*]:[animation-delay:120ms]"><StatCard
          label={t.dashboard.activeClients}
          value={stats.activeClients}
          iconName="check"
          delta={stats.deltas.activeClients}
          variant="performance"
          sublabel={isAr ? "بيتمرنوا حالياً" : "training now"}
        /></div>
        <div className="contents [&>*]:[animation-delay:180ms]"><StatCard
          label={t.dashboard.recentlyAdded}
          value={stats.recentlyAdded}
          iconName="calendar"
          delta={stats.deltas.recentlyAdded}
          variant="energy"
          sublabel={isAr ? "جداد آخر 30 يوم" : "last 30 days"}
        /></div>
      </div>

      {/* COACH FOCUS — two cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border bg-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between gap-2 py-4 border-b bg-gradient-to-r from-muscle-500/[0.04] to-transparent">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-muscle-500 to-brand-500 text-white shadow-soft">
                <Zap className="size-4" />
              </span>
              <CardTitle className="text-sm font-bold tracking-tight">
                {isAr ? "محتاج تركيزك النهاردة" : "Needs your attention"}
              </CardTitle>
            </div>
            {pendingCount > 0 && (
              <span className="rounded-full bg-muscle-500 px-2.5 py-1 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {pendingCount === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-performance-500/10 text-performance-600">
                  <Trophy className="size-6" />
                </span>
                <p className="text-sm font-semibold">{isAr ? "كله تمام يا كوتش! ✅" : "All caught up!"}</p>
                <p className="text-xs text-muted-foreground max-w-[32ch]">
                  {isAr ? "مفيش متابعات متأخرة — راجع تقدم الأبطال أو جهز برامج جديدة" : "No pending check-ins — review progress or build new programs"}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-1 rounded-xl">
                  <Link href="/clients">{isAr ? "شوف الأبطال" : "View athletes"}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-muscle-200 bg-muscle-50 p-4 dark:border-muscle-800/30 dark:bg-muscle-500/10">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muscle-500 to-brand-500 text-white">
                      <Clock3 className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-none">
                        {isAr ? `${pendingCount} بطل مستني متابعتك` : `${pendingCount} athletes awaiting check-in`}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {isAr ? "المتابعة السريعة بتفرق — كلمة منك ممكن تغيّر يوم البطل" : "Quick check-ins make the difference"}
                      </p>
                      <Button asChild size="sm" className="mt-3 rounded-xl bg-muscle-600 hover:bg-muscle-700">
                        <Link href="/clients?status=pending_assessment">
                          {isAr ? "شوف مين مستني" : "View pending"}
                          <ArrowLeft className="size-4 rtl:-scale-x-100" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "نصيحة الكوتش" : "Coach tip"}</p>
                    <p className="mt-1 text-xs leading-relaxed">{isAr ? "ابدأ بالأبطال اللي بقالهم أكتر من 3 أيام بدون متابعة" : "Start with athletes without check-in for 3+ days"}</p>
                  </div>
                  <div className="rounded-xl border bg-card p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{isAr ? "سريع" : "Quick win"}</p>
                    <p className="mt-1 text-xs leading-relaxed">{isAr ? "ابعت رسالة تشجيع — بتفرق جداً 🔥" : "Send a quick encouragement — it matters 🔥"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border bg-card shadow-soft">
          <CardHeader className="py-4 border-b bg-gradient-to-r from-brand-500/[0.04] to-transparent">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-energy-500 text-white shadow-soft">
                <Dumbbell className="size-4" />
              </span>
              <CardTitle className="text-sm font-bold tracking-tight">{isAr ? "يومك في الجيم" : "Today in the gym"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="rounded-xl bg-gradient-to-br from-brand-500 to-energy-500 p-4 text-white shadow-soft">
              <div className="flex items-center gap-2 text-white/90">
                <Sparkles className="size-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">{isAr ? "حالة اليوم" : "Today"}</span>
              </div>
              <p className="mt-2 text-lg font-extrabold leading-tight">
                {activeCount > 0
                  ? (isAr ? `${activeCount} بطل بيتمرنوا النهاردة` : `${activeCount} athletes training today`)
                  : (isAr ? "يوم هادي — خطط لبكرة" : "Quiet day — plan ahead")}
              </p>
              <p className="mt-1 text-xs text-white/80 leading-relaxed">
                {isAr ? "تابع التزامهم وشجع اللي ملتزم" : "Track adherence and celebrate consistency"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-lg font-extrabold tabular-nums">{stats.totalClients}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{isAr ? "إجمالي" : "total"}</p>
              </div>
              <div className="rounded-xl border bg-muted/40 p-3">
                <p className="text-lg font-extrabold tabular-nums text-performance-600">{activeCount}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">{isAr ? "نشط" : "active"}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full rounded-xl">
              <Link href="/clients?status=active">{isAr ? "شوف النشطين" : "View active"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {recentClients.length === 0 ? (
        <DashboardEmpty />
      ) : (
        <Card className="overflow-hidden border bg-card shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold tracking-tight">{t.dashboard.recentClientsTitle}</CardTitle>
              <span className="hidden sm:inline text-xs text-muted-foreground">— {isAr ? "آخر المنضمين لعيلتك" : "newest members"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {recentClients.length}
              </span>
              <Button asChild variant="ghost" size="sm" className="h-7 gap-1 hidden sm:flex">
                <Link href="/clients">
                  {isAr ? "الكل" : "View all"}
                  <ArrowLeft className="size-3 rtl:-scale-x-100" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <RecentClientsVisual clients={recentClients} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
