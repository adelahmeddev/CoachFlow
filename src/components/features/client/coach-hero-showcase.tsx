"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { Activity, Flame, Lightbulb, Salad } from "lucide-react"
import { useBranding } from "@/components/branding/branding-provider"
import { useI18n } from "@/lib/i18n/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { BlogCardPost } from "@/components/features/blog/post-card"

function coachInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "C"
  )
}

interface CoachHeroShowcaseProps {
  clientName: string
  streak?: number
  latestPost?: BlogCardPost | null
}

/**
 * Unified client-home hero: greeting + streak, coach avatar, and three
 * action pills — replacing the old separate greeting card. The avatar is
 * the coach's personal photo (TrainerProfile.avatarUrl); when missing it
 * falls back to coach initials — never the brand logo.
 */
export function CoachHeroShowcase({ clientName, streak = 0, latestPost = null }: CoachHeroShowcaseProps) {
  const branding = useBranding()
  const { locale } = useI18n()
  const isAr = locale === "ar"
  const [imgFailed, setImgFailed] = useState(false)
  const [tipOpen, setTipOpen] = useState(false)

  const date = new Date().toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const hour = new Date().getHours()
  const greeting = isAr
    ? hour < 12
      ? "صباح القوة"
      : hour < 18
        ? "نهارك جامد"
        : "مساء الإنجاز"
    : hour < 12
      ? "Morning Power"
      : hour < 18
        ? "Strong Day"
        : "Evening Grind"
  const tagline = isAr
    ? streak > 0
      ? `عامل ${streak} يوم متتالي — كمل يا وحش!`
      : "جاهز تكسّر النهاردة؟"
    : streak > 0
      ? `${streak} day streak — keep it up!`
      : "Ready to crush it today?"

  const avatarSrc = !imgFailed && branding.avatarUrl ? branding.avatarUrl : null
  const glow = `${branding.primaryColor}59`

  const pillClass =
    "px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white hover:text-white backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label={branding.brandName}
      className="rounded-3xl border border-white/10 bg-card/40 p-5 shadow-glass backdrop-blur-xl space-y-4"
    >
      {/* Top sub-row: greeting + streak */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {isAr ? "مرحباً" : "Welcome"}, <span className="text-brand-600 dark:text-brand-400">{clientName}</span>
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {date} • {greeting} — {tagline}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-energy-500/10 px-2.5 py-1 text-[11px] font-bold text-energy-600 ring-1 ring-energy-500/20 dark:text-energy-400">
          <Flame className="size-3.5" aria-hidden="true" />
          <span className="tabular-nums">{streak}</span>
        </span>
      </div>

      {/* Core center: coach avatar + identity */}
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div
          className="relative h-28 w-28 shrink-0 rounded-full p-1 ring-2 sm:h-32 sm:w-32"
          style={{ backgroundColor: branding.primaryColor, ["--tw-ring-color" as string]: branding.primaryColor, boxShadow: `0 0 25px ${glow}` }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full bg-muted">
            {avatarSrc ? (
              <img
                key={avatarSrc}
                src={avatarSrc}
                alt={branding.brandName}
                className="h-full w-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand-600 text-3xl font-black text-white dark:bg-brand-500">
                {coachInitials(branding.brandName)}
              </span>
            )}
          </div>
          <span aria-hidden="true" className="absolute bottom-1.5 end-1.5 size-3.5 animate-ping rounded-full bg-emerald-400/60" />
          <span aria-label={isAr ? "متصل" : "Online"} className="absolute bottom-1.5 end-1.5 size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {isAr ? "تدريب فتنس أونلاين" : "Online fitness coaching"}
          </p>
          <h2 className="truncate font-heading text-lg font-bold text-foreground sm:text-xl">
            {branding.brandName}
          </h2>
        </div>
      </div>

      {/* Bottom action row */}
      <div className="flex flex-row flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setTipOpen(true)} className={pillClass}>
          <Lightbulb className="size-3.5 shrink-0" aria-hidden="true" />
          {isAr ? "نصيحة اليوم 💡" : "Today's tip 💡"}
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild className={pillClass}>
          <Link href="/client/nutrition">
            <Salad className="size-3.5 shrink-0" aria-hidden="true" />
            {isAr ? "توجيه غذائي 🥗" : "Nutrition guide 🥗"}
          </Link>
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild className={pillClass}>
          <Link href="/client/messages">
            <Activity className="size-3.5 shrink-0" aria-hidden="true" />
            {isAr ? "متابعة مستمرة 📈" : "Stay on track 📈"}
          </Link>
        </Button>
      </div>

      {/* Daily tip dialog */}
      <Dialog open={tipOpen} onOpenChange={setTipOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{isAr ? "نصيحة اليوم 💡" : "Today's tip 💡"}</DialogTitle>
          </DialogHeader>
          {latestPost ? (
            <div className="space-y-2">
              <p className="text-sm font-bold">{latestPost.title}</p>
              {latestPost.excerpt && <p className="text-sm leading-relaxed text-muted-foreground">{latestPost.excerpt}</p>}
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/client/blog" onClick={() => setTipOpen(false)}>
                  {isAr ? "اقرأ المزيد" : "Read more"}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد نصائح بعد — اسأل مدربك في الرسائل." : "No tips yet — ask your coach in messages."}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTipOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  )
}
